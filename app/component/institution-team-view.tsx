"use client";

import "./institution-team-view.css";
import { useEffect, useState } from "react";
import type { DbUser } from "../lib/db";
import { PanelHeading } from "./shared-ui";
import SecretInput from "./secret-input";
import { useI18n } from "../i18n/client";

type NewOperator = { name: string; email: string; password: string };

export default function InstitutionTeamView({
  institution,
  operators,
  onCreateOperator,
  onDeleteOperator,
}: {
  institution: DbUser;
  operators: DbUser[];
  onCreateOperator: (operator: NewOperator) => Promise<{ user?: DbUser; error?: string }>;
  onDeleteOperator: (id: string) => Promise<boolean>;
}) {
  const { t } = useI18n();
  const [selectedId, setSelectedId] = useState(operators[0]?.id ?? "");
  const [draft, setDraft] = useState<NewOperator>({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const selectedOperator = operators.find((operator) => operator.id === selectedId) ?? operators[0] ?? null;
  const seatsRemaining = Math.max(0, institution.operatorLimit - operators.length);

  useEffect(() => {
    if (!selectedOperator && operators[0]) setSelectedId(operators[0].id);
  }, [operators, selectedOperator]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const result = await onCreateOperator(draft);
    setBusy(false);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    if (result.user) {
      setDraft({ name: "", email: "", password: "" });
      setSelectedId(result.user.id);
      setMessage("Operator account created.");
    }
  }

  async function removeSelected() {
    if (!selectedOperator) return;
    setBusy(true);
    const deleted = await onDeleteOperator(selectedOperator.id);
    setBusy(false);
    setMessage(deleted ? "Operator account deleted. The seat is available again." : "Unable to delete this operator.");
    if (deleted) setSelectedId("");
  }

  return (
    <section className="grid account-management-grid">
      <div className="panel account-list-panel">
        <PanelHeading eyebrow="Institution account management" title="Operator seats" />
        <div className="institution-seat-summary"><strong>{t("{used} of {total}", { used: operators.length, total: institution.operatorLimit })}</strong><span>{t("operator seats in use")}</span></div>
        <div className="account-list" role="list">
          {operators.length ? operators.map((operator) => <button className={`account-list-item ${operator.id === selectedOperator?.id ? "selected" : ""}`} type="button" key={operator.id} onClick={() => { setSelectedId(operator.id); setMessage(""); }}><span><strong>{operator.name}</strong><small>{operator.email}</small></span><span className={`status ${operator.status === "banned" ? "bad" : "good"}`}>{t(operator.status)}</span><small>{t("operator")}</small></button>) : <div className="empty-state"><strong>{t("No operators yet")}</strong><span>{t("Create an operator to manage devices under your institution.")}</span></div>}
        </div>
        <form className="account-create-form" noValidate onSubmit={submit}>
          <span className="eyebrow">{t("Create operator")}</span>
          <label>{t("Name")}<input required value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} /></label>
          <label>{t("Email")}<input required type="email" value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} /></label>
          <SecretInput autoComplete="new-password" label="Temporary password" minLength={10} required secretName="temporary password" value={draft.password} onChange={(event) => setDraft((current) => ({ ...current, password: event.target.value }))} />
          <button className="primary-button" type="submit" disabled={busy || seatsRemaining === 0}>{t(busy ? "Creating..." : seatsRemaining ? "Create operator" : "Seat limit reached")}</button>
        </form>
      </div>

      <div className="panel account-detail-panel">
        {selectedOperator ? <>
          <PanelHeading eyebrow="Selected operator" title={selectedOperator.name} action={<span className={`status ${selectedOperator.status === "banned" ? "bad" : "good"}`}>{t(selectedOperator.status)}</span>} />
          <div className="account-identity"><span>{selectedOperator.email}</span><small>{t("Belongs to {name}", { name: institution.name })}</small></div>
          <section className="account-history-section"><div className="automation-list"><div><strong>{t("Institution boundary")}</strong><span>{t("This operator can only create, update, and upload media for devices under {name}.", { name: institution.name })}</span></div><div><strong>{t("Seat usage")}</strong><span>{t("{remaining} of {total} operator seats remain available.", { remaining: seatsRemaining, total: institution.operatorLimit })}</span></div></div></section>
          <button className="danger-button" type="button" disabled={busy} onClick={() => void removeSelected()}>{t("Delete operator")}</button>
          {message ? <p className="account-message">{t(message)}</p> : null}
        </> : <div className="empty-state"><strong>{t("Select an operator")}</strong><span>{t("Create or choose an operator account to view its institution access.")}</span>{message ? <p className="account-message">{t(message)}</p> : null}</div>}
      </div>
    </section>
  );
}
