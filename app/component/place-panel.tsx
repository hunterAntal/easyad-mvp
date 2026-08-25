"use client";

import "./place-panel.css";
import { useEffect, useState } from "react";
import { formats, type InventoryComment, type InventoryItem } from "../data";
import { toast } from "./toast";
import { useI18n } from "../i18n/client";
import { inventoryAvailabilityLabel } from "../lib/inventory-availability";
import { isStaticInventory } from "../lib/inventory-delivery";

export default function PlacePanel({
  item,
  canComment,
  onClose,
}: {
  item: InventoryItem;
  canComment: boolean;
  onClose: () => void;
}) {
  const { formatDate, t } = useI18n();
  const commentsEnabled = item.commentsEnabled !== false;
  const availability = inventoryAvailabilityLabel(item);
  const [comments, setComments] = useState<InventoryComment[]>([]);
  const [loading, setLoading] = useState(commentsEnabled);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!commentsEnabled) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    fetch(`/api/inventory/${item.id}/comments`)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Failed to load comments"))))
      .then((data: { comments: InventoryComment[] }) => {
        if (active) setComments(Array.isArray(data.comments) ? data.comments : []);
      })
      .catch(() => {
        if (active) setComments([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [item.id, commentsEnabled]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || posting) return;
    setPosting(true);
    try {
      const response = await fetch(`/api/inventory/${item.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error ?? "Could not post your comment.");
      }
      const data = await response.json() as { comment: InventoryComment };
      setComments((current) => [...current, data.comment]);
      setDraft("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not post your comment.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div
      className="place-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={t("{name} details", { name: item.name })}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="place-panel">
        <header className="place-header">
          <div>
            <span className="eyebrow">{t(formats[item.format].label)}</span>
            <strong>{item.name}</strong>
            <span className="place-address">{item.address}</span>
            {isStaticInventory(item) ? <span className={`status ${availability === "Available" ? "good" : "bad"}`}>{t(availability)}</span> : null}
          </div>
          <button type="button" className="place-close" aria-label={t("Close")} onClick={onClose}>&times;</button>
        </header>

        <div className="place-photo" role="img" aria-label={t("Photo of {name} (placeholder)", { name: item.name })}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="8.5" cy="10" r="1.6" />
            <path d="M21 16l-5-5L7 19" />
          </svg>
          <span>{t("Photo coming soon")}</span>
        </div>

        {commentsEnabled ? (
          <section className="place-comments">
            <h3>{t("Comments")}</h3>
            <div className="place-comment-list">
              {loading ? (
                <div className="place-comment-empty"><span className="async-spinner" /></div>
              ) : comments.length ? (
                comments.map((comment) => (
                  <div className="place-comment" key={comment.id}>
                    <div className="place-comment-meta">
                      <strong>{comment.authorName}</strong>
                      <span>{formatDate(comment.createdAt)}</span>
                    </div>
                    <p>{comment.body}</p>
                  </div>
                ))
              ) : (
                <div className="place-comment-empty">{t("No comments yet. Be the first to share what you know about this spot.")}</div>
              )}
            </div>
            {canComment ? (
              <form className="place-comment-form" noValidate onSubmit={submit}>
                <textarea
                  className="resize-none"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={t("Add a comment about this location...")}
                  maxLength={1000}
                  rows={2}
                  disabled={posting}
                  aria-label={t("Add a comment")}
                />
                <button type="submit" className="primary-button" disabled={posting || !draft.trim()}>{t(posting ? "Posting..." : "Post")}</button>
              </form>
            ) : (
              <p className="place-comment-signin">{t("Sign in to join the conversation.")}</p>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}
