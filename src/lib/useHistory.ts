"use client";

import { useState, useEffect, useCallback } from "react";
import { HistoryEntry, DocumentInfo, Experiment } from "./types";

const STORAGE_KEY = "lab-record-history";
const MAX_ENTRIES = 50;

function readFromStorage(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function writeToStorage(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // storage quota exceeded — silently skip
  }
}

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    setEntries(readFromStorage());
  }, []);

  const addEntry = useCallback(
    (docInfo: DocumentInfo, experiments: Experiment[], format: "pdf" | "docx") => {
      const newEntry: HistoryEntry = {
        id: crypto.randomUUID(),
        savedAt: new Date().toISOString(),
        format,
        docInfo: { ...docInfo },
        experiments: experiments.map((e) => ({ ...e })),
      };
      setEntries((prev) => {
        const updated = [newEntry, ...prev].slice(0, MAX_ENTRIES);
        writeToStorage(updated);
        return updated;
      });
    },
    []
  );

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      writeToStorage(updated);
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setEntries([]);
    writeToStorage([]);
  }, []);

  return { entries, addEntry, deleteEntry, clearAll };
}
