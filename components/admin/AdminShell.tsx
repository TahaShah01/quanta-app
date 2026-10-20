"use client";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";

/** Sidebar + page frame; the sign-in screen gets the page on its own. */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [canSignOut, setCanSignOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { mode?: string }) => !cancelled && setCanSignOut(d.mode === "password"))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (pathname === "/admin/login") return <>{children}</>;
  return (
    <div className="admin-layout">
      <AdminSidebar canSignOut={canSignOut} />
      <main className="admin-main">{children}</main>
    </div>
  );
}
