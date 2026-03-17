"use client";

import { HistoryEntry } from "@/lib/types";
import { X, Trash2, RotateCcw, Clock, FileDown, FileText, Inbox } from "lucide-react";

interface HistoryPanelProps {
  entries: HistoryEntry[];
  onLoad: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }) + " · " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export default function HistoryPanel({
  entries,
  onLoad,
  onDelete,
  onClearAll,
  onClose,
}: HistoryPanelProps) {
  return (
    <>
      {/* Backdrop */}
      <div className="history-overlay" onClick={onClose} />

      {/* Drawer */}
      <aside className="history-drawer">
        {/* Header */}
        <div className="history-drawer-header">
          <div className="history-drawer-title">
            <Clock size={16} />
            <span>History</span>
            {entries.length > 0 && (
              <span className="history-count-badge">{entries.length}</span>
            )}
          </div>
          <div className="history-header-actions">
            {entries.length > 0 && (
              <button
                className="history-clear-btn"
                onClick={() => {
                  if (confirm("Clear all history?")) onClearAll();
                }}
                title="Clear all"
              >
                Clear all
              </button>
            )}
            <button className="icon-btn" onClick={onClose} title="Close">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="history-drawer-body">
          {entries.length === 0 ? (
            <div className="history-empty">
              <Inbox size={40} strokeWidth={1.2} />
              <p>No history yet</p>
              <span>Download a PDF or DOCX to save a record here.</span>
            </div>
          ) : (
            <ul className="history-list">
              {entries.map((entry) => (
                <li key={entry.id} className="history-item">
                  {/* Format badge */}
                  <span
                    className={`history-format-badge ${
                      entry.format === "pdf" ? "badge-pdf" : "badge-docx"
                    }`}
                  >
                    {entry.format === "pdf" ? (
                      <><FileDown size={11} /> PDF</>
                    ) : (
                      <><FileText size={11} /> DOCX</>
                    )}
                  </span>

                  {/* Info */}
                  <div className="history-item-info">
                    <p className="history-item-course">
                      {entry.docInfo.courseFullTitle || "—"}
                    </p>
                    <p className="history-item-meta">
                      {entry.docInfo.studentName} &nbsp;•&nbsp;{" "}
                      {entry.docInfo.registerNumber}
                    </p>
                    <p className="history-item-date">{formatDate(entry.savedAt)}</p>
                    <p className="history-item-exps">
                      {entry.experiments.length} experiment
                      {entry.experiments.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="history-item-actions">
                    <button
                      className="history-load-btn"
                      onClick={() => onLoad(entry)}
                      title="Load this record into the form"
                    >
                      <RotateCcw size={13} />
                      Load
                    </button>
                    <button
                      className="icon-btn danger"
                      onClick={() => onDelete(entry.id)}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
