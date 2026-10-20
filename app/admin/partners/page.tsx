"use client";

import { CollectionAdmin } from "@/components/admin/CollectionAdmin";
import { SectionToggle } from "@/components/admin/SectionToggle";
import type { Partner } from "@/lib/types";

export default function AdminPartnersPage() {
  return (
    <CollectionAdmin<Partner>
      endpoint="/api/partners"
      noun="Partner"
      title="Partners"
      subtitle="People and companies Quanta works with on the business side. Shown on the People page."
      banner={
        <SectionToggle
          feature="partners"
          title="Partners section"
          description="Switch off to hide the whole Partners block from the People page, whatever is listed below. Only partners marked Shown appear."
        />
      }
      blank={() => ({ name: "", kind: "company", role: "", description: "", logo: "", website: "", since: String(new Date().getFullYear()), published: true })}
      fields={[
        { key: "name", label: "Name", required: true, placeholder: "Noman Sabir or Softtech Sol", half: true },
        { key: "kind", label: "Type", type: "select", options: [{ value: "individual", label: "Individual" }, { value: "company", label: "Company" }] },
        { key: "role", label: "How we work together", placeholder: "Brings us clients", half: true },
        { key: "since", label: "Partners since", placeholder: "2026" },
        { key: "description", label: "Description", type: "textarea", placeholder: "One or two sentences on the partnership." },
        { key: "logo", label: "Logo or photo URL", placeholder: "/partners/softtech.svg" },
        { key: "website", label: "Website", type: "url", placeholder: "https://" },
      ]}
      columns={[
        { label: "Partner", render: (p) => p.name },
        { label: "Type", render: (p) => (p.kind === "individual" ? "Individual" : "Company") },
        { label: "Role", render: (p) => p.role || "—" },
      ]}
    />
  );
}
