import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, FileText } from "lucide-react";
import { CONTENT_FILES } from "@/lib/content-files";

export const metadata: Metadata = { title: "Site content — QUANTA Admin" };

export default function AdminContentIndex() {
  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Site content</h1>
          <p className="admin-page-sub">Every headline, label and paragraph on the website, editable in one place.</p>
        </div>
      </div>
      <div className="admin-content">
        <div className="admin-stats-grid">
          {CONTENT_FILES.map((f) => (
            <Link key={f.key} href={`/admin/content/${f.key}`} style={{ textDecoration: "none" }}>
              <div className="admin-stat-card" style={{ cursor: "pointer", minHeight: 150 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <FileText size={18} style={{ color: "var(--admin-accent)" }} />
                  <ArrowUpRight size={13} style={{ color: "var(--admin-text-muted)" }} />
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: "var(--admin-text)" }}>{f.title}</p>
                <p className="admin-stat-label" style={{ marginTop: 6 }}>{f.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
