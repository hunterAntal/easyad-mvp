"use client";

import "./device-screen.css";
import type { DeviceAlert } from "../data";
import DeviceMediaCarousel, { DeviceMediaSlide } from "./device-media-carousel";
import { DeviceTemplate } from "./device-templates";
import { DeviceClock, PublicInfoPanel, TransitPanel, WeatherPanel } from "./device-widgets";
import { useExpiringClock } from "./use-expiring-clock";
import { FixedLocaleProvider, useI18n } from "../i18n/client";
import type { Locale } from "../i18n/config";

type DeviceScreenProps = {
  inventoryName: string;
  city: string;
  imageInterval: number;
  slides: DeviceMediaSlide[];
  template: DeviceTemplate;
  preview?: boolean;
  displayLanguage?: Locale;
  activeAlert?: DeviceAlert | null;
};

export default function DeviceScreen(props: DeviceScreenProps) {
  const content = <DeviceScreenContent {...props} />;
  return props.displayLanguage ? <FixedLocaleProvider locale={props.displayLanguage}>{content}</FixedLocaleProvider> : content;
}

function DeviceScreenContent({
  inventoryName,
  city,
  imageInterval,
  slides,
  template,
  preview = false,
  displayLanguage,
  activeAlert,
}: DeviceScreenProps) {
  const { t } = useI18n();
  const stopName = `${city} - ${inventoryName}`;
  const media = (
    <div className="device-region media">
      <DeviceMediaCarousel inventoryName={inventoryName} imageInterval={imageInterval} slides={slides} interactive={preview} />
    </div>
  );

  const Root = preview ? "div" : "main";
  const alertClock = useExpiringClock(activeAlert?.status === "active" ? [activeAlert.expiresAt] : []);
  const showAlert = Boolean(activeAlert && activeAlert.status === "active" && Date.parse(activeAlert.expiresAt) > alertClock);

  return (
    <Root className={`device-player${preview ? " device-player-preview" : ""} tpl-${template}${showAlert ? " has-emergency-override" : ""}`} aria-label={`${inventoryName} ${t(preview ? "display preview" : "media player")}`} lang={displayLanguage}>
      {showAlert && activeAlert ? <EmergencyAlertScreen alert={activeAlert} /> : null}
      {!showAlert ? <>
      {template === "weather" ? (
        <>
          <aside className="device-region aside">
            <DeviceClock city={city} />
            <WeatherPanel city={city} seed={inventoryName} />
          </aside>
          {media}
        </>
      ) : null}

      {template === "public-info" ? (
        <>
          {media}
          <aside className="device-region aside">
            <DeviceClock city={city} />
            <PublicInfoPanel city={city} />
          </aside>
        </>
      ) : null}

      {template === "transit" ? (
        <>
          {media}
          <aside className="device-region aside">
            <DeviceClock city={city} />
            <TransitPanel stopName={stopName} seed={inventoryName} />
          </aside>
        </>
      ) : null}

      {template === "community" ? (
        <>
          <header className="device-region top">
            <DeviceClock city={city} />
            <WeatherPanel city={city} seed={inventoryName} compact />
          </header>
          {media}
          <footer className="device-region ticker">
            <TransitPanel stopName={stopName} seed={inventoryName} ticker />
          </footer>
        </>
      ) : null}

      {template === "fullscreen" ? media : null}
      </> : null}
    </Root>
  );
}

function EmergencyAlertScreen({ alert }: { alert: DeviceAlert }) {
  const { formatDate, t } = useI18n();
  const typeLabel = alert.alertType === "amber" ? "AMBER Alert" : alert.alertType === "evacuation" ? "Evacuation notice" : "Public safety alert";
  const expires = formatDate(alert.expiresAt, { hour: "numeric", minute: "2-digit", timeZoneName: "short" });
  return (
    <section className={`emergency-screen emergency-${alert.alertType}`} role="alert" aria-label={`${typeLabel}: ${alert.title}`}>
      <header><span className="emergency-beacon" aria-hidden="true" /><strong>{t(typeLabel)}</strong><span>{t("Screen emergency override")}</span></header>
      <div className="emergency-message">
        <span className="emergency-area">{alert.area}</span>
        <h1>{alert.title}</h1>
        <p>{alert.message}</p>
      </div>
      <footer><span>{t("Issued by {name}", { name: alert.issuedBy })}</span><span>{t("Display until {time}", { time: expires })}</span></footer>
    </section>
  );
}
