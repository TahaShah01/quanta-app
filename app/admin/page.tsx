import type { Metadata } from "next";
import { readJSON, listBlogPosts } from "@/lib/content";
import { listAccounts } from "@/lib/portal";
import { getReviewStats } from "@/lib/reviews";
import { getCRMMetrics, listLeads, listTasks } from "@/lib/crm";
import { getMessageStats } from "@/lib/messages";
import type { TeamMember, Project, BlogPost, ClientLogo } from "@/lib/types";
import {
  Users,
  FolderOpen,
  BookOpen,
  ArrowUpRight,
  Zap,
  Building2,
  KeyRound,
  Star,
  Briefcase,
  CheckSquare,
  AlertTriangle,
  Clock,
  Mail,
} from "lucide-react";
import Link from "next/link";

import { Suspense } from "react";
import { connection } from "next/server";

export const metadata: Metadata = { title: "Dashboard — QUANTA Admin" };

function DashboardSkeleton() {
  return (
    <div style={{ opacity: 0.7 }}>
      <div className="admin-stats-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="admin-stat-card" style={{ minHeight: 90, animation: "pulse 1.5s infinite" }}>
            <div style={{ height: 16, width: 16, background: "var(--admin-border)", borderRadius: 4, marginBottom: 12 }} />
            <div style={{ height: 24, width: "60%", background: "var(--admin-border)", borderRadius: 4, marginBottom: 8 }} />
            <div style={{ height: 12, width: "40%", background: "var(--admin-border)", borderRadius: 4 }} />
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
        <div className="admin-card" style={{ height: 220, background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }} />
        <div className="admin-card" style={{ height: 220, background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }} />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Studio Operations Dashboard</h1>
          <p className="admin-page-sub">
            Real-time status across projects, verified client reviews, CRM pipeline, and site content.
          </p>
        </div>
        <div className="admin-actions">
          <Link href="/admin/settings" className="admin-btn admin-btn-ghost admin-btn-sm">
            <Zap size={14} /> Global Settings
          </Link>
          <Link href="/admin/crm" className="admin-btn admin-btn-primary admin-btn-sm">
            <Briefcase size={14} /> Open CRM Pipeline
          </Link>
        </div>
      </div>

      <div className="admin-content">
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent />
        </Suspense>
      </div>
    </div>
  );
}

async function DashboardContent() {
  await connection();
  const team = readJSON<TeamMember[]>("team.json");
  const projects = readJSON<Project[]>("projects.json");
  const blogs = listBlogPosts() as BlogPost[];

  const read = <T,>(file: string): T[] => {
    try {
      return readJSON<T[]>(file);
    } catch {
      return [];
    }
  };

  const clients = read<ClientLogo>("clients.json");
  const accounts = listAccounts();
  const reviewStats = getReviewStats();
  const crmMetrics = getCRMMetrics();
  const messageStats = getMessageStats();
  const allLeads = listLeads();
  const allTasks = listTasks();

  const stats = [
    {
      label: "Inbound Messages",
      value: messageStats.unread > 0 ? `${messageStats.unread} Unread` : messageStats.total,
      icon: Mail,
      href: "/admin/contact",
      hint: messageStats.unread > 0 ? `${messageStats.unread} awaiting email reply` : `${messageStats.total} total inquiries`,
    },
    {
      label: "Pipeline Value",
      value: `$${(crmMetrics.pipelineValue || 0).toLocaleString()}`,
      icon: Briefcase,
      href: "/admin/crm",
      hint: `${crmMetrics.activeLeadsCount} active leads`,
    },
    {
      label: "Active Projects",
      value: projects.filter((p) => p.published).length,
      icon: FolderOpen,
      href: "/admin/projects",
      hint: `${projects.filter((p) => p.featured).length} featured on homepage`,
    },
    {
      label: "Client Reviews",
      value: reviewStats.approved,
      icon: Star,
      href: "/admin/reviews",
      hint: reviewStats.pending > 0 ? `${reviewStats.pending} awaiting moderation` : "All reviews moderated",
    },
    {
      label: "Client Portal Accounts",
      value: accounts.length,
      icon: KeyRound,
      href: "/admin/portal",
      hint: `${accounts.filter((a) => a.active).length} active client logins`,
    },
    {
      label: "Pending CRM Tasks",
      value: crmMetrics.pendingTasksCount,
      icon: CheckSquare,
      href: "/admin/crm",
      hint: crmMetrics.overdueTasksCount > 0 ? `${crmMetrics.overdueTasksCount} overdue` : "Zero overdue",
    },
    {
      label: "Studio Team",
      value: team.length,
      icon: Users,
      href: "/admin/team",
      hint: "Core studio staff",
    },
    {
      label: "Client Logos",
      value: clients.filter((c) => c.published).length,
      icon: Building2,
      href: "/admin/clients",
      hint: "Featured in client wall",
    },
    {
      label: "Published Articles",
      value: blogs.filter((b) => b.published).length,
      icon: BookOpen,
      href: "/admin/blog",
      hint: "Essays and notes",
    },
  ];

  const recentProjects = [...projects].sort((a, b) => b.order - a.order).slice(0, 4);
  const recentLeads = [...allLeads].slice(0, 4);
  const pendingTasks = allTasks.filter((t) => t.status !== "completed").slice(0, 4);

  return (
    <>
        {/* Urgent Action Banners */}
        {messageStats.unread > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 18px",
              background: "rgba(99, 102, 241, 0.12)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              borderRadius: "var(--admin-radius)",
              marginBottom: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Mail size={18} style={{ color: "#6366f1" }} />
              <div>
                <strong style={{ color: "var(--admin-text)", fontSize: 13 }}>
                  {messageStats.unread} unread inbound message{messageStats.unread > 1 ? "s" : ""}
                </strong>
                <p style={{ margin: 0, fontSize: 12, color: "var(--admin-text-muted)" }}>
                  Prospective clients and portal inquiries are waiting for review and email replies.
                </p>
              </div>
            </div>
            <Link href="/admin/contact" className="admin-btn admin-btn-sm" style={{ background: "#6366f1", color: "#fff", fontWeight: 600 }}>
              View & Reply
            </Link>
          </div>
        )}

        {reviewStats.pending > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 18px",
              background: "rgba(245, 158, 11, 0.12)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              borderRadius: "var(--admin-radius)",
              marginBottom: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Clock size={18} style={{ color: "#f59e0b" }} />
              <div>
                <strong style={{ color: "var(--admin-text)", fontSize: 13 }}>
                  {reviewStats.pending} review{reviewStats.pending > 1 ? "s" : ""} awaiting moderation
                </strong>
                <p style={{ margin: 0, fontSize: 12, color: "var(--admin-text-muted)" }}>
                  Verified clients have submitted engagement reviews that require administrative approval before appearing publicly.
                </p>
              </div>
            </div>
            <Link href="/admin/reviews" className="admin-btn admin-btn-sm" style={{ background: "#f59e0b", color: "#000", fontWeight: 600 }}>
              Moderate Reviews
            </Link>
          </div>
        )}

        {crmMetrics.overdueTasksCount > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 18px",
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "var(--admin-radius)",
              marginBottom: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <AlertTriangle size={18} style={{ color: "#ef4444" }} />
              <div>
                <strong style={{ color: "var(--admin-text)", fontSize: 13 }}>
                  {crmMetrics.overdueTasksCount} overdue task{crmMetrics.overdueTasksCount > 1 ? "s" : ""} in Team CRM
                </strong>
                <p style={{ margin: 0, fontSize: 12, color: "var(--admin-text-muted)" }}>
                  Client inquiries or follow-ups need attention from the team.
                </p>
              </div>
            </div>
            <Link href="/admin/crm" className="admin-btn admin-btn-sm" style={{ background: "#ef4444", color: "#fff", fontWeight: 600 }}>
              View Overdue Tasks
            </Link>
          </div>
        )}

        {/* Operational KPI Grid */}
        <div className="admin-stats-grid">
          {stats.map((s) => (
            <Link key={s.label} href={s.href} style={{ textDecoration: "none" }}>
              <div className="admin-stat-card" style={{ cursor: "pointer", transition: "border-color 0.15s" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <s.icon size={18} style={{ color: "var(--admin-accent)" }} />
                  <ArrowUpRight size={13} style={{ color: "var(--admin-text-muted)" }} />
                </div>
                <p className="admin-stat-value">{s.value}</p>
                <p className="admin-stat-label">{s.label}</p>
                {s.hint && (
                  <p style={{ fontSize: 11, color: "var(--admin-text-muted)", marginTop: 4 }}>
                    {s.hint}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* 2-Column Workspaces */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
          {/* Recent Delivery Projects */}
          <div className="admin-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600 }}>Active Projects</h3>
              <Link href="/admin/projects" className="admin-btn admin-btn-ghost admin-btn-sm">Manage All</Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentProjects.map((p) => (
                <div key={p.id} className="admin-recent-item">
                  <div>
                    <span style={{ fontWeight: 500, fontSize: 13, color: "var(--admin-text)" }}>{p.title}</span>
                    <span style={{ fontSize: 11, color: "var(--admin-text-muted)", marginLeft: 8 }}>{p.category}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {p.featured && (
                      <span className="admin-badge admin-badge-yellow" style={{ fontSize: 10 }}>Featured</span>
                    )}
                    <span className={`admin-badge ${p.published ? "admin-badge-green" : "admin-badge-gray"}`}>
                      {p.published ? "Live" : "Draft"}
                    </span>
                  </div>
                </div>
              ))}
              {recentProjects.length === 0 && (
                <p style={{ fontSize: 13, color: "var(--admin-text-muted)" }}>No projects yet.</p>
              )}
            </div>
          </div>

          {/* CRM Pipeline Leads */}
          <div className="admin-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600 }}>Recent Pipeline Inquiries</h3>
              <Link href="/admin/crm" className="admin-btn admin-btn-ghost admin-btn-sm">Pipeline Board</Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentLeads.map((lead) => (
                <div key={lead.id} className="admin-recent-item">
                  <div>
                    <span style={{ fontWeight: 500, fontSize: 13, color: "var(--admin-text)" }}>
                      {lead.organizationName || lead.contactName}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--admin-text-muted)", marginLeft: 8 }}>
                      ${lead.value?.toLocaleString() || "0"}
                    </span>
                  </div>
                  <span
                    className="admin-badge"
                    style={{
                      textTransform: "capitalize",
                      background: lead.stage === "won" ? "rgba(34, 197, 94, 0.15)" : "rgba(99, 102, 241, 0.15)",
                      color: lead.stage === "won" ? "#22c55e" : "#818cf8",
                    }}
                  >
                    {lead.stage}
                  </span>
                </div>
              ))}
              {recentLeads.length === 0 && (
                <p style={{ fontSize: 13, color: "var(--admin-text-muted)" }}>No leads recorded yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Pending Action Items & Tasks */}
        {pendingTasks.length > 0 && (
          <div className="admin-card" style={{ marginTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600 }}>Action Items & Team Follow-ups</h3>
              <Link href="/admin/crm" className="admin-btn admin-btn-ghost admin-btn-sm">
                View All Tasks in CRM
              </Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
              {pendingTasks.map((task) => (
                <div key={task.id} className="admin-recent-item" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                    <span style={{ fontWeight: 500, fontSize: 13, color: "var(--admin-text)" }}>{task.title}</span>
                    <span
                      className={`admin-badge ${
                        task.priority === "urgent" || task.priority === "high"
                          ? "admin-badge-red"
                          : "admin-badge-gray"
                      }`}
                      style={{ fontSize: 10, textTransform: "capitalize" }}
                    >
                      {task.priority}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--admin-text-muted)" }}>
                    Assigned: {task.assignee} &bull; Related: {task.relatedName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Links / Shortcuts */}
        <div className="admin-card" style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Central Control Panel Shortcuts</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {[
              { href: "/admin/crm", label: "Team CRM Workspace" },
              { href: "/admin/reviews", label: "Review Moderation" },
              { href: "/admin/projects", label: "Projects & Portfolio" },
              { href: "/admin/services", label: "Studio Services" },
              { href: "/admin/portal", label: "Client Portal Accounts" },
              { href: "/admin/team", label: "Team Directory" },
              { href: "/admin/clients", label: "Client Logos Wall" },
              { href: "/admin/content", label: "Site Copy & Navigation" },
              { href: "/admin/settings", label: "Site Settings & Social Links" },
            ].map((a) => (
              <Link key={a.label} href={a.href} className="admin-btn admin-btn-ghost admin-btn-sm">
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </>
    );
  }
