"use client";

import { Plus, RotateCcw } from "lucide-react";
import ExperimentCard from "./ExperimentCard";
import { Experiment } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

interface Props {
  experiments: Experiment[];
  onChange: (exps: Experiment[]) => void;
}

export default function ExperimentList({ experiments, onChange }: Props) {
  const addExperiment = () => {
    const newExp: Experiment = {
      id: uuidv4(),
      serialNo: experiments.length + 1,
      title: "",
      date: "",
      githubLink: "",
    };
    onChange([...experiments, newExp]);
  };

  const updateExperiment = (updated: Experiment) => {
    onChange(experiments.map((e) => (e.id === updated.id ? updated : e)));
  };

  const deleteExperiment = (id: string) => {
    const filtered = experiments.filter((e) => e.id !== id);
    // Re-number after deletion
    onChange(filtered.map((e, i) => ({ ...e, serialNo: i + 1 })));
  };

  const resetExperiments = () => {
    onChange([
      { id: uuidv4(), serialNo: 1, title: "", date: "", githubLink: "" },
    ]);
  };

  return (
    <section className="card">
      <div className="section-header">
        <h2 className="section-title">Experiments</h2>
        <div className="header-actions">
          <button className="icon-btn" onClick={addExperiment} title="Add experiment">
            <Plus size={18} />
          </button>
          <button className="icon-btn" onClick={resetExperiments} title="Reset all experiments">
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <div className="experiments-stack">
        {experiments.map((exp) => (
          <ExperimentCard
            key={exp.id}
            experiment={exp}
            onChange={updateExperiment}
            onDelete={deleteExperiment}
            isOnly={experiments.length === 1}
          />
        ))}
      </div>

      <button className="add-exp-btn" onClick={addExperiment}>
        <Plus size={16} />
        Add Experiment
      </button>
    </section>
  );
}
