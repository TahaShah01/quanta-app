// Team CRM — Data Model and File-Backed Storage Layer
//
// Provides persistent management for:
// - Contacts & Organizations
// - Sales Pipeline (Leads with Kanban stages)
// - Tasks, Follow-ups & Reminders
// - Activities & Communication Timeline
// - Opportunities & Proposals
// - Audit Trail & Dashboard Metrics
//
// BACKEND NOTE: Built for simple, robust migration to PostgreSQL/Prisma/Drizzle.
// All reads/writes go through this module.

import { readJSON, writeJSON } from "@/lib/content";

export type PipelineStage =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "pending" | "in_progress" | "completed";

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  organizationId?: string;
  organizationName?: string;
  jobTitle: string;
  source: string;
  status: "Lead" | "Active Client" | "Past Client" | "Partner";
  owner: string;
  tags: string[];
  notes: string;
  lastContactDate: string;
  nextFollowUp: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  website: string;
  industry: string;
  tier: "Enterprise" | "Mid-Market" | "Startup" | "Boutique";
  relationshipStatus: "Prospect" | "Active Client" | "Partner" | "Alumni";
  owner: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  title: string;
  contactId?: string;
  contactName: string;
  organizationName: string;
  stage: PipelineStage;
  value: number;
  probability: number;
  source: string;
  owner: string;
  expectedCloseDate: string;
  lossReason?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CRMTask {
  id: string;
  title: string;
  description: string;
  assignee: string;
  relatedType: "lead" | "contact" | "organization" | "project";
  relatedId?: string;
  relatedName: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  completedAt?: string;
  createdAt: string;
}

export interface CRMActivity {
  id: string;
  type: "note" | "call" | "meeting" | "email" | "inquiry" | "proposal" | "stage_change";
  title: string;
  description: string;
  relatedType: "lead" | "contact" | "organization";
  relatedId?: string;
  relatedName: string;
  author: string;
  timestamp: string;
}

export interface Proposal {
  id: string;
  title: string;
  leadId?: string;
  organizationName: string;
  contactName: string;
  scope: string;
  value: number;
  status: "draft" | "sent" | "under_review" | "accepted" | "declined";
  validUntil: string;
  sentAt?: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  performedBy: string;
  details: string;
  timestamp: string;
}

export interface CRMData {
  contacts: Contact[];
  organizations: Organization[];
  leads: Lead[];
  tasks: CRMTask[];
  activities: CRMActivity[];
  proposals: Proposal[];
  auditLog: AuditLogEntry[];
}

function load(): CRMData {
  try {
    const data = readJSON<CRMData>("crm.json");
    return {
      contacts: Array.isArray(data.contacts) ? data.contacts : [],
      organizations: Array.isArray(data.organizations) ? data.organizations : [],
      leads: Array.isArray(data.leads) ? data.leads : [],
      tasks: Array.isArray(data.tasks) ? data.tasks : [],
      activities: Array.isArray(data.activities) ? data.activities : [],
      proposals: Array.isArray(data.proposals) ? data.proposals : [],
      auditLog: Array.isArray(data.auditLog) ? data.auditLog : [],
    };
  } catch {
    return {
      contacts: [],
      organizations: [],
      leads: [],
      tasks: [],
      activities: [],
      proposals: [],
      auditLog: [],
    };
  }
}

function save(file: CRMData) {
  writeJSON("crm.json", file);
}

function logAudit(
  file: CRMData,
  action: string,
  entityType: string,
  entityId: string,
  details: string,
  performedBy: string = "Admin"
) {
  const entry: AuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    action,
    entityType,
    entityId,
    performedBy,
    details,
    timestamp: new Date().toISOString(),
  };
  file.auditLog.unshift(entry);
  if (file.auditLog.length > 200) {
    file.auditLog = file.auditLog.slice(0, 200);
  }
}

// Contacts CRUD
export function listContacts(): Contact[] {
  return load().contacts;
}

export function createContact(input: Omit<Contact, "id" | "createdAt" | "updatedAt">): Contact {
  const file = load();
  const now = new Date().toISOString();
  const contact: Contact = {
    ...input,
    id: `contact-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  file.contacts.unshift(contact);
  logAudit(file, "CREATE", "Contact", contact.id, `Created contact ${contact.name}`);
  save(file);
  return contact;
}

export function updateContact(id: string, patch: Partial<Contact>): Contact | undefined {
  const file = load();
  const idx = file.contacts.findIndex((c) => c.id === id);
  if (idx === -1) return undefined;
  file.contacts[idx] = {
    ...file.contacts[idx],
    ...patch,
    id,
    updatedAt: new Date().toISOString(),
  };
  logAudit(file, "UPDATE", "Contact", id, `Updated contact ${file.contacts[idx].name}`);
  save(file);
  return file.contacts[idx];
}

export function deleteContact(id: string): boolean {
  const file = load();
  const target = file.contacts.find((c) => c.id === id);
  if (!target) return false;
  file.contacts = file.contacts.filter((c) => c.id !== id);
  logAudit(file, "DELETE", "Contact", id, `Deleted contact ${target.name}`);
  save(file);
  return true;
}

// Organizations CRUD
export function listOrganizations(): Organization[] {
  return load().organizations;
}

export function createOrganization(input: Omit<Organization, "id" | "createdAt" | "updatedAt">): Organization {
  const file = load();
  const now = new Date().toISOString();
  const org: Organization = {
    ...input,
    id: `org-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  file.organizations.unshift(org);
  logAudit(file, "CREATE", "Organization", org.id, `Created organization ${org.name}`);
  save(file);
  return org;
}

export function updateOrganization(id: string, patch: Partial<Organization>): Organization | undefined {
  const file = load();
  const idx = file.organizations.findIndex((o) => o.id === id);
  if (idx === -1) return undefined;
  file.organizations[idx] = {
    ...file.organizations[idx],
    ...patch,
    id,
    updatedAt: new Date().toISOString(),
  };
  logAudit(file, "UPDATE", "Organization", id, `Updated organization ${file.organizations[idx].name}`);
  save(file);
  return file.organizations[idx];
}

export function deleteOrganization(id: string): boolean {
  const file = load();
  const target = file.organizations.find((o) => o.id === id);
  if (!target) return false;
  file.organizations = file.organizations.filter((o) => o.id !== id);
  logAudit(file, "DELETE", "Organization", id, `Deleted organization ${target.name}`);
  save(file);
  return true;
}

// Leads Pipeline CRUD
export function listLeads(): Lead[] {
  return load().leads;
}

export function createLead(input: Omit<Lead, "id" | "createdAt" | "updatedAt">): Lead {
  const file = load();
  const now = new Date().toISOString();
  const lead: Lead = {
    ...input,
    id: `lead-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  file.leads.unshift(lead);
  logAudit(file, "CREATE", "Lead", lead.id, `Created lead ${lead.title} ($${lead.value})`);
  save(file);
  return lead;
}

export function updateLead(id: string, patch: Partial<Lead>): Lead | undefined {
  const file = load();
  const idx = file.leads.findIndex((l) => l.id === id);
  if (idx === -1) return undefined;
  const oldStage = file.leads[idx].stage;
  file.leads[idx] = {
    ...file.leads[idx],
    ...patch,
    id,
    updatedAt: new Date().toISOString(),
  };
  if (patch.stage && patch.stage !== oldStage) {
    const activity: CRMActivity = {
      id: `act-${Date.now()}`,
      type: "stage_change",
      title: `Moved to ${patch.stage.toUpperCase()}`,
      description: `Pipeline stage changed from ${oldStage} to ${patch.stage}`,
      relatedType: "lead",
      relatedId: id,
      relatedName: file.leads[idx].title,
      author: "Team",
      timestamp: new Date().toISOString(),
    };
    file.activities.unshift(activity);
  }
  logAudit(file, "UPDATE", "Lead", id, `Updated lead ${file.leads[idx].title}`);
  save(file);
  return file.leads[idx];
}

export function deleteLead(id: string): boolean {
  const file = load();
  const target = file.leads.find((l) => l.id === id);
  if (!target) return false;
  file.leads = file.leads.filter((l) => l.id !== id);
  logAudit(file, "DELETE", "Lead", id, `Deleted lead ${target.title}`);
  save(file);
  return true;
}

// Tasks CRUD
export function listTasks(): CRMTask[] {
  return load().tasks;
}

export function createTask(input: Omit<CRMTask, "id" | "createdAt">): CRMTask {
  const file = load();
  const task: CRMTask = {
    ...input,
    id: `task-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  file.tasks.unshift(task);
  logAudit(file, "CREATE", "Task", task.id, `Created task "${task.title}"`);
  save(file);
  return task;
}

export function updateTask(id: string, patch: Partial<CRMTask>): CRMTask | undefined {
  const file = load();
  const idx = file.tasks.findIndex((t) => t.id === id);
  if (idx === -1) return undefined;
  file.tasks[idx] = {
    ...file.tasks[idx],
    ...patch,
    id,
  };
  logAudit(file, "UPDATE", "Task", id, `Updated task "${file.tasks[idx].title}"`);
  save(file);
  return file.tasks[idx];
}

export function toggleTask(id: string): CRMTask | undefined {
  const file = load();
  const idx = file.tasks.findIndex((t) => t.id === id);
  if (idx === -1) return undefined;
  const curr = file.tasks[idx].status;
  const next: TaskStatus = curr === "completed" ? "pending" : "completed";
  file.tasks[idx].status = next;
  file.tasks[idx].completedAt = next === "completed" ? new Date().toISOString() : undefined;
  logAudit(file, "UPDATE", "Task", id, `Toggled task "${file.tasks[idx].title}" to ${next}`);
  save(file);
  return file.tasks[idx];
}

export function deleteTask(id: string): boolean {
  const file = load();
  const target = file.tasks.find((t) => t.id === id);
  if (!target) return false;
  file.tasks = file.tasks.filter((t) => t.id !== id);
  logAudit(file, "DELETE", "Task", id, `Deleted task "${target.title}"`);
  save(file);
  return true;
}

// Activities CRUD
export function listActivities(): CRMActivity[] {
  return load().activities;
}

export function logActivity(input: Omit<CRMActivity, "id" | "timestamp">): CRMActivity {
  const file = load();
  const activity: CRMActivity = {
    ...input,
    id: `act-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
  file.activities.unshift(activity);
  save(file);
  return activity;
}

// Proposals CRUD
export function listProposals(): Proposal[] {
  return load().proposals;
}

export function createProposal(input: Omit<Proposal, "id" | "createdAt">): Proposal {
  const file = load();
  const proposal: Proposal = {
    ...input,
    id: `prop-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  file.proposals.unshift(proposal);
  logAudit(file, "CREATE", "Proposal", proposal.id, `Created proposal "${proposal.title}"`);
  save(file);
  return proposal;
}

export function updateProposal(id: string, patch: Partial<Proposal>): Proposal | undefined {
  const file = load();
  const idx = file.proposals.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;
  file.proposals[idx] = {
    ...file.proposals[idx],
    ...patch,
    id,
  };
  logAudit(file, "UPDATE", "Proposal", id, `Updated proposal "${file.proposals[idx].title}"`);
  save(file);
  return file.proposals[idx];
}

export function deleteProposal(id: string): boolean {
  const file = load();
  const target = file.proposals.find((p) => p.id === id);
  if (!target) return false;
  file.proposals = file.proposals.filter((p) => p.id !== id);
  logAudit(file, "DELETE", "Proposal", id, `Deleted proposal "${target.title}"`);
  save(file);
  return true;
}

// Dashboard Metrics
export function getCRMMetrics() {
  const data = load();
  const totalContacts = data.contacts.length;
  const totalOrganizations = data.organizations.length;
  
  const activeLeads = data.leads.filter((l) => l.stage !== "won" && l.stage !== "lost");
  const wonLeads = data.leads.filter((l) => l.stage === "won");
  const lostLeads = data.leads.filter((l) => l.stage === "lost");

  const pipelineValue = activeLeads.reduce((acc, l) => acc + (Number(l.value) || 0), 0);
  const wonValue = wonLeads.reduce((acc, l) => acc + (Number(l.value) || 0), 0);

  const closedCount = wonLeads.length + lostLeads.length;
  const winRate = closedCount > 0 ? Math.round((wonLeads.length / closedCount) * 100) : 0;

  const now = new Date();
  const pendingTasks = data.tasks.filter((t) => t.status !== "completed");
  const overdueTasks = pendingTasks.filter((t) => t.dueDate && new Date(t.dueDate) < now);

  const stageCounts: Record<PipelineStage, number> = {
    new: 0,
    contacted: 0,
    qualified: 0,
    proposal: 0,
    negotiation: 0,
    won: 0,
    lost: 0,
  };
  data.leads.forEach((l) => {
    if (stageCounts[l.stage] !== undefined) {
      stageCounts[l.stage]++;
    }
  });

  return {
    totalContacts,
    totalOrganizations,
    pipelineValue,
    wonValue,
    activeLeadsCount: activeLeads.length,
    wonCount: wonLeads.length,
    winRate,
    pendingTasksCount: pendingTasks.length,
    overdueTasksCount: overdueTasks.length,
    stageCounts,
    recentActivities: data.activities.slice(0, 10),
    auditLog: data.auditLog.slice(0, 20),
  };
}
