import { NextResponse } from "next/server";
import { createContact, createLead, createTask, logActivity, listContacts } from "@/lib/crm";
import { createMessage, listMessages, getMessageStats, type MessageStatus, type MessageSource } from "@/lib/messages";
import { requireAdmin } from "@/lib/api-auth";

function parseBudget(budgetStr?: string): number {
  if (!budgetStr) return 15000;
  const digits = budgetStr.replace(/[^0-9]/g, "");
  const num = parseInt(digits, 10);
  return isNaN(num) || num <= 0 ? 15000 : num;
}

export async function GET(request: Request) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const sourceParam = searchParams.get("source");
  const search = searchParams.get("search") || undefined;

  const status = (statusParam || "all") as MessageStatus | "all";
  const source = (sourceParam || "all") as MessageSource | "all";

  const messages = listMessages({ status, source, search });
  const stats = getMessageStats();

  return NextResponse.json({ messages, stats });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    const name = (body.name || "").trim();
    const email = (body.email || "").trim();
    const message = (body.message || "").trim();
    const company = (body.company || "").trim();
    const budget = (body.budget || "").trim();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    // Basic email format check
    if (!email.includes("@") || !email.includes(".")) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // 1. Store in dedicated contact messages portal collection
    const storedMessage = createMessage({
      name,
      email,
      company: company || undefined,
      budget: budget || undefined,
      subject: `${company || name} — Project Inquiry`,
      message,
      source: "website_contact",
    });

    // 2. Check if contact already exists in CRM
    const existing = listContacts().find(
      (c) => c.email.toLowerCase() === email.toLowerCase()
    );

    let contactId = existing?.id;

    if (!existing) {
      const newContact = createContact({
        name,
        email,
        phone: "",
        organizationName: company || "Independent Inquiry",
        jobTitle: "Prospective Client",
        source: "Website Inquiry",
        status: "Lead",
        owner: "Taha Shah",
        tags: ["Website Lead", company ? "Corporate" : "Inbound"].filter(Boolean),
        notes: `Initial message: ${message}\nBudget indicated: ${budget || "Not specified"}`,
        lastContactDate: new Date().toISOString(),
        nextFollowUp: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
      contactId = newContact.id;
    }

    // 3. Create a new lead in CRM pipeline
    const lead = createLead({
      title: `${company || name} — Inbound Project Inquiry`,
      contactId,
      contactName: name,
      organizationName: company || "Independent",
      stage: "new",
      value: parseBudget(budget),
      probability: 25,
      source: "Website Form",
      owner: "Taha Shah",
      expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      notes: message,
    });

    // 4. Create follow-up task for team
    createTask({
      title: `Respond to website inquiry: ${name} (${company || "Inbound"})`,
      description: `Inquiry details:\nEmail: ${email}\nBudget: ${budget || "Unspecified"}\nMessage:\n${message}`,
      assignee: "Taha Shah",
      relatedType: "lead",
      relatedId: lead.id,
      relatedName: lead.title,
      priority: "high",
      status: "pending",
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    // 5. Log activity
    logActivity({
      type: "inquiry",
      title: "Website Contact Form Submitted",
      description: `Inquiry received from ${name} (${email}). Budget: ${budget || "N/A"}. Snippet: "${message.slice(0, 100)}..."`,
      relatedType: "lead",
      relatedId: lead.id,
      relatedName: lead.title,
      author: "System (Website Form)",
    });

    return NextResponse.json(
      {
        success: true,
        messageId: storedMessage.id,
        message: "Thank you for reaching out. The Quanta team will review your inquiry and respond within one business day.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact submission error:", error);
    return NextResponse.json(
      { error: "Failed to process inquiry. Please try again or reach out directly via email." },
      { status: 500 }
    );
  }
}
