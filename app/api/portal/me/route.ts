import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PORTAL_COOKIE, readSession, verifyPassword } from "@/lib/auth";
import { findById, toPublic, updateAccount, type PortalDeliverable, type PortalClientTask, type PortalInquiry } from "@/lib/portal";
import { findReviewByPortalAccountId } from "@/lib/reviews";
import { logActivity, createTask } from "@/lib/crm";
import { getFeatures } from "@/lib/site";
import { createMessage } from "@/lib/messages";

// Reads the session cookie, so it is always rendered per request (the portal polls this).
export async function GET() {
  if (!getFeatures().portal) {
    return NextResponse.json({ error: "disabled" }, { status: 403 });
  }
  const store = await cookies();
  const session = readSession(store.get(PORTAL_COOKIE)?.value);
  const signedOut = NextResponse.json({ account: null }, { headers: { "Cache-Control": "no-store" } });
  if (!session || session.role !== "client") return signedOut;
  const account = findById(session.sub);
  if (!account || !account.active) return signedOut;

  const project = account.project;
  const isCompleted = project && (project.status === "completed" || project.status === "launched");
  const existingReview = findReviewByPortalAccountId(account.id);

  return NextResponse.json(
    {
      account: toPublic(account),
      reviewEligibility: {
        eligible: isCompleted && !existingReview,
        isCompleted: !!isCompleted,
        hasReviewed: !!existingReview,
        existingReview: existingReview
          ? {
              id: existingReview.id,
              rating: existingReview.rating,
              title: existingReview.title,
              body: existingReview.body,
              status: existingReview.status,
              submittedAt: existingReview.submittedAt,
            }
          : null,
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function PUT(request: Request) {
  if (!getFeatures().portal) {
    return NextResponse.json({ error: "disabled" }, { status: 403 });
  }
  const store = await cookies();
  const session = readSession(store.get(PORTAL_COOKIE)?.value);
  if (!session || session.role !== "client") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const account = findById(session.sub);
  if (!account || !account.active) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      name,
      company,
      currentPassword,
      newPassword,
      deliverableAction,
      taskAction,
      inquiry,
    } = body;

    // 1. Password & Profile Update
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to change password." },
          { status: 400 }
        );
      }
      if (!verifyPassword(currentPassword, account.passwordHash)) {
        return NextResponse.json(
          { error: "Current password is incorrect." },
          { status: 400 }
        );
      }
      if (typeof newPassword !== "string" || newPassword.length < 8) {
        return NextResponse.json(
          { error: "New password must be at least 8 characters." },
          { status: 400 }
        );
      }
    }

    const currentProject = account.project;

    // 2. Deliverable Approval / Revision Request
    if (deliverableAction) {
      const { deliverableId, action, feedback } = deliverableAction as {
        deliverableId: string;
        action: "approve" | "revision";
        feedback?: string;
      };

      const deliverables = [...(currentProject.deliverables || [])];
      const dIndex = deliverables.findIndex((d) => d.id === deliverableId);
      if (dIndex === -1) {
        return NextResponse.json({ error: "Deliverable not found." }, { status: 404 });
      }

      const targetDeliverable: PortalDeliverable = {
        ...deliverables[dIndex],
        status: action === "approve" ? "approved" : "revision_requested",
        feedback: feedback ? String(feedback).trim() : deliverables[dIndex].feedback,
        updatedAt: new Date().toISOString(),
      };
      deliverables[dIndex] = targetDeliverable;

      // Log activity to CRM
      logActivity({
        type: "note",
        title: `Deliverable ${action === "approve" ? "Approved" : "Revision Requested"} by Client`,
        description: `Client ${account.name} (${account.company || "Client"}) marked '${targetDeliverable.title}' as ${targetDeliverable.status}.${feedback ? ` Feedback: "${feedback}"` : ""}`,
        relatedType: "organization",
        relatedName: account.company || account.name,
        author: account.name,
      });

      const updated = updateAccount(account.id, {
        project: {
          ...currentProject,
          deliverables,
        },
      });

      return NextResponse.json({ success: true, account: toPublic(updated!) });
    }

    // 3. Client Action Task Toggle
    if (taskAction) {
      const { taskId, completed } = taskAction as { taskId: string; completed: boolean };
      const clientTasks = [...(currentProject.clientTasks || [])];
      const tIndex = clientTasks.findIndex((t) => t.id === taskId);
      if (tIndex === -1) {
        return NextResponse.json({ error: "Client task not found." }, { status: 404 });
      }

      const targetTask: PortalClientTask = {
        ...clientTasks[tIndex],
        completed: !!completed,
      };
      clientTasks[tIndex] = targetTask;

      logActivity({
        type: "note",
        title: `Client Task ${completed ? "Completed" : "Reopened"}`,
        description: `Client ${account.name} marked action item '${targetTask.title}' as ${completed ? "Completed" : "In Progress"}.`,
        relatedType: "organization",
        relatedName: account.company || account.name,
        author: account.name,
      });

      const updated = updateAccount(account.id, {
        project: {
          ...currentProject,
          clientTasks,
        },
      });

      return NextResponse.json({ success: true, account: toPublic(updated!) });
    }

    // 4. In-Portal Inquiry / Change Request
    if (inquiry) {
      const { subject, message } = inquiry as { subject: string; message: string };
      if (!subject?.trim() || !message?.trim()) {
        return NextResponse.json({ error: "Subject and message are required." }, { status: 400 });
      }

      const newInquiry: PortalInquiry = {
        id: `inq-${Date.now()}`,
        subject: subject.trim(),
        message: message.trim(),
        status: "open",
        createdAt: new Date().toISOString(),
      };

      // Also route to unified admin messages portal
      createMessage({
        name: account.name,
        email: account.email,
        company: account.company || undefined,
        subject: newInquiry.subject,
        message: newInquiry.message,
        source: "client_portal",
        portalAccountId: account.id,
        portalInquiryId: newInquiry.id,
      });

      const inquiries = [newInquiry, ...(currentProject.inquiries || [])];

      // Create a high-priority task in internal CRM for team follow-up
      createTask({
        title: `Client Request: ${newInquiry.subject}`,
        description: `From ${account.name} (${account.company || "Client"}):\n${newInquiry.message}`,
        assignee: "Taha Shah",
        relatedType: "project",
        relatedName: currentProject.name || account.company || "Client Engagement",
        priority: "high",
        status: "pending",
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      });

      logActivity({
        type: "inquiry",
        title: `New Client Inquiry: ${newInquiry.subject}`,
        description: `Client message received via portal: "${newInquiry.message}"`,
        relatedType: "organization",
        relatedName: account.company || account.name,
        author: account.name,
      });

      const updated = updateAccount(account.id, {
        project: {
          ...currentProject,
          inquiries,
        },
      });

      return NextResponse.json({ success: true, account: toPublic(updated!) });
    }

    // 5. General Profile Name / Company Update
    const updated = updateAccount(
      account.id,
      {
        name: name ? String(name).trim() : account.name,
        company: company !== undefined ? String(company).trim() : account.company,
      },
      newPassword
    );

    if (!updated) {
      return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
    }

    return NextResponse.json({ account: toPublic(updated) });
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
