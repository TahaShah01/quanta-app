import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import "./admin.css";

export const metadata: Metadata = {
  title: "Admin Portal — QUANTA",
  description: "Quanta internal admin portal",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-body">
      <Suspense fallback={null}>
        <AdminShell>{children}</AdminShell>
      </Suspense>
    </div>
  );
}
