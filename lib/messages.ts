import { readJSON, writeJSON } from "@/lib/content";

export type MessageStatus = "unread" | "read" | "replied" | "archived";
export type MessageSource = "website_contact" | "client_portal" | "direct";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  company?: string;
  budget?: string;
  subject?: string;
  message: string;
  source: MessageSource;
  status: MessageStatus;
  createdAt: string;
  readAt?: string;
  repliedAt?: string;
  replySubject?: string;
  replyBody?: string;
  replySentBy?: string;
  notes?: string;
  portalAccountId?: string;
  portalInquiryId?: string;
}

export interface MessageStats {
  total: number;
  unread: number;
  read: number;
  replied: number;
  archived: number;
  websiteCount: number;
  portalCount: number;
}

const MESSAGES_FILE = "messages.json";

function loadMessages(): ContactMessage[] {
  try {
    const data = readJSON<ContactMessage[]>(MESSAGES_FILE);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveMessages(messages: ContactMessage[]): void {
  writeJSON(MESSAGES_FILE, messages);
}

export function listMessages(filter?: {
  status?: MessageStatus | "all";
  source?: MessageSource | "all";
  search?: string;
}): ContactMessage[] {
  let list = loadMessages();

  if (filter?.status && filter.status !== "all") {
    list = list.filter((m) => m.status === filter.status);
  }

  if (filter?.source && filter.source !== "all") {
    list = list.filter((m) => m.source === filter.source);
  }

  if (filter?.search) {
    const q = filter.search.toLowerCase().trim();
    list = list.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.company && m.company.toLowerCase().includes(q)) ||
        (m.subject && m.subject.toLowerCase().includes(q)) ||
        m.message.toLowerCase().includes(q)
    );
  }

  // Sort newest first
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getMessageById(id: string): ContactMessage | null {
  const list = loadMessages();
  return list.find((m) => m.id === id) || null;
}

export function createMessage(input: {
  name: string;
  email: string;
  company?: string;
  budget?: string;
  subject?: string;
  message: string;
  source?: MessageSource;
  portalAccountId?: string;
  portalInquiryId?: string;
}): ContactMessage {
  const list = loadMessages();

  const newMessage: ContactMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: input.name.trim(),
    email: input.email.trim(),
    company: input.company?.trim() || undefined,
    budget: input.budget?.trim() || undefined,
    subject: input.subject?.trim() || "Project Inquiry",
    message: input.message.trim(),
    source: input.source || "website_contact",
    status: "unread",
    createdAt: new Date().toISOString(),
    portalAccountId: input.portalAccountId,
    portalInquiryId: input.portalInquiryId,
  };

  list.unshift(newMessage);
  saveMessages(list);
  return newMessage;
}

export function updateMessage(
  id: string,
  patch: Partial<Omit<ContactMessage, "id" | "createdAt">>
): ContactMessage | null {
  const list = loadMessages();
  const index = list.findIndex((m) => m.id === id);
  if (index === -1) return null;

  const current = list[index];
  const updated: ContactMessage = {
    ...current,
    ...patch,
  };

  // If status is transitioning to read and readAt isn't set
  if (patch.status === "read" && !current.readAt) {
    updated.readAt = new Date().toISOString();
  }

  list[index] = updated;
  saveMessages(list);
  return updated;
}

export function deleteMessage(id: string): boolean {
  const list = loadMessages();
  const filtered = list.filter((m) => m.id !== id);
  if (filtered.length === list.length) return false;
  saveMessages(filtered);
  return true;
}

export function getMessageStats(): MessageStats {
  const list = loadMessages();
  let unread = 0;
  let read = 0;
  let replied = 0;
  let archived = 0;
  let websiteCount = 0;
  let portalCount = 0;

  for (const m of list) {
    if (m.status === "unread") unread++;
    else if (m.status === "read") read++;
    else if (m.status === "replied") replied++;
    else if (m.status === "archived") archived++;

    if (m.source === "client_portal") portalCount++;
    else websiteCount++;
  }

  return {
    total: list.length,
    unread,
    read,
    replied,
    archived,
    websiteCount,
    portalCount,
  };
}
