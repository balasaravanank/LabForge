import React from "react";
import { History } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface HeaderProps {
  onHistoryClick: () => void;
  historyCount: number;
}

export default function Header({ onHistoryClick, historyCount }: HeaderProps) {
  return (
    <div className="pill-header-container">
      <header className="pill-header">
        <div className="header-logo-group">
          <span className="brand-title">LabForge</span>
        </div>

        <div className="header-actions-group">
          <ThemeToggle />
          <button
            className="header-history-btn"
            onClick={onHistoryClick}
            title="View history"
          >
            <History size={14} />
            <span>History</span>
            {historyCount > 0 && (
              <span className="header-history-badge">{historyCount}</span>
            )}
          </button>
        </div>
      </header>
    </div>
  );
}
