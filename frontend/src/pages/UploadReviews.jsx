import React, { useCallback, useState } from "react";
import * as XLSX from "xlsx";
import Navbar from "../components/Navbar.jsx";
import { endpoints } from "../api/axios.js";
import { HiOutlineCloudArrowUp, HiOutlineDocumentText } from "react-icons/hi2";

export default function UploadReviews() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFile = useCallback((selected) => {
    if (!selected) return;
    setFile(selected);
    setResult(null);
    setError(null);

    // Client-side preview using SheetJS (works for both .xlsx and .csv)
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        setPreview(rows.slice(0, 6));
      } catch {
        setPreview([]);
      }
    };
    reader.readAsArrayBuffer(selected);
  }, []);

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleFile(dropped);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await endpoints.upload(formData);
      setResult(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Upload failed. Check the file format and try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <Navbar
        title="Upload Reviews"
        subtitle="Batch-classify reviews from a CSV or Excel file"
      />

      <div className="p-6 md:p-8 space-y-6">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`glass p-10 flex flex-col items-center justify-center text-center border-2 border-dashed transition-colors cursor-pointer ${
            dragOver ? "border-accent bg-accent/5" : "border-base-border"
          }`}
          onClick={() => document.getElementById("file-input").click()}
        >
          <HiOutlineCloudArrowUp size={40} className="text-accent mb-3" />
          <p className="font-medium text-ink-primary">
            Drag & drop your file here, or click to browse
          </p>
          <p className="text-sm text-ink-muted mt-1">
            Accepts .csv or .xlsx with a review text column
          </p>
          <input
            id="file-input"
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>

        {file && (
          <div className="glass p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HiOutlineDocumentText size={22} className="text-accent" />
                <div>
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-ink-muted">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="bg-accent hover:bg-accent-soft transition-colors text-white text-sm font-medium rounded-xl px-5 py-2.5 disabled:opacity-50"
              >
                {uploading ? "Processing..." : "Upload & Classify"}
              </button>
            </div>

            {preview.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-base-border">
                <table className="w-full text-xs">
                  <tbody>
                    {preview.map((row, i) => (
                      <tr
                        key={i}
                        className={i === 0 ? "bg-white/5 font-medium" : "border-t border-base-border/50"}
                      >
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-2 truncate max-w-[220px]">
                            {String(cell ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="glass p-5 text-sentiment-negative text-sm">{error}</div>
        )}

        {result && (
          <div className="glass p-6">
            <h2 className="font-display font-semibold mb-4">Upload Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <SummaryStat label="Total Rows" value={result.total_rows} />
              <SummaryStat label="Inserted" value={result.inserted} tone="positive" />
              <SummaryStat label="Skipped" value={result.skipped} tone="neutral" />
              <SummaryStat
                label="Positive"
                value={result.sentiment_breakdown.Positive || 0}
                tone="positive"
              />
            </div>
            <div className="flex gap-3 text-sm">
              <span className="text-sentiment-positive">
                Positive: {result.sentiment_breakdown.Positive || 0}
              </span>
              <span className="text-sentiment-negative">
                Negative: {result.sentiment_breakdown.Negative || 0}
              </span>
              <span className="text-sentiment-neutral">
                Neutral: {result.sentiment_breakdown.Neutral || 0}
              </span>
            </div>
            <p className="text-xs text-ink-faint mt-4">
              Head to the Dashboard to see these reviews reflected in the charts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryStat({ label, value, tone }) {
  const toneClass =
    tone === "positive"
      ? "text-sentiment-positive"
      : tone === "neutral"
      ? "text-sentiment-neutral"
      : "text-ink-primary";
  return (
    <div className="bg-base-bg/50 border border-base-border rounded-xl p-4">
      <p className="text-xs text-ink-muted mb-1">{label}</p>
      <p className={`font-mono text-xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
