"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/Card";

interface AccessData {
  currentSession: {
    userId: string;
    email: string | null;
    role: string;
  } | null;
  allowList: string[];
}

export default function AdminAccessPage() {
  const [data, setData] = useState<AccessData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/access");
        const json = await res.json();
        if (json.allowList) setData(json);
      } catch (err) {
        console.error("Error loading access data:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="display-2 text-charcoal">Admin Access & Security</h1>
        <p className="mt-2 text-muted">
          Review active administrator identity and authorized server-level allowlists.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted">Loading access records...</div>
      ) : (
        <div className="space-y-6">
          <Card className="border-line">
            <CardHeader>
              <CardTitle>Current Authenticated Session</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-line/60">
                <span className="text-sm text-muted">Operator Email</span>
                <span className="text-sm font-medium text-charcoal">
                  {data?.currentSession?.email || "Authenticated Operator"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-line/60">
                <span className="text-sm text-muted">Assigned Role</span>
                <span className="text-xs uppercase px-2 py-0.5 rounded bg-champagne/10 text-champagne border border-champagne/20">
                  {data?.currentSession?.role || "admin"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted">User ID</span>
                <span className="text-xs font-mono text-muted">
                  {data?.currentSession?.userId || "—"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-line">
            <CardHeader>
              <CardTitle>Configured Admin Allowlist (ADMIN_EMAILS)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted mb-4">
                These email addresses are authorized to access the Admin Control Center when signing in via Supabase Auth.
              </p>
              <div className="divide-y divide-line">
                {data?.allowList.map((email, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <span className="text-sm font-medium text-charcoal">{email}</span>
                    <span className="text-xs text-emerald font-medium">Authorized</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

