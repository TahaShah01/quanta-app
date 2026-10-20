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

  return NextResponse.json({
    metrics,
    contacts,
    organizations,
    leads,
    tasks,
    activities,
    proposals,
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
