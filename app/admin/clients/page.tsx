"use client";

import { CollectionAdmin } from "@/components/admin/CollectionAdmin";
import { SectionToggle } from "@/components/admin/SectionToggle";
import type { ClientLogo } from "@/lib/types";

export default function AdminClientsPage() {
  return (
    <CollectionAdmin<ClientLogo>
      endpoint="/api/clients"
      noun="Client"
      title="Clients"
      subtitle="Companies you want to show off in the “closely working with” wall. Only clients marked Shown appear on the site."
      banner={
        <>
          <SectionToggle
            feature="clients"
            title="Clients section"
            description="Shown on the People page as “Closely working with”. Switch off to remove it everywhere. It also stays hidden on its own while no client is set to Shown."
          />
          <SectionToggle
            feature="clientsOnHome"
            title="Also show on the homepage"
            description="Repeats the client wall between Selected work and Testimonials. Only applies while the section above is on."
          />
        </>
      }
      blank={() => ({ name: "", logo: "", website: "", note: "", published: true })}
      fields={[
        { key: "name", label: "Client name", required: true, placeholder: "Acme Inc." },
        { key: "logo", label: "Logo URL", placeholder: "/clients/acme.svg" },
        { key: "website", label: "Website", type: "url", placeholder: "https://" },
        { key: "note", label: "Hover note", placeholder: "What we built for them" },
      ]}
      columns={[
        { label: "Client", render: (c) => c.name },
        { label: "Note", render: (c) => c.note || "—" },
        { label: "Website", render: (c) => c.website || "—" },
      ]}
    />
  );
}
