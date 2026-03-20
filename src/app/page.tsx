"use client";

import { useState, useEffect } from "react";
import DocumentInfoForm from "@/components/DocumentInfoForm";
import ExperimentList from "@/components/ExperimentList";
import PreviewModal from "@/components/PreviewModal";
import HistoryPanel from "@/components/HistoryPanel";
import { DocumentInfo, Experiment, HistoryEntry } from "@/lib/types";
import { useHistory } from "@/lib/useHistory";
import { Eye, FileDown, FileText, Link2, Check } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import Header from "@/components/Header";
import { loadSavedProfile, useSaveProfile } from "@/lib/useStudentProfile";
import { useShareableLink, readShareFromUrl } from "@/lib/useShareableLink";

const defaultDocInfo: DocumentInfo = {
  courseFullTitle: "",
  studentName: "",
  registerNumber: "",
};

const defaultExperiments: Experiment[] = [
  { id: uuidv4(), serialNo: 1, title: "", date: "", githubLink: "" },
];

export default function Home() {
  const [docInfo, setDocInfo] = useState<DocumentInfo>(defaultDocInfo);
  const [experiments, setExperiments] = useState<Experiment[]>(defaultExperiments);
  const [showPreview, setShowPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState<"pdf" | "docx" | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const { entries, addEntry, deleteEntry, clearAll } = useHistory();
  const saveProfile = useSaveProfile();
  const { copyShareLink } = useShareableLink();

  // Hydrate from shared URL first, then fall back to saved profile
  useEffect(() => {
    const shared = readShareFromUrl();
    if (shared) {
      setDocInfo(shared.docInfo);
      setExperiments(shared.experiments);
      return; // skip profile auto-fill when loading a share
    }
    const profile = loadSavedProfile();
    if (profile.studentName || profile.registerNumber) {
      setDocInfo((prev) => ({
        ...prev,
        studentName: profile.studentName,
        registerNumber: profile.registerNumber,
      }));
    }
  }, []);

  // Persist student identity on every change
  useEffect(() => {
    saveProfile(docInfo.studentName, docInfo.registerNumber);
  }, [docInfo.studentName, docInfo.registerNumber, saveProfile]);

  const handleDownloadPDF = async () => {
    setLoading("pdf");
    try {
      const { generatePDF } = await import("@/lib/generatePdf");
      await generatePDF(docInfo, experiments);
      addEntry(docInfo, experiments);
    } finally {
      setLoading(null);
    }
  };

  const handleDownloadDOCX = async () => {
    setLoading("docx");
    try {
      const { generateDOCX } = await import("@/lib/generateDocx");
      await generateDOCX(docInfo, experiments);
      addEntry(docInfo, experiments);
    } finally {
      setLoading(null);
    }
  };

  const handleLoadEntry = (entry: HistoryEntry) => {
    setDocInfo({ ...entry.docInfo });
    setExperiments(entry.experiments.map((e) => ({ ...e })));
    setShowHistory(false);
  };

  const handleShare = async () => {
    await copyShareLink(docInfo, experiments);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2500);
  };

  const isReady =
    docInfo.courseFullTitle.trim() &&
    docInfo.studentName.trim() &&
    docInfo.registerNumber.trim() &&
    experiments.some((e) => e.title.trim());

  return (
    <div className="app-root">
      {/* Hero Gradient Background */}
      <div className="hero-glow" />

      {/* App Header */}
      <Header onHistoryClick={() => setShowHistory(true)} historyCount={entries.length} />

      {/* Main content */}
      <main className="main-content">
        <div className="content-wrapper">
          {/* Left column */}
          <div className="form-column">
            <div className="card">
              <h2 className="section-title" style={{ marginBottom: "20px" }}>
                LabForge Document Settings
              </h2>
              <DocumentInfoForm docInfo={docInfo} onChange={setDocInfo} />
            </div>
            
            <ExperimentList experiments={experiments} onChange={setExperiments} />
          </div>

          {/* Right sticky panel */}
          <aside className="side-panel">
            <div className="sticky-panel">
              {/* Live preview card */}
              <div className="card summary-card">
                <h3 className="summary-title">Record Summary</h3>
                <div className="summary-row">
                  <span className="summary-label">Course</span>
                  <span className="summary-value" style={{ textAlign: "right", maxWidth: "160px" }}>
                    {docInfo.courseFullTitle || "—"}
                  </span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Student</span>
                  <span className="summary-value">{docInfo.studentName || "—"}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Reg. No.</span>
                  <span className="summary-value">{docInfo.registerNumber || "—"}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Experiments</span>
                  {(() => {
                    const filled = experiments.filter((e) => e.title.trim()).length;
                    return filled > 0
                      ? <span className="summary-value exp-count">{filled}</span>
                      : <span className="summary-value">—</span>;
                  })()}
                </div>
              </div>

              {/* Actions */}
              <div className="actions-card card">
                <h3 className="summary-title">Export</h3>
                <button
                  className="action-btn preview-btn"
                  onClick={() => setShowPreview(true)}
                  disabled={!isReady}
                >
                  <Eye size={17} /> Show Preview
                </button>
                <button
                  className="action-btn pdf-btn"
                  onClick={handleDownloadPDF}
                  disabled={!isReady || loading !== null}
                >
                  <FileDown size={17} />
                  {loading === "pdf" ? "Generating..." : "Download PDF"}
                </button>
                <button
                  className="action-btn docx-btn"
                  onClick={handleDownloadDOCX}
                  disabled={!isReady || loading !== null}
                >
                  <FileText size={17} />
                  {loading === "docx" ? "Generating..." : "Download DOCX"}
                </button>

                {/* Divider */}
                <div className="share-divider" />

                {/* Share button */}
                <button
                  className={`action-btn share-btn${shareCopied ? " share-btn--copied" : ""}`}
                  onClick={handleShare}
                  disabled={!isReady}
                >
                  {shareCopied ? (
                    <><Check size={17} /> Link Copied!</>
                  ) : (
                    <><Link2 size={17} /> Copy Share Link</>
                  )}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {showPreview && (
        <PreviewModal
          docInfo={docInfo}
          experiments={experiments}
          onClose={() => setShowPreview(false)}
        />
      )}

      {showHistory && (
        <HistoryPanel
          entries={entries}
          onLoad={handleLoadEntry}
          onDelete={deleteEntry}
          onClearAll={clearAll}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
