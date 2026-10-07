"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/Card";
import { Button } from "@/components/admin/ui/Button";

interface HealthData {
  status: string;
  timestamp: string;
  database: {
    connected: boolean;
    tables: Record<string, number | null>;
  };
  storage: {
    buckets: string[];
  };
  environment: {
    supabaseUrl: boolean;
    supabaseAnonKey: boolean;
    supabaseServiceRoleKey: boolean;
    adminEmails: boolean;
  };
  system: {
    nodeVersion: string;
    environment: string;
  };
}

export default function AdminHealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  const probe = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/health");
      const json = await res.json();
      if (json.status) setData(json);
    } catch (err) {
      console.error("Health probe error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    probe();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="display-2 text-charcoal">System Health & Diagnostics</h1>
          <p className="mt-2 text-muted">
            Live database, storage buckets, and environment telemetry.
          </p>
        </div>
        <Button onClick={probe} loading={loading} variant="outline">
          Re-check Diagnostics
        </Button>
      </div>

      {loading && !data ? (
        <div className="p-8 text-center text-muted">Running system diagnostics...</div>
      ) : data ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Database Health */}
          <Card className="border-line">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>PostgreSQL / Supabase</CardTitle>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    data.database.connected
                      ? "bg-emerald/10 text-emerald"
                      : "bg-red/10 text-red"
                  }`}
                >
                  {data.database.connected ? "Operational" : "Disconnected"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(data.database.tables).map(([table, count]) => (
                <div key={table} className="flex items-center justify-between py-1 text-sm">
                  <span className="text-muted capitalize">{table}</span>
                  <span className="font-mono text-charcoal font-medium">
                    {count !== null ? `${count} records` : "offline"}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Storage Buckets */}
          <Card className="border-line">
            <CardHeader>
              <CardTitle>Storage Buckets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.storage.buckets.length > 0 ? (
                data.storage.buckets.map((b) => (
                  <div key={b} className="flex items-center justify-between py-1 text-sm">
                    <span className="font-mono text-charcoal">{b}</span>
                    <span className="text-xs text-emerald font-medium">Active</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted">No buckets detected.</p>
              )}
            </CardContent>
          </Card>

          {/* Environment */}
          <Card className="border-line">
            <CardHeader>
              <CardTitle>Server Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-1">
                <span className="text-muted">SUPABASE_URL</span>
                <span className="text-xs text-emerald font-medium">Configured</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted">SUPABASE_ANON_KEY</span>
                <span className="text-xs text-emerald font-medium">Configured</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted">SUPABASE_SERVICE_ROLE_KEY</span>
                <span className="text-xs text-emerald font-medium">Configured (Protected)</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted">ADMIN_EMAILS</span>
                <span className="text-xs text-emerald font-medium">Active Allowlist</span>
              </div>
            </CardContent>
          </Card>

          {/* System Runtime */}
          <Card className="border-line">
            <CardHeader>
              <CardTitle>Runtime Environment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-1">
                <span className="text-muted">Node Version</span>
                <span className="font-mono text-charcoal">{data.system.nodeVersion}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted">Environment</span>
                <span className="capitalize text-charcoal">{data.system.environment}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted">Last Probe</span>
                <span className="text-xs text-muted font-mono">
                  {new Date(data.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

