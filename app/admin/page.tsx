import type { Metadata } from "next";
import { readJSON } from "@/lib/content";
import { listBlogPosts } from "@/lib/content";
import { listAccounts } from "@/lib/portal";
import type { TeamMember, Project, Testimonial, BlogPost, Partner, ClientLogo } from "@/lib/types";
import { Users, FolderOpen, MessageSquareQuote, BookOpen, ArrowUpRight, Zap, Handshake, Building2, KeyRound, Star } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Dashboard — QUANTA Admin" };

export default function AdminDashboard() {
  const team = readJSON<TeamMember[]>("team.json");
  const projects = readJSON<Project[]>("projects.json");
  const testimonials = readJSON<Testimonial[]>("testimonials.json");
  const blogs = listBlogPosts() as BlogPost[];
  const read = <T,>(file: string): T[] => {
    try {
      return readJSON<T[]>(file);
    } catch {
      return [];
    }
  };
  const partners = read<Partner>("partners.json");
  const clients = read<ClientLogo>("clients.json");
  const accounts = listAccounts();

  const stats = [
    { label: "Team Members", value: team.length, icon: Users, href: "/admin/team", color: "purple" },
    { label: "Projects", value: projects.length, icon: FolderOpen, href: "/admin/projects", color: "blue" },
    { label: "Testimonials", value: testimonials.length, icon: MessageSquareQuote, href: "/admin/testimonials", color: "green" },
    { label: "Blog Posts", value: blogs.length, icon: BookOpen, href: "/admin/blog", color: "orange" },
    { label: "On homepage", value: projects.filter((p) => p.featured && p.published).length, icon: Star, href: "/admin/projects", color: "blue" },
    { label: "Partners shown", value: partners.filter((p) => p.published).length, icon: Handshake, href: "/admin/partners", color: "purple" },
    { label: "Clients shown", value: clients.filter((c) => c.published).length, icon: Building2, href: "/admin/clients", color: "green" },
    { label: "Portal logins", value: accounts.length, icon: KeyRound, href: "/admin/portal", color: "orange" },
  ];

  const recentProjects = [...projects].sort((a, b) => b.order - a.order).slice(0, 3);
  const recentPosts = [...blogs].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()).slice(0, 3);

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-sub">Welcome back. Here&apos;s what&apos;s happening with your site.</p>
        </div>
        <div className="admin-actions">
          <Link href="/admin/settings" className="admin-btn admin-btn-ghost admin-btn-sm">
            <Zap size={14} /> Quick Settings
          </Link>
        </div>
      </div>

      <div className="admin-content">
        {/* Stats */}
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
              </div>
            </Link>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Recent Projects */}
          <div className="admin-card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600 }}>Recent Projects</h3>
              <Link href="/admin/projects" className="admin-btn admin-btn-ghost admin-btn-sm">Manage</Link>
            </div>
            {recentProjects.map((p) => (
              <div key={p.id} className="admin-recent-item">
                <div>
                  <span style={{ fontWeight: 500, fontSize: 13, color: "var(--admin-text)" }}>{p.title}</span>
                  <span style={{ fontSize: 11, color: "var(--admin-text-muted)", marginLeft: 8 }}>{p.category}</span>
                </div>
                <span className={`admin-badge ${p.published ? "admin-badge-green" : "admin-badge-gray"}`}>
                  {p.published ? "Live" : "Draft"}
                </span>
              </div>
            ))}
            {recentProjects.length === 0 && <p style={{ fontSize: 13, color: "var(--admin-text-muted)" }}>No projects yet.</p>}
          </div>

          {/* Recent Blog Posts */}
          <div className="admin-card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600 }}>Recent Posts</h3>
              <Link href="/admin/blog" className="admin-btn admin-btn-ghost admin-btn-sm">Manage</Link>
            </div>
            {recentPosts.map((p) => (
              <div key={p.id} className="admin-recent-item">
                <div>
                  <span style={{ fontWeight: 500, fontSize: 13, color: "var(--admin-text)" }}>{p.title}</span>
                </div>
                <span className={`admin-badge ${p.published ? "admin-badge-green" : "admin-badge-yellow"}`}>
                  {p.published ? "Published" : "Draft"}
                </span>
              </div>
            ))}
            {recentPosts.length === 0 && <p style={{ fontSize: 13, color: "var(--admin-text-muted)" }}>No posts yet.</p>}
          </div>
        </div>

        {/* Quick Links */}
        <div className="admin-card" style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Quick Actions</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {[
              { href: "/admin/team", label: "Add Team Member" },
              { href: "/admin/projects", label: "Add Project" },
              { href: "/admin/blog", label: "Write Blog Post" },
              { href: "/admin/testimonials", label: "Add Testimonial" },
              { href: "/admin/partners", label: "Add Partner" },
              { href: "/admin/portal", label: "Create Client Login" },
              { href: "/admin/content", label: "Edit Site Copy" },
              { href: "/admin/settings", label: "Turn Sections On/Off" },
            ].map((a) => (
              <Link key={a.label} href={a.href} className="admin-btn admin-btn-ghost admin-btn-sm">
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
