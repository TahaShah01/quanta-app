"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, FolderOpen, MessageSquareQuote,
  Wrench, HelpCircle, BookOpen, History, Settings, ArrowLeft,
  ChevronRight, Handshake, Building2, KeyRound, FileText, LogOut,
  Star, Briefcase, Mail,
} from "lucide-react";

const groups = [
  {
    heading: null,
    items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }],
  },
  {
    heading: "Work",
    items: [
      { label: "Projects", href: "/admin/projects", icon: FolderOpen },
      { label: "Services", href: "/admin/services", icon: Wrench },
      { label: "Reviews", href: "/admin/reviews", icon: Star },
      { label: "Testimonials", href: "/admin/testimonials", icon: MessageSquareQuote },
      { label: "Clients", href: "/admin/clients", icon: Building2 },
    ],
  },
  {
    heading: "People & Sales",
    items: [
      { label: "Messages & Inquiries", href: "/admin/contact", icon: Mail },
      { label: "Team CRM", href: "/admin/crm", icon: Briefcase },
      { label: "Team members", href: "/admin/team", icon: Users },
      { label: "Partners", href: "/admin/partners", icon: Handshake },
      { label: "Client portal", href: "/admin/portal", icon: KeyRound },
    ],
  },
  {
    heading: "Writing",
    items: [
      { label: "Blog", href: "/admin/blog", icon: BookOpen },
      { label: "Changelog", href: "/admin/changelog", icon: History },
      { label: "FAQ", href: "/admin/faq", icon: HelpCircle },
    ],
  },
  {
    heading: "Site",
    items: [
      { label: "Site content", href: "/admin/content", icon: FileText },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

export function AdminSidebar({ canSignOut }: { canSignOut: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => undefined);
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <span className="admin-brand-logo">Q</span>
        <div>
          <p className="admin-brand-name">QUANTA</p>
          <p className="admin-brand-sub">Admin Portal</p>
        </div>
      </div>

      <nav className="admin-nav">
        {groups.map((group) => (
          <div key={group.heading ?? "top"} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {group.heading && (
              <p style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--admin-text-muted)", padding: "14px 12px 4px" }}>
                {group.heading}
              </p>
            )}
            {group.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} className={`admin-nav-item ${isActive ? "active" : ""}`}>
                  <item.icon size={16} />
                  <span>{item.label}</span>
                  {isActive && <ChevronRight size={14} className="ml-auto opacity-60" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <Link href="/" className="admin-back-link" target="_blank">
          <ArrowLeft size={14} />
          View website
        </Link>
        {canSignOut && (
          <button type="button" className="admin-back-link" style={{ background: "none", border: 0, cursor: "pointer", marginTop: 8 }} onClick={signOut}>
            <LogOut size={14} />
            Sign out
          </button>
        )}
      </div>
    </aside>
  );
}
