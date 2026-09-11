"use client";

import "./reports-billing-views.css";
import { Booking, InventoryItem, Transaction } from "../data";
import { deliveredImpressions, money, number, splitRevenue } from "../utils";
import { BookingsTable, EmptyState, Metric, PanelHeading } from "./shared-ui";
import AsyncButton from "./async-button";
import { useI18n } from "../i18n/client";

export function ReportsView({
  bookings,
  inventory,
  transactions,
  onRunDelivery,
  canRunDelivery,
}: {
  bookings: Booking[];
  inventory: InventoryItem[];
  transactions: Transaction[];
  onRunDelivery: () => Promise<boolean>;
  canRunDelivery: boolean;
}) {
  const { locale, formatNumber, t } = useI18n();
  const totalImpressions = bookings.reduce((sum, booking) => {
    const item = inventory.find((unit) => unit.id === booking.inventoryId);
    return sum + (item ? deliveredImpressions(item, booking) : 0);
  }, 0);
  const popRate = Math.round(bookings.reduce((sum, booking) => sum + booking.pop, 0) / Math.max(1, bookings.length));
  const collected = transactions.filter((transaction) => transaction.status === "paid").reduce((sum, transaction) => sum + transaction.amount, 0);
  const cpm = totalImpressions > 0 ? Math.round((bookings.reduce((sum, booking) => sum + booking.spend, 0) / totalImpressions) * 1000) : 0;
  const chartRows = Object.values(bookings.reduce<Record<string, { id: string; name: string; impressions: number }>>((rows, booking) => {
    const item = inventory.find((unit) => unit.id === booking.inventoryId);
    if (!item) return rows;
    const delivered = deliveredImpressions(item, booking);
    const row = rows[item.id] ?? { id: item.id, name: item.name, impressions: 0 };
    row.impressions += delivered;
    rows[item.id] = row;
    return rows;
  }, {})).sort((a, b) => b.impressions - a.impressions).slice(0, 6);
  const chartPeak = chartRows.reduce((peak, row) => Math.max(peak, row.impressions), 0);
  return (
    <section className="grid reports-grid">
      <div className="panel span-2">
        <PanelHeading eyebrow="Campaign analytics and reporting" title="Performance overview" />
        <div className="report-metrics">
          <Metric label="Delivered impressions" value={formatNumber(totalImpressions)} />
          <Metric label="Proof-of-play completion" value={`${popRate}%`} />
          <Metric label="Active campaigns" value={bookings.filter((booking) => ["scheduled", "live"].includes(booking.status)).length} />
          <Metric label="Verified CPM" value={money(cpm, locale)} />
        </div>
        {/* This chart used to plot inventory.impressions, which is the screen's
            own audience figure for screens this account may never have booked.
            Under a "Performance overview" heading that reads as delivered
            results. It now plots what these bookings actually delivered. */}
        {chartRows.length ? (
          <div className="bar-chart">{chartRows.map((row) => <div key={row.id}><span title={row.name}>{row.name}</span><i style={{ height: Math.max(12, row.impressions / Math.max(1, chartPeak) * 150) }} /><small>{formatNumber(row.impressions)}</small></div>)}</div>
        ) : (
          <EmptyState
            title="No delivery to report yet"
            copy="Once a screen owner approves your ad and it starts running, what it delivered appears here."
            action={<a className="primary-button" href="/?role=advertiser&view=discover">{t("Find screens near you")}</a>}
          />
        )}
      </div>
      {canRunDelivery ? (
      <div className="panel">
        <PanelHeading
          eyebrow="PoP logging"
          title="Delivery logs"
          action={<AsyncButton className="ghost-button" disabled={!canRunDelivery} onClick={onRunDelivery} successMessage="Demo delivery tick recorded across active campaigns." errorMessage="Could not record demo delivery. Please try again.">{canRunDelivery ? "Demo: Run delivery tick" : "Operator only"}</AsyncButton>}
        />
        <div className="pop-list">{bookings.map((booking) => <div key={booking.id}><strong>{booking.id}</strong><span>{booking.campaign}</span><meter min={0} max={100} value={booking.pop} /><small>{t("{percent}% verified - {amount} collected platform-wide", { percent: booking.pop, amount: money(collected, locale) })}</small></div>)}</div>
      </div>
      ) : null}
      <div className="panel span-2"><PanelHeading eyebrow="Campaigns" title="Reporting table" /><BookingsTable bookings={bookings} inventory={inventory} /></div>
    </section>
  );
}

export function BillingView({
  bookings,
  transactions,
  onSettle,
  canManage,
  paymentsEnabled = false,
}: {
  bookings: Booking[];
  transactions: Transaction[];
  onSettle: (bookingId: string, action: "pay" | "refund") => Promise<boolean>;
  canManage: boolean;
  paymentsEnabled?: boolean;
}) {
  const { locale, t } = useI18n();
  const rows = bookings.map((booking) => {
    const transaction = transactions.find((entry) => entry.bookingId === booking.id);
    const split = splitRevenue(booking.spend);
    return {
      booking,
      amount: transaction?.amount ?? split.gross,
      platformFee: transaction?.platformFee ?? split.platformFee,
      operatorPayout: transaction?.operatorPayout ?? split.operatorPayout,
      status: transaction?.status ?? (booking.paid ? "paid" : "pending"),
      gatewayRef: transaction?.gatewayRef ?? null,
    };
  });
  const gross = rows.reduce((sum, row) => sum + row.amount, 0);
  const platform = rows.reduce((sum, row) => sum + row.platformFee, 0);
  const operator = rows.reduce((sum, row) => sum + row.operatorPayout, 0);
  const outstanding = rows.filter((row) => row.status !== "paid").length;
  return (
    <section className="grid billing-grid">
      <div className="panel span-2">
        <PanelHeading eyebrow="Offline commercial terms" title="Commercial ledger" />
        <p className="commercial-policy" role="note">
          {paymentsEnabled
            ? t("Demo only: mock charge and refund controls are enabled. Do not use them for real payments.")
            : t("Payment collection is turned off. Record quotes and approvals offline; no card will be charged.")}
        </p>
        <div className="report-metrics">
          <Metric label="Gross billings" value={money(gross, locale)} />
          <Metric label="Platform share" value={money(platform, locale)} />
          <Metric label="Operator payable" value={money(operator, locale)} />
          <Metric label="Open invoices" value={outstanding} />
        </div>
        <div className="inventory-table billing-table">
          <div className="table-head"><span>{t("Reference")}</span><span>{t("Advertiser")}</span><span>{t("Gross")}</span><span>{t("Platform")}</span><span>{t("Operator")}</span><span>{t("Gateway")}</span><span>{t("Status")}</span></div>
          {rows.map(({ booking, amount, platformFee, operatorPayout, status, gatewayRef }) => {
            const paid = status === "paid";
            return (
              <div className="table-row" key={booking.id}>
                <span><strong>INV-{booking.id.replace("BK-", "")}</strong><small>{booking.campaign}</small></span>
                <span>{booking.advertiser}</span>
                <span>{money(amount, locale)}</span>
                <span>{money(platformFee, locale)}</span>
                <span>{money(operatorPayout, locale)}</span>
                <span><small className="gateway-ref">{gatewayRef ?? "-"}</small></span>
                <span>
                  {paymentsEnabled ? (
                    <AsyncButton
                      className={paid ? "paid" : ""}
                      disabled={!canManage}
                      onClick={() => onSettle(booking.id, paid ? "refund" : "pay")}
                      successMessage={paid ? `Invoice INV-${booking.id.replace("BK-", "")} refunded.` : `Invoice INV-${booking.id.replace("BK-", "")} charged.`}
                      errorMessage="Payment gateway error. Please try again."
                    >
                      {paid ? "Paid" : status === "refunded" ? "Refunded" : status === "failed" ? "Retry" : "Demo charge"}
                    </AsyncButton>
                  ) : <span className="commercial-status">{t(status)}</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
