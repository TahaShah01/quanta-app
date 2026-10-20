import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import {
  getCRMMetrics,
  listContacts,
  createContact,
  updateContact,
  deleteContact,
  listOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  listLeads,
  createLead,
  updateLead,
  deleteLead,
  listTasks,
  createTask,
  updateTask,
  toggleTask,
  deleteTask,
  listActivities,
  logActivity,
  listProposals,
  createProposal,
  updateProposal,
  deleteProposal,
} from "@/lib/crm";
import {
  listAccounts,
  findById as findAccountById,
  updateAccount,
  createAccount,
  toPublic,
  type PortalDeliverable,
  type PortalMilestone,
  type PortalClientTask,
} from "@/lib/portal";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const metrics = getCRMMetrics();
  const contacts = listContacts();
  const organizations = listOrganizations();
  const leads = listLeads();
  const tasks = listTasks();
  const activities = listActivities();
  const proposals = listProposals();
  const accounts = listAccounts().map(toPublic);

  return NextResponse.json({
    metrics,
    contacts,
    organizations,
    leads,
    tasks,
    activities,
    proposals,
    accounts,
  });
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await request.json();
    const { entity, data } = body;

    if (!entity || !data) {
      return NextResponse.json({ error: "entity and data are required." }, { status: 400 });
    }

    switch (entity) {
      case "contact": {
        const item = createContact(data);
        return NextResponse.json({ success: true, item });
      }
      case "organization": {
        const item = createOrganization(data);
        return NextResponse.json({ success: true, item });
      }
      case "lead": {
        const item = createLead(data);
        return NextResponse.json({ success: true, item });
      }
      case "task": {
        const item = createTask(data);
        return NextResponse.json({ success: true, item });
      }
      case "activity": {
        const item = logActivity(data);
        return NextResponse.json({ success: true, item });
      }
      case "proposal": {
        const item = createProposal(data);
        return NextResponse.json({ success: true, item });
      }
      case "project_deliverable": {
        const { accountId, deliverable } = data as {
          accountId: string;
          deliverable: Omit<PortalDeliverable, "id" | "updatedAt">;
        };
        const account = findAccountById(accountId);
        if (!account) return NextResponse.json({ error: "Account not found." }, { status: 404 });

        const newDeliverable: PortalDeliverable = {
          ...deliverable,
          id: `deliv-${Date.now()}`,
          status: "pending_approval",
          updatedAt: new Date().toISOString(),
        };

        const deliverables = [...(account.project.deliverables || []), newDeliverable];
        const updated = updateAccount(account.id, {
          project: {
            ...account.project,
            deliverables,
          },
        });

        logActivity({
          type: "note",
          title: `New Deliverable Published: ${newDeliverable.title}`,
          description: `Deliverable v${newDeliverable.version || "1.0"} added to project "${account.project.name}".`,
          relatedType: "organization",
          relatedName: account.company || account.name,
          author: "Quanta Team",
        });

        return NextResponse.json({ success: true, item: toPublic(updated!) });
      }
      case "project_milestone": {
        const { accountId, milestone } = data as {
          accountId: string;
          milestone: Omit<PortalMilestone, "id">;
        };
        const account = findAccountById(accountId);
        if (!account) return NextResponse.json({ error: "Account not found." }, { status: 404 });

        const newMilestone: PortalMilestone = {
          ...milestone,
          id: `ms-${Date.now()}`,
        };

        const milestones = [...(account.project.milestones || []), newMilestone];
        const updated = updateAccount(account.id, {
          project: {
            ...account.project,
            milestones,
          },
        });

        return NextResponse.json({ success: true, item: toPublic(updated!) });
      }
      case "project_task": {
        const { accountId, task } = data as {
          accountId: string;
          task: Omit<PortalClientTask, "id" | "completed">;
        };
        const account = findAccountById(accountId);
        if (!account) return NextResponse.json({ error: "Account not found." }, { status: 404 });

        const newTask: PortalClientTask = {
          ...task,
          id: `ctask-${Date.now()}`,
          completed: false,
        };

        const clientTasks = [...(account.project.clientTasks || []), newTask];
        const updated = updateAccount(account.id, {
          project: {
            ...account.project,
            clientTasks,
          },
        });

        return NextResponse.json({ success: true, item: toPublic(updated!) });
      }
      case "convert_lead": {
        const { leadId, clientEmail, initialPassword } = data as {
          leadId: string;
          clientEmail?: string;
          initialPassword?: string;
        };
        const leads = listLeads();
        const lead = leads.find((l) => l.id === leadId);
        if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });

        const email = (clientEmail || `${lead.contactName.toLowerCase().replace(/\s+/g, ".")}@example.com`).trim();
        const password = initialPassword || "Quanta2026!";

        // Update lead stage to won
        updateLead(lead.id, { stage: "won" });

        // Check if account already exists
        let account = listAccounts().find((a) => a.email.toLowerCase() === email.toLowerCase());
        if (!account) {
          account = createAccount(
            {
              name: lead.contactName,
              email,
              company: lead.organizationName,
              project: {
                name: lead.title,
                summary: lead.notes || `Production digital engagement for ${lead.organizationName}.`,
                status: "development",
                progress: 15,
                startDate: new Date().toISOString().slice(0, 10),
                targetDate: lead.expectedCloseDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
                milestones: [
                  { id: "m1", title: "Discovery & Architectural Blueprint", status: "done", due: "", note: "Completed in qualification" },
                  { id: "m2", title: "Design Systems & High-Fidelity Prototyping", status: "active", due: "", note: "In active design review" },
                  { id: "m3", title: "Full-Stack Implementation & Integrations", status: "todo", due: "", note: "" },
                  { id: "m4", title: "Quality Assurance & Launch", status: "todo", due: "", note: "" },
                ],
                deliverables: [],
                clientTasks: [
                  { id: "t1", title: "Provide Brand Guidelines & Assets", description: "Logos, brand tokens, and design references", due: "", completed: true },
                  { id: "t2", title: "Review Initial Architecture Specs", description: "Sign-off on technical specifications document", due: "", completed: false },
                ],
                inquiries: [],
                updates: [
                  { id: "u1", date: new Date().toISOString().slice(0, 10), title: "Engagement Kickoff", body: "Welcome to the Quanta studio client portal. Project workspace initialized." },
                ],
                links: [],
              },
            },
            password
          );
        }

        logActivity({
          type: "stage_change",
          title: `Deal Won & Project Launched: ${lead.title}`,
          description: `Lead converted to active delivery project with client portal access (${email}).`,
          relatedType: "lead",
          relatedId: lead.id,
          relatedName: lead.title,
          author: "Quanta Team",
        });

        return NextResponse.json({ success: true, account: toPublic(account) });
      }
      default:
        return NextResponse.json({ error: `Unknown entity type: ${entity}` }, { status: 400 });
    }
  } catch (error) {
    console.error("CRM POST error:", error);
    return NextResponse.json({ error: "Failed to create CRM record." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await request.json();
    const { entity, id, data, action } = body;

    if (!entity || !id) {
      return NextResponse.json({ error: "entity and id are required." }, { status: 400 });
    }

    switch (entity) {
      case "contact": {
        const item = updateContact(id, data);
        if (!item) return NextResponse.json({ error: "Contact not found." }, { status: 404 });
        return NextResponse.json({ success: true, item });
      }
      case "organization": {
        const item = updateOrganization(id, data);
        if (!item) return NextResponse.json({ error: "Organization not found." }, { status: 404 });
        return NextResponse.json({ success: true, item });
      }
      case "lead": {
        const item = updateLead(id, data);
        if (!item) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
        return NextResponse.json({ success: true, item });
      }
      case "task": {
        if (action === "toggle") {
          const item = toggleTask(id);
          if (!item) return NextResponse.json({ error: "Task not found." }, { status: 404 });
          return NextResponse.json({ success: true, item });
        }
        const item = updateTask(id, data);
        if (!item) return NextResponse.json({ error: "Task not found." }, { status: 404 });
        return NextResponse.json({ success: true, item });
      }
      case "proposal": {
        const item = updateProposal(id, data);
        if (!item) return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
        return NextResponse.json({ success: true, item });
      }
      case "project": {
        const account = findAccountById(id);
        if (!account) return NextResponse.json({ error: "Account not found." }, { status: 404 });

        const prevStatus = account.project.status;
        const newStatus = data.status || prevStatus;
        const isCompleted = newStatus === "completed" || newStatus === "launched";

        const updated = updateAccount(account.id, {
          project: {
            ...account.project,
            ...data,
            status: newStatus,
            completedAt: isCompleted && !account.project.completedAt ? new Date().toISOString() : account.project.completedAt,
          },
        });

        if (newStatus !== prevStatus) {
          logActivity({
            type: "stage_change",
            title: `Project Status: ${newStatus.toUpperCase()}`,
            description: `Project "${account.project.name}" status changed from ${prevStatus} to ${newStatus}.${isCompleted ? " Client review workflow now unlocked." : ""}`,
            relatedType: "organization",
            relatedName: account.company || account.name,
            author: "Team",
          });
        }

        return NextResponse.json({ success: true, item: toPublic(updated!) });
      }
      case "inquiry_response": {
        const { inquiryId, responseText } = data as { inquiryId: string; responseText: string };
        const account = findAccountById(id);
        if (!account) return NextResponse.json({ error: "Account not found." }, { status: 404 });

        const inquiries = [...(account.project.inquiries || [])];
        const idx = inquiries.findIndex((i) => i.id === inquiryId);
        if (idx === -1) return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });

        inquiries[idx] = {
          ...inquiries[idx],
          response: responseText.trim(),
          status: "resolved",
        };

        const updated = updateAccount(account.id, {
          project: {
            ...account.project,
            inquiries,
          },
        });

        return NextResponse.json({ success: true, item: toPublic(updated!) });
      }
      default:
        return NextResponse.json({ error: `Unknown entity type: ${entity}` }, { status: 400 });
    }
  } catch (error) {
    console.error("CRM PUT error:", error);
    return NextResponse.json({ error: "Failed to update CRM record." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const entity = searchParams.get("entity");
    const id = searchParams.get("id");

    if (!entity || !id) {
      return NextResponse.json({ error: "entity and id are required." }, { status: 400 });
    }

    let success = false;
    switch (entity) {
      case "contact":
        success = deleteContact(id);
        break;
      case "organization":
        success = deleteOrganization(id);
        break;
      case "lead":
        success = deleteLead(id);
        break;
      case "task":
        success = deleteTask(id);
        break;
      case "proposal":
        success = deleteProposal(id);
        break;
      default:
        return NextResponse.json({ error: `Unknown entity type: ${entity}` }, { status: 400 });
    }

    if (!success) {
      return NextResponse.json({ error: "Record not found or could not be deleted." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CRM DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete CRM record." }, { status: 500 });
  }
}

