"use client";

import { DocumentInfo } from "@/lib/types";

interface Props {
  docInfo: DocumentInfo;
  onChange: (info: DocumentInfo) => void;
}

export default function DocumentInfoForm({ docInfo, onChange }: Props) {
  const set = (field: keyof DocumentInfo) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...docInfo, [field]: e.target.value });
  };

  return (
    <section className="card form-column">
      <div className="section-header">
        <h2 className="section-title">Document Information</h2>
      </div>

      <div className="field-group">
        <label htmlFor="course-title">Course Title and Code</label>
        <input
          id="course-title"
          type="text"
          value={docInfo.courseFullTitle}
          onChange={set("courseFullTitle")}
          placeholder="e.g. 19AI413-Deep Learning and its Applications(TSEC119)"
        />
      </div>
      <div className="form-grid-two">
        <div className="field-group">
          <label>Student Name</label>
          <input
            id="student-name"
            type="text"
            placeholder="Your Full Name"
            value={docInfo.studentName}
            onChange={set("studentName")}
          />
        </div>
        <div className="field-group">
          <label>Register Number</label>
          <input
            id="register-number"
            type="text"
            placeholder="e.g. 212224230031"
            value={docInfo.registerNumber}
            onChange={set("registerNumber")}
          />
        </div>
      </div>
    </section>
  );
}
