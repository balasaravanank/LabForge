"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

interface CalendarPickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function parseDate(val: string): Date | null {
  if (!val) return null;
  const d = new Date(val + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDisplay(val: string): string {
  const d = parseDate(val);
  if (!d) return "";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function CalendarPicker({ value, onChange }: CalendarPickerProps) {
  const today = new Date();
  const selectedDate = parseDate(value);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState<number>(
    selectedDate?.getFullYear() ?? today.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState<number>(
    selectedDate?.getMonth() ?? today.getMonth()
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Sync view when value changes externally
  useEffect(() => {
    if (selectedDate) {
      setViewYear(selectedDate.getFullYear());
      setViewMonth(selectedDate.getMonth());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function buildGrid(): (number | null)[] {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrev = new Date(viewYear, viewMonth, 0).getDate();
    const grid: (number | null)[] = [];
    // prefix from previous month
    for (let i = firstDay - 1; i >= 0; i--) grid.push(-(daysInPrev - i));
    // current month
    for (let d = 1; d <= daysInMonth; d++) grid.push(d);
    // suffix to fill 6 rows
    let next = 1;
    while (grid.length < 42) grid.push(-(1000 + next++));
    return grid;
  }

  function handleDayClick(day: number) {
    const clicked = new Date(viewYear, viewMonth, day);
    onChange(toYMD(clicked));
    setOpen(false);
  }

  function clearDate() {
    onChange("");
    setOpen(false);
  }

  const grid = buildGrid();

  return (
    <div className="cal-wrap" ref={containerRef}>
      {/* Trigger input */}
      <button
        type="button"
        className={`cal-trigger ${value ? "cal-trigger--filled" : ""}`}
        onClick={() => setOpen(o => !o)}
      >
        <CalendarDays size={15} className="cal-trigger-icon" />
        <span>{value ? formatDisplay(value) : "Pick a date"}</span>
      </button>

      {/* Popup calendar */}
      {open && (
        <div className="cal-popup">
          {/* Month / Year nav */}
          <div className="cal-nav">
            <button type="button" className="cal-nav-btn" onClick={prevMonth}>
              <ChevronLeft size={18} />
            </button>
            <span className="cal-month-label">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button type="button" className="cal-nav-btn" onClick={nextMonth}>
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day headers */}
          <div className="cal-grid">
            {DAYS.map(d => (
              <span key={d} className="cal-day-header">{d}</span>
            ))}

            {/* Day cells */}
            {grid.map((cell, idx) => {
              const isOverflow = cell !== null && cell <= 0;
              if (isOverflow || cell === null) {
                // overflow day from prev/next month
                const display = cell !== null && cell <= 0
                  ? Math.abs(cell) > 900
                    ? Math.abs(cell) - 1000     // next month
                    : Math.abs(cell) + 1        // prev month (wrong, fix below)
                  : 0;
                // Simpler: just show the number from the dummy value
                const prevNum = cell !== null && cell <= -1000
                  ? Math.abs(cell) - 1000
                  : cell !== null
                  ? Math.abs(cell)
                  : 0;
                return (
                  <button key={idx} type="button" className="cal-day cal-day--overflow" disabled>
                    {prevNum}
                  </button>
                );
              }

              const thisDate = new Date(viewYear, viewMonth, cell);
              const isToday = toYMD(thisDate) === toYMD(today);
              const isSelected = value && toYMD(thisDate) === value;

              return (
                <button
                  key={idx}
                  type="button"
                  className={`cal-day ${isSelected ? "cal-day--selected" : ""} ${isToday && !isSelected ? "cal-day--today" : ""}`}
                  onClick={() => handleDayClick(cell)}
                >
                  {cell}
                  {isToday && <span className="cal-today-dot" />}
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="cal-footer">
            <button type="button" className="cal-today-btn" onClick={() => {
              const t = new Date();
              onChange(toYMD(t));
              setViewYear(t.getFullYear());
              setViewMonth(t.getMonth());
              setOpen(false);
            }}>
              Today
            </button>
            {value && (
              <button type="button" className="cal-clear-btn" onClick={clearDate}>
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
