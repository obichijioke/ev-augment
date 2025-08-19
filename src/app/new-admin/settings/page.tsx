"use client";

import React, { useEffect, useState } from "react";
import { adminApi } from "@/services/adminApi";
import { AlertTriangle, Save } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

export default function NewAdminSettingsPage() {
  const { isAdmin } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<any[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    adminApi
      .getSettings()
      .then((res: any) => setSettings(res.data || res.data?.settings || []))
      .catch((e) => setError(e?.message || "Failed to load settings"))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const save = async () => {
    try {
      await adminApi.updateSettings({ settings });
      alert("Settings saved");
    } catch (e: any) {
      setError(e.message || "Save failed");
    }
  };

  if (!isAdmin) return <div className="p-6 border bg-white rounded">Admin only</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">System Settings</h1>

      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white border rounded-lg p-4 space-y-3">
        {loading ? (
          <div className="h-24 bg-gray-100 animate-pulse rounded" />
        ) : settings.length === 0 ? (
          <div className="text-gray-600">No settings found</div>
        ) : (
          settings.map((s, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
              <div className="text-sm text-gray-600">{s.key}</div>
              <input
                className="border rounded px-2 py-1 text-sm md:col-span-2"
                value={s.value ?? ""}
                onChange={(e) => setSettings((prev) => prev.map((x, i) => i === idx ? { ...x, value: e.target.value } : x))}
              />
            </div>
          ))
        )}

        <div className="pt-2">
          <button className="px-3 py-2 border rounded-md text-sm flex items-center gap-2" onClick={save}>
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

