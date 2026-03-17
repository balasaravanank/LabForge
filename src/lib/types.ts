export interface HistoryEntry {
  id: string;
  savedAt: string; // ISO timestamp
  format: "pdf" | "docx";
  docInfo: DocumentInfo;
  experiments: Experiment[];
}

export interface DocumentInfo {
  courseFullTitle: string; // e.g. "19AI413-Deep Learning and its Applications(TSEC119)"
  studentName: string;
  registerNumber: string;
}

export interface Experiment {
  id: string;
  serialNo: number;
  title: string;
  date: string;
  githubLink: string;
}
