"use client";

import { X, ExternalLink } from "lucide-react";
import { DocumentInfo, Experiment } from "@/lib/types";
import Image from "next/image";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface Props {
  docInfo: DocumentInfo;
  experiments: Experiment[];
  onClose: () => void;
}

function formatDate(d: string): string {
  if (!d) return "";
  if (d.includes("/")) return d;
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

export default function PreviewModal({ docInfo, experiments, onClose }: Props) {
  const [qrMap, setQrMap] = useState<Record<string, string>>({});

  useEffect(() => {
    async function genQRs() {
      const map: Record<string, string> = {};
      for (const exp of experiments) {
        if (exp.githubLink) {
          try {
            map[exp.id] = await QRCode.toDataURL(exp.githubLink, { width: 80, margin: 1 });
          } catch {}
        }
      }
      setQrMap(map);
    }
    genQRs();
  }, [experiments]);

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal-box">
        {/* Modal chrome header */}
        <div className="modal-header">
          <span className="modal-title">Preview — Lab Record</span>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Document preview body — styled like the actual Word document */}
        <div className="modal-body">
          <div className="doc-preview">

            {/* College header image */}
            <div className="doc-logo">
              <Image
                src="/saveetha-logo.png"
                alt="Saveetha Engineering College"
                width={600}
                height={146}
                style={{ maxWidth: "100%", height: "auto", display: "block", margin: "0 auto" }}
                priority
              />
            </div>

            {/* Course title — Times New Roman, Bold, 18pt */}
            <p className="doc-course-title">
              {docInfo.courseFullTitle || <span style={{ color: "#aaa" }}>Course Title</span>}
            </p>

            {/* Table of content — Bold, 16pt */}
            <p className="doc-toc-label">Table of content</p>

            {/* Experiment table — plain borders, Times New Roman */}
            <table className="doc-table">
              <colgroup>
                <col /><col /><col /><col /><col /><col />
              </colgroup>
              <thead>
                <tr>
                  <th className="doc-th">Exp</th>
                  <th className="doc-th">Date</th>
                  <th className="doc-th doc-th-wide">Name of The Experiment</th>
                  <th className="doc-th">QR Code</th>
                  <th className="doc-th">Mark</th>
                  <th className="doc-th">Signature</th>
                </tr>
              </thead>
              <tbody>
                {experiments.map((exp) => (
                  <tr key={exp.id}>
                    <td className="doc-td doc-td-center">{String(exp.serialNo).padStart(2, "0")}</td>
                    <td className="doc-td doc-td-center">{formatDate(exp.date)}</td>
                    <td className="doc-td">
                      <div className="doc-exp-title">{exp.title}</div>
                      {exp.githubLink && (
                        <div>
                          <a
                            href={exp.githubLink}
                            target="_blank"
                            rel="noreferrer"
                            className="doc-exp-link"
                          >
                            <ExternalLink size={9} style={{ display: "inline", marginRight: 2, verticalAlign: "middle" }} />
                            {exp.githubLink}
                          </a>
                        </div>
                      )}
                    </td>
                    <td className="doc-td doc-td-center">
                      {qrMap[exp.id] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={qrMap[exp.id]} alt="QR" style={{ width: 55, height: 55, display: "block", margin: "0 auto" }} />
                      )}
                    </td>
                    <td className="doc-td" />
                    <td className="doc-td" />
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Declaration */}
            <p className="doc-declaration">
              I confirm that the experiments and GitHub links provided are entirely my own work.
            </p>

            {/* Name + Register row */}
            <div className="doc-sign-row">
              <span>Name : {docInfo.studentName}</span>
              <span>Register Number : {docInfo.registerNumber}</span>
            </div>

            {/* Date + Signature row */}
            <div className="doc-sign-row">
              <span>Date : </span>
              <span>Learner&apos;s Signature</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
