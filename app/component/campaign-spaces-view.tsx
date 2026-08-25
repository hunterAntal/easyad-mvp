"use client";

import "./campaign-spaces-view.css";
import type { Booking, InventoryItem } from "../data";
import type { DbUser } from "../lib/db";
import { money, reservedLoopSeconds } from "../utils";
import { Meter, PanelHeading } from "./shared-ui";
import { useI18n } from "../i18n/client";
import { isDigitalInventory } from "../lib/inventory-delivery";

export default function CampaignSpacesView({
  bookings,
  inventory,
  currentUser,
  onOpenCreative,
}: {
  bookings: Booking[];
  inventory: InventoryItem[];
  currentUser?: DbUser | null;
  onOpenCreative: (booking: Booking) => void;
}) {
  const { locale, t } = useI18n();
  const visibleBookings = bookings
    .filter((booking) => booking.status !== "rejected")
    .filter((booking) => !currentUser || currentUser.role === "admin" || booking.advertiser === currentUser.name);

  return (
    <section className="grid booking-grid">
      <div className="panel span-2">
        <PanelHeading eyebrow="Advertiser reserved spaces" title="Campaign inventory" />
        <div className="inventory-table campaign-space-table">
          <div className="table-head"><span>{t("Campaign")}</span><span>{t("Device")}</span><span>{t("Dates")}</span><span>{t("Loop reserved")}</span><span>{t("Status")}</span><span>{t("Creative")}</span><span>{t("Actions")}</span></div>
          {visibleBookings.length ? visibleBookings.map((booking) => {
            const item = inventory.find((unit) => unit.id === booking.inventoryId);
            const isDigital = item ? isDigitalInventory(item) : false;
            const reservedSeconds = item ? reservedLoopSeconds(item, booking.adSlots) : 0;
            const capacity = item?.maxLoopSeconds ?? 0;
            const capacityPercent = capacity ? Math.min(100, Math.round((reservedSeconds / capacity) * 100)) : 0;
            return (
              <div className="table-row" key={booking.id}>
                <span><strong>{booking.campaign}</strong><small>{booking.advertiser} - {money(booking.spend, locale)}</small></span>
                <span>{item?.name ?? booking.inventoryId}<small>{item?.address ?? t("Inventory record")}</small></span>
                <span>{booking.start}<small>{booking.end}</small></span>
                <span>{isDigital ? <><Meter value={capacityPercent} />{t("{reserved}s of {capacity}s", { reserved: reservedSeconds, capacity })}<small>{t(booking.adSlots === 1 ? "{count} slot" : "{count} slots", { count: booking.adSlots })} {t("at")} {item?.imageInterval ?? 0}s</small></> : <><strong>{t("Static placement")}</strong><small>{t("No playback loop")}</small></>}</span>
                <span><span className="status">{t(booking.status)}</span></span>
                <span>{t(booking.creativeStatus)}<small>{t("Submission state")}</small></span>
                <div className="campaign-space-actions">
                  <button className="secondary-button" type="button" onClick={() => onOpenCreative(booking)}>{t("Creative")}</button>
                  {isDigital ? <a className="secondary-button" href={`/inventory/${booking.inventoryId}`}>{t("Inventory")}</a> : null}
                </div>
              </div>
            );
          }) : (
            <div className="empty-state">
              <strong>{t("No campaign spaces yet")}</strong>
              <span>{t("Submit a booking with its creative image to start the approval workflow.")}</span>
            </div>
          )}
        </div>
      </div>
      <div className="panel">
        <PanelHeading eyebrow="Creative assignment" title="Reserved devices" />
        <div className="automation-list">
          <div><strong>{t("Shared capacity")}</strong><span>{t("Multiple advertisers can reserve the same dates while the loop stays under device capacity.")}</span></div>
          <div><strong>{t("Device actions")}</strong><span>{t("Open the creative suite or inspect the reserved device inventory profile.")}</span></div>
          <div><strong>{t("Operator controls")}</strong><span>{t("Loop interval and maximum loop capacity are managed from inventory.")}</span></div>
        </div>
      </div>
    </section>
  );
}
