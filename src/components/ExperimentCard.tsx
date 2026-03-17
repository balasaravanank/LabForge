"use client";

import { Trash2 } from "lucide-react";
import { Experiment } from "@/lib/types";
import CalendarPicker from "@/components/CalendarPicker";

interface Props {
  experiment: Experiment;
  onChange: (exp: Experiment) => void;
  onDelete: (id: string) => void;
  isOnly: boolean;
}

export default function ExperimentCard({ experiment, onChange, onDelete, isOnly }: Props) {
  const set = (field: keyof Experiment) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...experiment, [field]: e.target.value });

  return (
    <div className="experiment-card">
      <div className="exp-card-header">
        <span className="exp-badge">#{String(experiment.serialNo).padStart(2, "0")}</span>
        {!isOnly && (
          <button
            className="icon-btn danger"
            onClick={() => onDelete(experiment.id)}
            title="Remove experiment"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="field-group">
        <label>Experiment Title</label>
        <input
          type="text"
          placeholder="Enter Experiment Title"
          value={experiment.title}
          onChange={set("title")}
        />
      </div>

      <div className="form-grid-two">
        <div className="field-group">
          <label>Date</label>
          <CalendarPicker
            value={experiment.date}
            onChange={(val) => onChange({ ...experiment, date: val })}
          />
        </div>
        <div className="field-group">
          <label>GitHub Link</label>
          <input
            type="url"
            placeholder="https://github.com/..."
            value={experiment.githubLink}
            onChange={set("githubLink")}
          />
        </div>
      </div>
    </div>
  );
}
