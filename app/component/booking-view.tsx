"use client";

import "./booking-view.css";
import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import { Booking, InventoryItem } from "../data";
import type { BookingDraft } from "../types";
import { availableLoopSeconds, bookedLoopSeconds, capitalize, daysBetween, estimateSpend, money, overlaps, reservedLoopSeconds } from "../utils";
import { BookingsTable, Metric, PanelHeading } from "./shared-ui";
import AsyncButton from "./async-button";
import { useI18n } from "../i18n/client";
import { isDigitalInventory, isStaticInventory } from "../lib/inventory-delivery";
import { isInventoryAvailableForDates } from "../lib/inventory-availability";

export default function BookingView({ item, inventory, draft, bookings, setDraft, hasCapacityConflict, onSubmit, canBuy }: {
  item: InventoryItem;
  inventory: InventoryItem[];
  draft: BookingDraft;
  bookings: Booking[];
  setDraft: Dispatch<SetStateAction<BookingDraft>>;
  hasCapacityConflict: (inventoryId: string, start: string, end: string, adSlots?: number, excludeId?: string) => boolean;
  onSubmit: (file: File) => Promise<boolean>;
  canBuy?: boolean;
}) {
  const { formatNumber, locale, t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [creativeImage, setCreativeImage] = useState<File | null>(null);
  const [creativeError, setCreativeError] = useState("");
  const isDigital = isDigitalInventory(item);
  const isStatic = isStaticInventory(item);
  const staticAvailable = !isStatic || isInventoryAvailableForDates(item, draft.start, draft.end);
  const conflict = hasCapacityConflict(item.id, draft.start, draft.end, draft.adSlots);
  const blocked = isStatic ? !staticAvailable : conflict;
  const bookedSeconds = bookedLoopSeconds(item, bookings, draft.start, draft.end);
  const requestedSeconds = reservedLoopSeconds(item, draft.adSlots);
  const remainingSeconds = availableLoopSeconds(item, bookings, draft.start, draft.end);
  const showsLoopCapacity = isDigital;
  const creativeReady = Boolean(creativeImage) && !creativeError;

  function chooseCreative(file: File | null) {
    setCreativeImage(file);
    setCreativeError(file ? validateBookingImage(file, isDigital) : t(isDigital ? "Choose a PNG, JPEG, or GIF image for approval." : "Choose a PNG or JPEG image for approval."));
  }

  function removeCreative() {
    setCreativeImage(null);
    setCreativeError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <section className="grid booking-grid">
      <div className="panel">
        <PanelHeading eyebrow={isStatic ? "Reserve billboard" : "Reserve loop space"} title={item.name} action={<span className={`status ${blocked ? "bad" : "good"}`}>{t(isStatic ? staticAvailable ? "Available" : "Unavailable" : conflict ? "Capacity full" : "Available")}</span>} />
        <div className="form-grid">
          {(["advertiser", "campaign", "start", "end"] as (keyof BookingDraft)[]).map((key) => (
            <label key={key}>
              {t(capitalize(key === "start" ? "Start date" : key === "end" ? "End date" : key))}
              <input type={key === "start" || key === "end" ? "date" : "text"} value={draft[key]} onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))} />
            </label>
          ))}
          <label>
            {t("Ad slots")}
            <input type="number" min={1} max={100} value={draft.adSlots} onChange={(event) => setDraft((current) => ({ ...current, adSlots: Math.max(1, Math.round(Number(event.target.value) || 1)) }))} />
          </label>
        </div>
        <div className="booking-creative-field">
          <label htmlFor="booking-creative-image">
            <strong>{t("Creative image for approval")}</strong>
          </label>
          <small id="booking-creative-requirements">{t(isDigital ? "Required to submit this booking. PNG, JPEG, or animated GIF, up to 50 MB." : "Required to submit this booking. PNG or JPEG, up to 50 MB.")}</small>
          <input
            ref={fileInputRef}
            id="booking-creative-image"
            type="file"
            accept={isDigital ? "image/png,image/jpeg,image/gif" : "image/png,image/jpeg"}
            aria-invalid={creativeError ? "true" : undefined}
            aria-describedby="booking-creative-requirements booking-creative-help booking-creative-error"
            onChange={(event) => chooseCreative(event.target.files?.[0] ?? null)}
          />
          <small id="booking-creative-help">{t("The operator will review this image with the booking request.")}</small>
          {creativeImage ? (
            <div className={`booking-creative-summary${creativeError ? " bad" : ""}`}>
              <span><strong>{creativeImage.name}</strong><small>{formatFileSize(creativeImage.size)}</small></span>
              <button className="secondary-button" type="button" onClick={removeCreative}>{t("Remove")}</button>
            </div>
          ) : null}
          {creativeError ? <span className="form-error" id="booking-creative-error" role="alert">{creativeError}</span> : <span id="booking-creative-error" />}
        </div>
        <div className="quote">
          <Metric label="Estimated spend" value={money(estimateSpend(item, draft.start, draft.end, draft.adSlots), locale)} />
          <Metric label="Run length" value={t("{count} days", { count: daysBetween(draft.start, draft.end) })} />
          <Metric label="Estimated impressions" value={formatNumber(Math.round((item.impressions * daysBetween(draft.start, draft.end)) / 14))} />
          {showsLoopCapacity ? <>
            <Metric label="Reserved loop time" value={`${requestedSeconds}s`} />
            <Metric label="Available loop time" value={`${remainingSeconds}s / ${item.maxLoopSeconds}s`} />
            <Metric label="Booked loop time" value={`${bookedSeconds}s`} />
          </> : null}
        </div>
        <AsyncButton className="primary-button wide" disabled={blocked || !canBuy || !creativeReady} onClick={() => creativeImage ? onSubmit(creativeImage) : Promise.resolve(false)} successMessage="Booking and image submitted for approval." errorMessage="Could not submit this booking. Keep the selected image and try again.">{canBuy ? "Submit booking for approval" : "Sign in as advertiser to buy"}</AsyncButton>
      </div>
      <div className="panel">
        <PanelHeading eyebrow={isStatic ? "Placement availability" : "Shared loop capacity"} title="Schedule check" />
        <div className="timeline large">
          {bookings.filter((booking) => booking.inventoryId === item.id).map((booking) => (
            <div key={booking.id} className={overlaps(draft.start, draft.end, booking.start, booking.end) ? "warning" : ""}>
              <span>{booking.start} {t("to")} {booking.end}</span>
              <strong>{booking.campaign}</strong>
              <small>{t(booking.status)} - {booking.advertiser} - {t(booking.adSlots === 1 ? "{count} slot" : "{count} slots", { count: booking.adSlots })}</small>
            </div>
          ))}
        </div>
      </div>
      <div className="panel span-2">
        <PanelHeading eyebrow="Advertiser dashboard" title="Booking pipeline" />
        <BookingsTable bookings={bookings} inventory={inventory} />
      </div>
    </section>
  );
}

function validateBookingImage(file: File, allowsGif: boolean) {
  if (!file.size) return allowsGif ? "The selected image is empty. Choose another PNG, JPEG, or GIF image." : "The selected image is empty. Choose another PNG or JPEG image.";
  if (file.size > 50 * 1024 * 1024) return "The selected image is larger than 50 MB.";
  const supportedTypes = allowsGif ? ["image/png", "image/jpeg", "image/gif"] : ["image/png", "image/jpeg"];
  if (!supportedTypes.includes(file.type)) return allowsGif ? "Choose a PNG, JPEG, or GIF image." : "Choose a PNG or JPEG image.";
  return "";
}

function formatFileSize(bytes: number) {
  if (bytes < 1048576) return `${Math.max(1, Math.ceil(bytes / 1024))} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}
