"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { isDeviceDisplayPath, useI18n } from "../i18n/client";
import { readCookieConsent, saveCookieConsent, type CookieConsent } from "../lib/cookie-consent";
import "./cookie-consent.css";

export default function CookieConsentBanner() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [preferences, setPreferences] = useState(false);
  const settingsRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const consent = readCookieConsent();
    setPreferences(consent === "preferences");
    setOpen(consent === null);
    setReady(true);
  }, []);

  function save(consent: CookieConsent) {
    saveCookieConsent(consent);
    setPreferences(consent === "preferences");
    setOpen(false);
    setCustomize(false);
    requestAnimationFrame(() => settingsRef.current?.focus());
  }

  if (!ready || isDeviceDisplayPath(pathname)) return null;
  return open ? <section className="cookie-consent" aria-labelledby="cookie-consent-title">
    <h2 id="cookie-consent-title" ref={headingRef} tabIndex={-1}>{t("Your cookie choices")}</h2>
    <p>{t("We use necessary cookies for sign-in, security, your selected language, and your cookie choices. With your permission, optional cookies remember whether to skip the welcome screen.")}</p>
    <p>{t("Your choice is saved for 6 months. You can change it anytime in Cookie settings. Location permission is managed separately by your browser.")}</p>
    {customize && <div className="cookie-consent-options">
      <p><strong>{t("Necessary cookies")}</strong> — {t("Always on")}</p>
      <label><input type="checkbox" checked={preferences} onChange={event => setPreferences(event.target.checked)} /> {t("Remember welcome screen preference")}</label>
    </div>}
    <div className="cookie-consent-actions">
      <button type="button" onClick={() => save("necessary")}>{t("Reject optional")}</button>
      <button type="button" onClick={() => save("preferences")}>{t("Accept optional")}</button>
      {customize
        ? <button type="button" onClick={() => save(preferences ? "preferences" : "necessary")}>{t("Save cookie choices")}</button>
        : <button type="button" onClick={() => setCustomize(true)}>{t("Customize cookies")}</button>}
    </div>
  </section> : <button ref={settingsRef} className="cookie-settings-trigger" type="button" onClick={() => {
    setOpen(true);
    setCustomize(true);
    requestAnimationFrame(() => headingRef.current?.focus());
  }}>{t("Cookie settings")}</button>;
}
