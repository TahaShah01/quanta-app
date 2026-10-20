import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { getMessageById, updateMessage, deleteMessage, type ContactMessage } from "@/lib/messages";
import { findById, updateAccount } from "@/lib/portal";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { id } = await props.params;
  const message = getMessageById(id);
  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  return NextResponse.json({ message });
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { id } = await props.params;
  const existing = getMessageById(id);
  if (!existing) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { status, replySubject, replyBody, replySentBy, notes } = body;

    const patch: Partial<ContactMessage> = {};
    if (status) patch.status = status;
    if (notes !== undefined) patch.notes = notes;

    // If recording an email reply
    if (replyBody) {
      patch.replyBody = replyBody;
      patch.replySubject = replySubject || `Re: ${existing.subject || "Project Inquiry"}`;
      patch.replySentBy = replySentBy || "Quanta Studio Team";
      patch.repliedAt = new Date().toISOString();
      patch.status = "replied";

      // If this message came from a client portal account, sync response to portal.json
      if (existing.portalAccountId && existing.portalInquiryId) {
        try {
          const account = findById(existing.portalAccountId);
          if (account && account.project) {
            const inquiries = (account.project.inquiries || []).map((inq) =>
              inq.id === existing.portalInquiryId
                ? {
                    ...inq,
                    status: "resolved" as const,
                    response: replyBody,
                  }
                : inq
            );
            updateAccount(account.id, {
              project: {
                ...account.project,
                inquiries,
              },
            });
          }
        } catch (syncErr) {
          console.error("Failed to sync response to portal.json:", syncErr);
        }
      }
    }

    const updated = updateMessage(id, patch);
    return NextResponse.json({ success: true, message: updated });
  } catch (error) {
    console.error("Failed to update message:", error);
    return NextResponse.json({ error: "Failed to update message" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { id } = await props.params;
  const deleted = deleteMessage(id);
  if (!deleted) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
