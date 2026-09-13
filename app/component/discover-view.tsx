"use client";

import "./discover-view.css";
import { useState, type Dispatch, type SetStateAction } from "react";
import { Booking, InventoryItem, businesses, formats } from "../data";
import type { Filters, MapPoint } from "../types";
import { defaultFilters, formatRatio, mapDistanceKm, money, number } from "../utils";
import FiltersPanel from "./filters-panel";
import MapLibreInventoryMap from "./maplibre-inventory-map";
import PlacePanel from "./place-panel";
import { Meter, Metric, PanelHeading } from "./shared-ui";
import { useI18n } from "../i18n/client";
import { inventoryAvailabilityLabel } from "../lib/inventory-availability";
import { isStaticInventory } from "../lib/inventory-delivery";

export default function DiscoverView(props: {
  filters: Filters;
  setFilters: Dispatch<SetStateAction<Filters>>;
  selectedLocationId: string;
  setSelectedLocationId: (id: string) => void;
  selectedLocation: MapPoint;
  onAreaChange: (point: { x: number; y: number }) => void;
  mapZoom?: number;
  locationOptions: MapPoint[];
  selectedInventory: InventoryItem;
  selectedInventoryId: string;
  setSelectedInventoryId: (id: string) => void;
  visibleInventory: (InventoryItem & { distance: number })[];
  inventory: InventoryItem[];
  bookings: Booking[];
  onBook: () => void;
  canComment?: boolean;
}) {
  const { t } = useI18n();
  const [openPlaceId, setOpenPlaceId] = useState<string | null>(null);
  const openPlace = openPlaceId ? props.inventory.find((item) => item.id === openPlaceId) ?? null : null;
  return (
    <section className="grid discover-grid">
      <div className="panel filters-panel">
        <PanelHeading eyebrow="Filters" title="Narrow your search" action={<button className="ghost-button" type="button" onClick={() => props.setFilters(defaultFilters)}>{t("Reset")}</button>} />
        <FiltersPanel {...props} />
      </div>
      <div className="map-stage">
        <MapLibreInventoryMap
          inventory={props.inventory}
          visibleInventory={props.visibleInventory}
          selectedInventoryId={props.selectedInventoryId}
          selectedLocation={props.selectedLocation}
          radius={props.filters.radius}
          showCompetitors={props.filters.showCompetitors}
          onAreaChange={props.onAreaChange}
          initialZoom={props.mapZoom}
          onSelect={props.setSelectedInventoryId}
          onMarkerOpen={(itemId) => { props.setSelectedInventoryId(itemId); setOpenPlaceId(itemId); }}
        />
      </div>
      <div className="panel list-panel">
        <PanelHeading eyebrow="Inventory" title={t("{count} matches", { count: props.visibleInventory.length })} />
        <div className="inventory-list">
          {props.visibleInventory.map((item) => (
            <InventoryCard key={item.id} item={item} selected={item.id === props.selectedInventoryId} onSelect={props.setSelectedInventoryId} />
          ))}
        </div>
      </div>
      <div className="panel detail-panel">
        <InventoryDetail item={props.selectedInventory} bookings={props.bookings} onBook={props.onBook} />
      </div>
      {openPlace ? (
        <PlacePanel item={openPlace} canComment={Boolean(props.canComment)} onClose={() => setOpenPlaceId(null)} />
      ) : null}
    </section>
  );
}

function InventoryCard({ item, selected, onSelect }: { item: InventoryItem & { distance: number }; selected: boolean; onSelect: (id: string) => void }) {
  const { locale, formatNumber, t } = useI18n();
  const availability = inventoryAvailabilityLabel(item);
  return (
    <button className={`inventory-card ${selected ? "selected" : ""}`} type="button" onClick={() => onSelect(item.id)}>
      <div>
        <strong>{item.name}</strong>
        <span>{item.address}</span>
      </div>
      <div className="card-meta">
        <span>{t(formats[item.format].label)}</span>
        <span>{t("{amount}/day", { amount: money(item.price, locale) })}</span>
      </div>
      {isStaticInventory(item) ? <span className={`status ${availability === "Available" ? "good" : "bad"}`}>{t(availability)}</span> : null}
      {/* Four tag chips on each of eight cards is 32 chips in a scanning list,
          and the format tag repeats the format line directly above it. The
          list carries what you scan by; the detail panel below still lists
          every tag for the selected screen. */}
      <Meter value={item.occupancy} />
      <div className="card-stats">
        <span>{t("{count} impressions", { count: formatNumber(item.impressions) })}</span>
        <span>{Math.round(item.distance)} km</span>
      </div>
    </button>
  );
}

function InventoryDetail({ item, bookings, onBook }: { item: InventoryItem; bookings: Booking[]; onBook: () => void }) {
  const { locale, formatNumber, t } = useI18n();
  const spec = formats[item.format];
  const campaigns = bookings.filter((booking) => booking.inventoryId === item.id);
  const availability = inventoryAvailabilityLabel(item);
  return (
    <>
      <PanelHeading eyebrow={item.operator} title={item.name} action={<button className="primary-button" onClick={onBook}>{t("Book")}</button>} />
      <div className="detail-grid stat-tiles">
        <Metric label="Format" value={t(spec.label)} />
        <Metric label="Rate" value={t("{amount}/day", { amount: money(item.price, locale) })} />
        <Metric label="Impressions" value={formatNumber(item.impressions)} />
        <Metric label="Traffic" value={formatNumber(item.traffic)} />
        {isStaticInventory(item) ? <Metric label="Status" value={t(availability)} /> : null}
      </div>
      {/* Income index, audience, competitor presence and nearby-business counts
          are planning figures for a media buyer, not the four numbers a person
          decides a booking on. The full profile still carries every one of
          them, so this defers detail without removing capability. */}
      <a className="detail-profile-link" href={`/inventory/${item.id}`}>{t("See everything about this screen")}</a>
      <div className="spec-box">
        <strong>{t("Creative spec")}</strong>
        <span>{t(spec.spec)}</span>
        <span>{t("Aspect ratio {ratio} with {percent}% safe zone.", { ratio: formatRatio(spec.ratio), percent: spec.safeZone })}</span>
      </div>
      {item.tags?.length ? <div className="device-tag-list detail-tags">{item.tags.map((tag) => <span key={tag}>{t(tag)}</span>)}</div> : null}
      <div className="timeline">
        {campaigns.length ? campaigns.map((booking) => (
          <div key={booking.id}>
            <span>{booking.start} {t("to")} {booking.end}</span>
            <strong>{booking.campaign}</strong>
            <small>{t(booking.status)}</small>
          </div>
        )) : (
          <div>
            <span>{t("No confirmed bookings")}</span>
            <strong>{t(isStaticInventory(item) ? availability : "Available")}</strong>
            <small>{item.availableFrom} {t("to")} {item.availableTo}</small>
          </div>
        )}
      </div>
    </>
  );
}
