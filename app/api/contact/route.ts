import { NextResponse } from "next/server";
import { createContact, createLead, createTask, logActivity, listContacts } from "@/lib/crm";

function parseBudget(budgetStr?: string): number {
  if (!budgetStr) return 15000;
  const digits = budgetStr.replace(/[^0-9]/g, "");
  const num = parseInt(digits, 10);
  return isNaN(num) || num <= 0 ? 15000 : num;
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

    // Check if contact already exists in CRM
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

    // Create a new lead in CRM pipeline
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

    // Create follow-up task for team
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

    // Log activity
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
