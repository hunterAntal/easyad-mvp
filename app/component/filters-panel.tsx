"use client";

import "./filters-panel.css";
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type { Filters } from "../types";
import { FormatKey, InventoryItem, formats } from "../data";
import { CURRENT_LOCATION_ID, MANUAL_LOCATION_ID } from "../utils";
import { useI18n } from "../i18n/client";
import { FILTERS_COOKIE_MAX_AGE, FILTERS_COOKIE_NAME, readBrowserPreference, writeBrowserPreference } from "../lib/preferences";
import { defaultFilters } from "../utils";

type LocationOption = {
  id: string;
  label: string;
};

type FiltersPanelProps = {
  filters: Filters;
  setFilters: Dispatch<SetStateAction<Filters>>;
  selectedLocationId: string;
  setSelectedLocationId: (id: string) => void;
  locationOptions: LocationOption[];
  inventory: InventoryItem[];
};

const collapsedTagCount = 12;

export default function FiltersPanel({
  filters,
  setFilters,
  selectedLocationId,
  setSelectedLocationId,
  locationOptions,
  inventory,
}: FiltersPanelProps) {
  const { formatNumber, locale, t } = useI18n();
  const [tagsExpanded, setTagsExpanded] = useState(false);
  // Starts closed on both the server and the first client render so the markup
  // matches, then adopts the remembered preference.
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Disclosure hides detail, never capability. A filter that is narrowing the
  // results while out of sight would be invisible capability, so the count is
  // always on the button and an active filter opens the group on arrival.
  const activeAdvanced =
    (filters.format !== defaultFilters.format ? 1 : 0) +
    (filters.audience !== defaultFilters.audience ? 1 : 0) +
    (filters.competitor !== defaultFilters.competitor ? 1 : 0) +
    (filters.minImpressions !== defaultFilters.minImpressions ? 1 : 0) +
    (filters.minTraffic !== defaultFilters.minTraffic ? 1 : 0) +
    (filters.minIncome !== defaultFilters.minIncome ? 1 : 0) +
    (filters.selectedTags.length ? 1 : 0) +
    (filters.showCompetitors !== defaultFilters.showCompetitors ? 1 : 0);

  useEffect(() => {
    if (readBrowserPreference(FILTERS_COOKIE_NAME) === "1") setAdvancedOpen(true);
  }, []);

  useEffect(() => {
    if (activeAdvanced > 0) setAdvancedOpen(true);
  }, [activeAdvanced]);

  function toggleAdvanced() {
    setAdvancedOpen((open) => {
      writeBrowserPreference(FILTERS_COOKIE_NAME, open ? "0" : "1", FILTERS_COOKIE_MAX_AGE);
      return !open;
    });
  }
  const audiences = ["all", ...Array.from(new Set(inventory.map((item) => item.audience)))];
  const allTags = useMemo(
    () => Array.from(new Set(inventory.flatMap((item) => item.tags ?? []))).sort((a, b) => a.localeCompare(b)),
    [inventory],
  );
  const visibleTags = useMemo(
    () => allTags.filter((tag, index) => tagsExpanded || index < collapsedTagCount || filters.selectedTags.includes(tag)),
    [allTags, filters.selectedTags, tagsExpanded],
  );
  const hiddenTagCount = allTags.length - visibleTags.length;

  function toggleTag(tag: string) {
    setFilters((current) => ({
      ...current,
      selectedTags: current.selectedTags.includes(tag)
        ? current.selectedTags.filter((entry) => entry !== tag)
        : [...current.selectedTags, tag],
    }));
  }

  return (
    <form className="filter-stack" onSubmit={(event) => event.preventDefault()}>
      <label>
        {t("Location")}
        <select className="select" name="location" value={selectedLocationId} onChange={(event) => setSelectedLocationId(event.target.value)}>
          {selectedLocationId === CURRENT_LOCATION_ID && !locationOptions.some((location) => location.id === CURRENT_LOCATION_ID) ? (
            <option value={CURRENT_LOCATION_ID}>{t("Detecting current location")}</option>
          ) : null}
          {selectedLocationId === MANUAL_LOCATION_ID && !locationOptions.some((location) => location.id === MANUAL_LOCATION_ID) ? (
            <option value={MANUAL_LOCATION_ID}>{t("Selected map area")}</option>
          ) : null}
          {locationOptions.map((location) => <option key={location.id} value={location.id}>{t(location.label)}</option>)}
        </select>
      </label>
      <Range name="radius" label={t("Radius: {count} km", { count: filters.radius })} min={8} max={30} value={filters.radius} onChange={(radius) => setFilters((current) => ({ ...current, radius }))} />
      <Range name="priceMax" label={t("Max daily rate: {amount}", { amount: formatCurrency(filters.priceMax, locale) })} min={300} max={1000} step={20} value={filters.priceMax} onChange={(priceMax) => setFilters((current) => ({ ...current, priceMax }))} />
      <button aria-controls="discover-advanced-filters" aria-expanded={advancedOpen} className="filter-disclosure" onClick={toggleAdvanced} type="button">
        <span>{t("More filters")}</span>
        {activeAdvanced ? <span className="filter-disclosure-count">{activeAdvanced}</span> : null}
        <span aria-hidden="true" className="filter-disclosure-chevron">{advancedOpen ? "\u2212" : "+"}</span>
      </button>
      <div className="filter-advanced" hidden={!advancedOpen} id="discover-advanced-filters">
      <label>
        {t("Format")}
        <select className="select" name="format" value={filters.format} onChange={(event) => setFilters((current) => ({ ...current, format: event.target.value as Filters["format"] }))}>
          <option value="all">{t("All formats")}</option>
          {(Object.keys(formats) as FormatKey[]).map((key) => <option key={key} value={key}>{t(formats[key].label)}</option>)}
        </select>
      </label>
      <label>
        {t("Audience demographics")}
        <select className="select" name="audience" value={filters.audience} onChange={(event) => setFilters((current) => ({ ...current, audience: event.target.value }))}>
          {audiences.map((audience) => <option key={audience} value={audience}>{t(audience === "all" ? "All audiences" : audience)}</option>)}
        </select>
      </label>
      <label>
        {t("Competitor presence")}
        <select className="select" name="competitor" value={filters.competitor} onChange={(event) => setFilters((current) => ({ ...current, competitor: event.target.value as Filters["competitor"] }))}>
          {["all", "Low", "Medium", "High"].map((level) => <option key={level} value={level}>{t(level === "all" ? "Any level" : level)}</option>)}
        </select>
      </label>
      <Range name="minImpressions" label={t("Min impressions: {count}", { count: formatNumber(filters.minImpressions) })} min={0} max={180000} step={10000} value={filters.minImpressions} onChange={(minImpressions) => setFilters((current) => ({ ...current, minImpressions }))} />
      <Range name="minTraffic" label={t("Min traffic: {count}", { count: formatNumber(filters.minTraffic) })} min={0} max={130000} step={5000} value={filters.minTraffic} onChange={(minTraffic) => setFilters((current) => ({ ...current, minTraffic }))} />
      <Range name="minIncome" label={t("Min income: {amount}", { amount: formatCurrency(filters.minIncome, locale) })} min={0} max={140000} step={5000} value={filters.minIncome} onChange={(minIncome) => setFilters((current) => ({ ...current, minIncome }))} />
      <div className="tag-filter-field">
        <div className="tag-filter-heading">
          <span className="field-label">{t("Device tags")}</span>
          {allTags.length ? <span className="helper-text">{t("{count} available", { count: allTags.length })}</span> : null}
        </div>
        {allTags.length ? (
          <>
            <div className="tag-options">
              {visibleTags.map((tag) => {
                const selected = filters.selectedTags.includes(tag);
                return (
                  <button
                    aria-label={t("Filter tag {tag}", { tag: t(tag) })}
                    aria-pressed={selected}
                    className={`tag-chip ${selected ? "selected" : ""}`}
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    type="button"
                  >
                    {t(tag)}
                  </button>
                );
              })}
            </div>
            {allTags.length > collapsedTagCount ? (
              <button className="tag-expand-button" type="button" onClick={() => setTagsExpanded((expanded) => !expanded)}>
                {tagsExpanded ? t("Show fewer tags") : t("Show all tags{more}", { more: hiddenTagCount ? t(" ({count} more)", { count: hiddenTagCount }) : "" })}
              </button>
            ) : null}
          </>
        ) : (
          <span className="helper-text">{t("No device tags available.")}</span>
        )}
      </div>
      <label className="check-row">
        <input type="hidden" name="showCompetitors" value="false" />
        <input type="checkbox" name="showCompetitors" value="true" checked={filters.showCompetitors} onChange={(event) => setFilters((current) => ({ ...current, showCompetitors: event.target.checked }))} />
        {t("Show nearby businesses")}
      </label>
      </div>
    </form>
  );
}

function Range({ label, min, max, step = 1, value, onChange, name }: { label: string; min: number; max: number; step?: number; value: number; onChange: (value: number) => void; name?: string }) {
  return <label>{label}<input name={name} type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}

function formatCurrency(value: number, locale: "en" | "fr") {
  return new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(value);
}
