"use client";

import React, { useMemo, useState } from "react";
import Papa from "papaparse";
import { adminApi } from "@/services/adminApi";
import { useToast } from "@/hooks/useToast";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type FieldKey =
  | "model_id"
  | "year"
  | "trim"
  | "msrp_base"
  | "msrp_max"
  | "availability_status"
  | "description"
  | "is_featured"
  | "is_active"
  | "primary_image_url"
  | "image_urls";

const REQUIRED_FIELDS: FieldKey[] = [
  "model_id",
  "year",
  "msrp_base",
  "msrp_max",
  "availability_status",
  "is_active",
];

interface Props {
  onClose: () => void;
}

export default function CSVUploadMapper({ onClose }: Props) {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [fieldMap, setFieldMap] = useState<Record<FieldKey, string | "">>({
    model_id: "",
    year: "",
    trim: "",
    msrp_base: "",
    msrp_max: "",
    availability_status: "",
    description: "",
    is_featured: "",
    is_active: "",
    primary_image_url: "",
    image_urls: "",
  });
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imageDelimiter, setImageDelimiter] = useState<";" | "|">(";");
  const [csvDelimiter, setCsvDelimiter] = useState<
    "auto" | "," | ";" | "|" | "\t"
  >("auto");

  const preview = useMemo(() => rows.slice(0, 10), [rows]);

  const canSubmit = useMemo(() => {
    // All required fields must be mapped
    return REQUIRED_FIELDS.every((k) => !!fieldMap[k]);
  }, [fieldMap]);

  function parseCsv(f: File) {
    setParsing(true);
    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      delimiter: csvDelimiter === "auto" ? "" : csvDelimiter,
      transformHeader: (h) => (h ?? "").trim(),
      complete: (res) => {
        const hdrs = (res.meta.fields || []) as string[];
        const data = (res.data || []) as any[];
        setHeaders(hdrs);
        setRows(data);
        setParsing(false);
        if (!hdrs?.length) toast.error("No headers found in CSV");
      },
      error: (err) => {
        console.error("CSV parse error", err);
        setParsing(false);
        toast.error("Failed to parse CSV");
      },
    });
  }

  function validateRow(row: any): string[] {
    const errs: string[] = [];
    const m = fieldMap;

    const model_id = row[m.model_id!];
    const year = Number(row[m.year!]);
    const msrp_base =
      row[m.msrp_base!] !== "" ? Number(row[m.msrp_base!]) : null;
    const msrp_max = row[m.msrp_max!] !== "" ? Number(row[m.msrp_max!]) : null;
    const status = String(row[m.availability_status!] || "");
    const is_active = String(row[m.is_active!] ?? "true").toLowerCase();

    if (!UUID_RE.test(model_id || "")) errs.push("Invalid model_id UUID");
    const currentYear = new Date().getFullYear() + 5;
    if (!Number.isInteger(year) || year < 1990 || year > currentYear)
      errs.push("Invalid year");
    if (msrp_base !== null && Number.isNaN(msrp_base))
      errs.push("Invalid msrp_base");
    if (msrp_max !== null && Number.isNaN(msrp_max))
      errs.push("Invalid msrp_max");
    if (msrp_base !== null && msrp_max !== null && msrp_max < msrp_base)
      errs.push("msrp_max must be >= msrp_base");

    if (!["available", "coming_soon", "discontinued"].includes(status))
      errs.push("Invalid availability_status");

    if (!["true", "false"].includes(is_active)) errs.push("Invalid is_active");

    return errs;
  }

  function transformRow(row: any) {
    const m = fieldMap;
    const obj: any = {
      model_id: row[m.model_id!],
      year: Number(row[m.year!]),
      trim: m.trim ? row[m.trim] || null : null,
      msrp_base:
        row[m.msrp_base!] !== undefined && row[m.msrp_base!] !== ""
          ? Number(row[m.msrp_base!])
          : null,
      msrp_max:
        row[m.msrp_max!] !== undefined && row[m.msrp_max!] !== ""
          ? Number(row[m.msrp_max!])
          : null,
      availability_status: row[m.availability_status!] || "available",
      description: m.description ? row[m.description] || null : null,
      is_featured:
        String(row[m.is_featured!] ?? "false").toLowerCase() === "true",
      is_active: String(row[m.is_active!] ?? "true").toLowerCase() === "true",
    };

    // Optional image fields
    if (m.primary_image_url) {
      const v = String(row[m.primary_image_url] ?? "").trim();
      obj.primary_image_url = v || null;
    }
    if (m.image_urls) {
      const raw = String(row[m.image_urls] ?? "");
      const parts = raw
        .split(imageDelimiter)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      obj.image_urls = parts.length ? parts : null;
    }

    return obj;
  }

  async function handleSubmit() {
    if (!canSubmit) {
      toast.error("Please map all required fields");
      return;
    }
    // Validate all rows
    const allErrors = rows.map(validateRow);
    const hasErrors = allErrors.some((errs) => errs.length > 0);
    if (hasErrors) {
      toast.error("Fix validation errors before submitting");
      return;
    }

    const payload = rows.map(transformRow);
    setSubmitting(true);
    try {
      const res = await adminApi.bulkInsertEvListings(payload);
      toast.success(
        `Inserted: ${res?.summary?.successCount || 0}, Failed: ${
          res?.summary?.failureCount || 0
        }`
      );
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Bulk insert failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold">CSV Upload & Field Mapping</h3>
        <button
          className="text-gray-500 hover:text-gray-700"
          onClick={onClose}
          disabled={submitting}
        >
          ✕
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* File input */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            disabled={parsing || submitting}
          />
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-700">CSV delimiter:</span>
            <select
              className="border rounded px-2 py-1"
              onChange={(e) => {
                const v = e.target.value as "auto" | "," | ";" | "|" | "\t";
                setCsvDelimiter(v);
                if (file) parseCsv(file);
              }}
              value={csvDelimiter}
              disabled={parsing || submitting}
            >
              <option value="auto">Auto detect</option>
              <option value=",">Comma (,)</option>
              <option value=";">Semicolon (;)</option>
              <option value="\t">Tab (\t)</option>
              <option value="|">Pipe (|)</option>
            </select>
          </div>
          <button
            className="px-3 py-2 border rounded-md text-sm"
            onClick={() => file && parseCsv(file)}
            disabled={!file || parsing || submitting}
          >
            Parse CSV
          </button>
        </div>

        {/* Mapping UI */}
        {headers.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              Map CSV columns to database fields:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(Object.keys(fieldMap) as FieldKey[]).map((key) => (
                <div key={key} className="flex items-center gap-2">
                  <label className="w-40 text-sm text-gray-700">{key}</label>
                  <select
                    className="border rounded px-2 py-1 text-sm flex-1"
                    value={fieldMap[key]}
                    onChange={(e) =>
                      setFieldMap((fm) => ({ ...fm, [key]: e.target.value }))
                    }
                  >
                    <option value="">-- Unmapped --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            {fieldMap.image_urls && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-700">Image URLs delimiter:</span>
                <select
                  className="border rounded px-2 py-1"
                  value={imageDelimiter}
                  onChange={(e) => setImageDelimiter(e.target.value as any)}
                >
                  <option value=";">Semicolon (;)</option>
                  <option value="|">Pipe (|)</option>
                </select>
              </div>
            )}
            {!canSubmit && (
              <div className="text-sm text-red-600">
                Please map all required fields: {REQUIRED_FIELDS.join(", ")}
              </div>
            )}
          </div>
        )}

        {/* Preview table */}
        {preview.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              Preview (first 10 rows):
            </div>
            <div className="overflow-x-auto border rounded">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    {headers.map((h) => (
                      <th
                        key={h}
                        className="px-2 py-1 border-b bg-gray-50 text-left"
                      >
                        {h}
                      </th>
                    ))}
                    <th className="px-2 py-1 border-b bg-gray-50 text-left">
                      Errors
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((r, idx) => {
                    const errs = validateRow(r);
                    return (
                      <tr key={idx}>
                        {headers.map((h) => (
                          <td key={h} className="px-2 py-1 border-b">
                            {String(r[h] ?? "")}
                          </td>
                        ))}
                        <td className="px-2 py-1 border-b text-red-600">
                          {errs.join("; ")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          <button
            className="px-3 py-2 border rounded-md text-sm"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm disabled:opacity-50"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting || rows.length === 0}
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
