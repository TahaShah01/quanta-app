"use client";

import { useEffect, useState } from "react";
import {
  Briefcase,
  Users,
  CheckSquare,
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  FileText,
  Activity as ActivityIcon,
  Layers,
  ShieldCheck,
} from "lucide-react";
import type {
  Contact,
  Organization,
  Lead,
  CRMTask,
  CRMActivity,
  Proposal,
  PipelineStage,
  AuditLogEntry,
  TaskPriority,
} from "@/lib/crm";
import type {
  PublicAccount,
  ProjectStatus,
} from "@/lib/portal";

interface CRMMetrics {
  totalContacts: number;
  totalOrganizations: number;
  pipelineValue: number;
  wonValue: number;
  activeLeadsCount: number;
  wonCount: number;
  winRate: number;
  pendingTasksCount: number;
  overdueTasksCount: number;
  stageCounts: Record<PipelineStage, number>;
  recentActivities: CRMActivity[];
  auditLog: AuditLogEntry[];
}

const STAGES: { id: PipelineStage; label: string; color: string }[] = [
  { id: "new", label: "New Leads", color: "#3b82f6" },
  { id: "contacted", label: "Contacted", color: "#8b5cf6" },
  { id: "qualified", label: "Qualified", color: "#6366f1" },
  { id: "proposal", label: "Proposal", color: "#f59e0b" },
  { id: "negotiation", label: "Negotiation", color: "#ec4899" },
  { id: "won", label: "Won Deals", color: "#10b981" },
  { id: "lost", label: "Lost", color: "#64748b" },
];

export default function AdminCRMPage() {
  const [activeTab, setActiveTab] = useState<"pipeline" | "contacts" | "tasks" | "proposals" | "projects" | "activity">("pipeline");
  const [metrics, setMetrics] = useState<CRMMetrics | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<CRMTask[]>([]);
  const [activities, setActivities] = useState<CRMActivity[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [accounts, setAccounts] = useState<PublicAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Deliverable modal in CRM
  const [newDeliverableModal, setNewDeliverableModal] = useState<{ open: boolean; accountId?: string }>({ open: false });
  const [delivForm, setDelivForm] = useState({ title: "", version: "1.0", url: "", description: "" });

  // Milestone inline modal in CRM
  const [newMilestoneModal, setNewMilestoneModal] = useState<{ open: boolean; accountId?: string }>({ open: false });
  const [milestoneForm, setMilestoneForm] = useState({ title: "", due: "", note: "" });

  // Inquiry response state
  const [inquiryResponses, setInquiryResponses] = useState<Record<string, string>>({});

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [leadModal, setLeadModal] = useState<{ open: boolean; item?: Lead }>({ open: false });
  const [contactModal, setContactModal] = useState<{ open: boolean; item?: Contact }>({ open: false });
  const [taskModal, setTaskModal] = useState<{ open: boolean; item?: CRMTask }>({ open: false });
  const [proposalModal, setProposalModal] = useState<{ open: boolean; item?: Proposal }>({ open: false });
  const [deleteConfirm, setDeleteConfirm] = useState<{ entity: string; id: string; name: string } | null>(null);

  // Form states
  const [leadForm, setLeadForm] = useState<Partial<Lead>>({
    title: "",
    contactName: "",
    organizationName: "",
    stage: "new",
    value: 20000,
    probability: 30,
    owner: "Taha Shah",
    expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    notes: "",
  });

  const [contactForm, setContactForm] = useState<Partial<Contact>>({
    name: "",
    email: "",
    phone: "",
    organizationName: "",
    jobTitle: "",
    status: "Lead",
    owner: "Taha Shah",
    tags: [],
    notes: "",
  });

  const [taskForm, setTaskForm] = useState<Partial<CRMTask>>({
    title: "",
    description: "",
    assignee: "Taha Shah",
    priority: "medium",
    status: "pending",
    relatedType: "lead",
    relatedName: "",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  });

  const [proposalForm, setProposalForm] = useState<Partial<Proposal>>({
    title: "",
    organizationName: "",
    contactName: "",
    scope: "",
    value: 25000,
    status: "sent",
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCRM();
  }, []);

  async function fetchCRM() {
    setLoading(true);
    try {
      const res = await fetch("/api/crm");
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
        setContacts(data.contacts || []);
        setOrganizations(data.organizations || []);
        setLeads(data.leads || []);
        setTasks(data.tasks || []);
        setActivities(data.activities || []);
        setProposals(data.proposals || []);
        setAccounts(data.accounts || []);
      }
    } catch (e) {
      console.error("Failed to load CRM data:", e);
    } finally {
      setLoading(false);
    }
  }

  // Convert Won Lead to Delivery Project
  async function handleConvertLead(leadId: string) {
    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity: "convert_lead", data: { leadId } }),
      });
      if (res.ok) {
        await fetchCRM();
        setActiveTab("projects");
      }
    } catch (err) {
      console.error("Convert lead error:", err);
    }
  }

  // Update Project Status & Progress
  async function handleUpdateProject(accountId: string, patch: Partial<PublicAccount["project"]>) {
    try {
      const res = await fetch("/api/crm", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity: "project", id: accountId, data: patch }),
      });
      if (res.ok) fetchCRM();
    } catch (err) {
      console.error("Update project error:", err);
    }
  }

  // Add Deliverable to Project
  async function handleCreateDeliverable(e: React.FormEvent) {
    e.preventDefault();
    if (!newDeliverableModal.accountId) return;
    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "project_deliverable",
          data: {
            accountId: newDeliverableModal.accountId,
            deliverable: delivForm,
          },
        }),
      });
      if (res.ok) {
        setNewDeliverableModal({ open: false });
        setDelivForm({ title: "", version: "1.0", url: "", description: "" });
        fetchCRM();
      }
    } catch (err) {
      console.error("Create deliverable error:", err);
    }
  }

  // Add Milestone to Project
  async function handleCreateMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!newMilestoneModal.accountId) return;
    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "project_milestone",
          data: {
            accountId: newMilestoneModal.accountId,
            milestone: {
              title: milestoneForm.title,
              due: milestoneForm.due,
              note: milestoneForm.note,
              status: "todo",
            },
          },
        }),
      });
      if (res.ok) {
        setNewMilestoneModal({ open: false });
        setMilestoneForm({ title: "", due: "", note: "" });
        fetchCRM();
      }
    } catch (err) {
      console.error("Create milestone error:", err);
    }
  }

  // Respond to Client Inquiry
  async function handleReplyInquiry(accountId: string, inquiryId: string) {
    const text = inquiryResponses[inquiryId];
    if (!text?.trim()) return;
    try {
      const res = await fetch("/api/crm", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "inquiry_response",
          id: accountId,
          data: { inquiryId, responseText: text.trim() },
        }),
      });
      if (res.ok) {
        setInquiryResponses((prev) => ({ ...prev, [inquiryId]: "" }));
        fetchCRM();
      }
    } catch (err) {
      console.error("Reply inquiry error:", err);
    }
  }

  // Lead stage quick change
  async function handleStageChange(leadId: string, stage: PipelineStage) {
    try {
      const res = await fetch("/api/crm", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity: "lead", id: leadId, data: { stage } }),
      });
      if (res.ok) fetchCRM();
    } catch (e) {
      console.error("Failed to transition lead:", e);
    }
  }

  // Toggle task status
  async function handleToggleTask(taskId: string) {
    try {
      const res = await fetch("/api/crm", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity: "task", id: taskId, action: "toggle" }),
      });
      if (res.ok) fetchCRM();
    } catch (e) {
      console.error("Failed to toggle task:", e);
    }
  }

  // Save Lead
  async function handleSaveLead(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (leadModal.item) {
        await fetch("/api/crm", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entity: "lead", id: leadModal.item.id, data: leadForm }),
        });
      } else {
        await fetch("/api/crm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entity: "lead", data: leadForm }),
        });
      }
      setLeadModal({ open: false });
      fetchCRM();
    } catch (err) {
      console.error("Save lead error:", err);
    } finally {
      setSaving(false);
    }
  }

  // Save Contact
  async function handleSaveContact(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (contactModal.item) {
        await fetch("/api/crm", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entity: "contact", id: contactModal.item.id, data: contactForm }),
        });
      } else {
        await fetch("/api/crm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entity: "contact", data: contactForm }),
        });
      }
      setContactModal({ open: false });
      fetchCRM();
    } catch (err) {
      console.error("Save contact error:", err);
    } finally {
      setSaving(false);
    }
  }

  // Save Task
  async function handleSaveTask(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (taskModal.item) {
        await fetch("/api/crm", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entity: "task", id: taskModal.item.id, data: taskForm }),
        });
      } else {
        await fetch("/api/crm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entity: "task", data: taskForm }),
        });
      }
      setTaskModal({ open: false });
      fetchCRM();
    } catch (err) {
      console.error("Save task error:", err);
    } finally {
      setSaving(false);
    }
  }

  // Save Proposal
  async function handleSaveProposal(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (proposalModal.item) {
        await fetch("/api/crm", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entity: "proposal", id: proposalModal.item.id, data: proposalForm }),
        });
      } else {
        await fetch("/api/crm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entity: "proposal", data: proposalForm }),
        });
      }
      setProposalModal({ open: false });
      fetchCRM();
    } catch (err) {
      console.error("Save proposal error:", err);
    } finally {
      setSaving(false);
    }
  }

  // Generic Delete
  async function executeDelete() {
    if (!deleteConfirm) return;
    try {
      await fetch(`/api/crm?entity=${deleteConfirm.entity}&id=${deleteConfirm.id}`, { method: "DELETE" });
      setDeleteConfirm(null);
      fetchCRM();
    } catch (e) {
      console.error("Delete error:", e);
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Team CRM & Sales Pipeline</h1>
          <p className="admin-page-sub">
            Unified workspace for client acquisition, sales pipeline stages, task tracking, and client communication.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {activeTab === "pipeline" && (
            <button
              className="admin-btn admin-btn-primary"
              onClick={() => {
                setLeadForm({
                  title: "",
                  contactName: "",
                  organizationName: "",
                  stage: "new",
                  value: 25000,
                  probability: 30,
                  owner: "Taha Shah",
                  expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
                  notes: "",
                });
                setLeadModal({ open: true });
              }}
            >
              <Plus size={15} /> Add Lead
            </button>
          )}
          {activeTab === "contacts" && (
            <button
              className="admin-btn admin-btn-primary"
              onClick={() => {
                setContactForm({
                  name: "",
                  email: "",
                  phone: "",
                  organizationName: "",
                  jobTitle: "",
                  status: "Lead",
                  owner: "Taha Shah",
                  tags: [],
                  notes: "",
                });
                setContactModal({ open: true });
              }}
            >
              <Plus size={15} /> Add Contact
            </button>
          )}
          {activeTab === "tasks" && (
            <button
              className="admin-btn admin-btn-primary"
              onClick={() => {
                setTaskForm({
                  title: "",
                  description: "",
                  assignee: "Taha Shah",
                  priority: "medium",
                  status: "pending",
                  relatedType: "lead",
                  relatedName: "",
                  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
                });
                setTaskModal({ open: true });
              }}
            >
              <Plus size={15} /> Add Task
            </button>
          )}
          {activeTab === "proposals" && (
            <button
              className="admin-btn admin-btn-primary"
              onClick={() => {
                setProposalForm({
                  title: "",
                  organizationName: "",
                  contactName: "",
                  scope: "",
                  value: 30000,
                  status: "sent",
                  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
                });
                setProposalModal({ open: true });
              }}
            >
              <Plus size={15} /> Create Proposal
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Overview */}
      {metrics && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
          <div className="admin-card" style={{ padding: 18 }}>
            <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--admin-text-muted)" }}>
              Active Pipeline Value
            </span>
            <div style={{ fontSize: 26, fontWeight: 700, color: "var(--admin-text)", marginTop: 6 }}>
              ${metrics.pipelineValue.toLocaleString()}
            </div>
            <span style={{ fontSize: 11, color: "var(--admin-text-secondary)", marginTop: 4, display: "block" }}>
              {metrics.activeLeadsCount} active opportunities
            </span>
          </div>

          <div className="admin-card" style={{ padding: 18 }}>
            <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--admin-text-muted)" }}>
              Won Deals Value
            </span>
            <div style={{ fontSize: 26, fontWeight: 700, color: "#10b981", marginTop: 6 }}>
              ${metrics.wonValue.toLocaleString()}
            </div>
            <span style={{ fontSize: 11, color: "var(--admin-text-secondary)", marginTop: 4, display: "block" }}>
              Win rate: {metrics.winRate}%
            </span>
          </div>

          <div className="admin-card" style={{ padding: 18 }}>
            <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--admin-text-muted)" }}>
              Open Tasks
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 26, fontWeight: 700, color: "var(--admin-text)" }}>
                {metrics.pendingTasksCount}
              </span>
              {metrics.overdueTasksCount > 0 && (
                <span className="admin-badge admin-badge-red" style={{ fontSize: 11 }}>
                  {metrics.overdueTasksCount} overdue
                </span>
              )}
            </div>
            <span style={{ fontSize: 11, color: "var(--admin-text-secondary)", marginTop: 4, display: "block" }}>
              Action items across team
            </span>
          </div>

          <div className="admin-card" style={{ padding: 18 }}>
            <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--admin-text-muted)" }}>
              Directory Size
            </span>
            <div style={{ fontSize: 26, fontWeight: 700, color: "var(--admin-text)", marginTop: 6 }}>
              {metrics.totalContacts}
            </div>
            <span style={{ fontSize: 11, color: "var(--admin-text-secondary)", marginTop: 4, display: "block" }}>
              across {metrics.totalOrganizations} organizations
            </span>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--admin-border)", gap: 4, marginBottom: 20 }}>
        {(
          [
            ["pipeline", "Sales Pipeline", Briefcase],
            ["contacts", "Contacts & Organizations", Users],
            ["tasks", "Tasks & Follow-ups", CheckSquare],
            ["proposals", "Proposals", FileText],
            ["projects", "Projects & Delivery", Layers],
            ["activity", "Audit Log & Feed", ActivityIcon],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`admin-btn ${activeTab === key ? "admin-btn-primary" : "admin-btn-ghost"}`}
            style={{
              borderRadius: "6px 6px 0 0",
              borderBottom: activeTab === key ? "2px solid var(--admin-accent)" : "none",
              padding: "10px 18px",
              fontSize: 13,
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: "center", color: "var(--admin-text-muted)" }}>
          Loading CRM workspace...
        </div>
      ) : (
        <>
          {/* TAB 1: SALES PIPELINE (KANBAN BOARD) */}
          {activeTab === "pipeline" && (
            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 16,
                  alignItems: "start",
                }}
              >
                {STAGES.map((col) => {
                  const stageLeads = leads.filter((l) => l.stage === col.id);
                  const stageTotal = stageLeads.reduce((acc, l) => acc + (Number(l.value) || 0), 0);

                  return (
                    <div
                      key={col.id}
                      style={{
                        background: "var(--admin-surface)",
                        border: "1px solid var(--admin-border)",
                        borderRadius: "var(--admin-radius)",
                        padding: 14,
                        minHeight: 480,
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid var(--admin-border)", paddingBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: col.color }} />
                          <strong style={{ fontSize: 13, color: "var(--admin-text)" }}>{col.label}</strong>
                          <span style={{ fontSize: 11, color: "var(--admin-text-muted)", marginLeft: 4 }}>
                            ({stageLeads.length})
                          </span>
                        </div>
                        <span style={{ fontSize: 11, color: "var(--admin-text-secondary)", fontWeight: 600 }}>
                          ${stageTotal > 0 ? stageTotal.toLocaleString() : "0"}
                        </span>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                        {stageLeads.length === 0 ? (
                          <div style={{ padding: "30px 10px", textAlign: "center", fontSize: 11, color: "var(--admin-text-muted)" }}>
                            No deals in this stage
                          </div>
                        ) : (
                          stageLeads.map((lead) => (
                            <div
                              key={lead.id}
                              style={{
                                background: "var(--admin-surface-2)",
                                border: "1px solid var(--admin-border)",
                                borderRadius: "var(--admin-radius-sm)",
                                padding: 12,
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                                transition: "border-color 0.2s",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--admin-text)", lineHeight: 1.3 }}>
                                  {lead.title}
                                </span>
                                <div style={{ display: "flex", gap: 4 }}>
                                  <button
                                    className="admin-btn admin-btn-ghost admin-btn-icon"
                                    style={{ padding: 4 }}
                                    onClick={() => {
                                      setLeadForm(lead);
                                      setLeadModal({ open: true, item: lead });
                                    }}
                                  >
                                    <Pencil size={11} />
                                  </button>
                                  <button
                                    className="admin-btn admin-btn-danger admin-btn-icon"
                                    style={{ padding: 4 }}
                                    onClick={() => setDeleteConfirm({ entity: "lead", id: lead.id, name: lead.title })}
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              </div>

                              <div style={{ fontSize: 11, color: "var(--admin-text-secondary)" }}>
                                <strong>{lead.organizationName}</strong> · {lead.contactName}
                              </div>

                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: "1px solid var(--admin-border)", paddingTop: 8, marginTop: 4 }}>
                                <span style={{ fontSize: 14, fontWeight: 700, color: "#10b981" }}>
                                  ${Number(lead.value).toLocaleString()}
                                </span>
                                <span style={{ fontSize: 11, color: "var(--admin-text-muted)" }}>
                                  Owner: {lead.owner.split(" ")[0]}
                                </span>
                              </div>

                              {/* Stage transition selector */}
                              <div style={{ marginTop: 2, display: "flex", flexDirection: "column", gap: 6 }}>
                                <select
                                  value={lead.stage}
                                  onChange={(e) => handleStageChange(lead.id, e.target.value as PipelineStage)}
                                  className="admin-input"
                                  style={{ fontSize: 11, padding: "3px 6px", height: 26 }}
                                >
                                  {STAGES.map((s) => (
                                    <option key={s.id} value={s.id}>
                                      Move to: {s.label}
                                    </option>
                                  ))}
                                </select>

                                {lead.stage === "won" && (
                                  <button
                                    type="button"
                                    onClick={() => handleConvertLead(lead.id)}
                                    className="admin-btn admin-btn-primary"
                                    style={{
                                      fontSize: 10,
                                      padding: "4px 8px",
                                      width: "100%",
                                      justifyContent: "center",
                                      background: "#10b981",
                                      borderColor: "#059669",
                                      color: "#ffffff",
                                    }}
                                  >
                                    Convert to Delivery Project &rarr;
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CONTACTS & ORGANIZATIONS */}
          {activeTab === "contacts" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={{ position: "relative", minWidth: 280 }}>
                  <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--admin-text-muted)" }} />
                  <input
                    type="text"
                    placeholder="Search by name, email, company..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="admin-input"
                    style={{ paddingLeft: 32, fontSize: 13, height: 36 }}
                  />
                </div>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Contact Name</th>
                      <th>Organization & Role</th>
                      <th>Email / Phone</th>
                      <th>Status</th>
                      <th>Owner</th>
                      <th>Next Follow-up</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts
                      .filter((c) => {
                        if (!searchQuery.trim()) return true;
                        const q = searchQuery.toLowerCase();
                        return (
                          c.name.toLowerCase().includes(q) ||
                          c.email.toLowerCase().includes(q) ||
                          (c.organizationName || "").toLowerCase().includes(q)
                        );
                      })
                      .map((c) => (
                        <tr key={c.id}>
                          <td>
                            <strong className="td-primary">{c.name}</strong>
                            <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                              {(c.tags || []).map((tag) => (
                                <span key={tag} className="admin-badge admin-badge-gray" style={{ fontSize: 9 }}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--admin-text)" }}>
                              {c.organizationName || "Independent"}
                            </span>
                            <br />
                            <span style={{ fontSize: 11, color: "var(--admin-text-muted)" }}>
                              {c.jobTitle || "Stakeholder"}
                            </span>
                          </td>
                          <td>
                            <a href={`mailto:${c.email}`} style={{ fontSize: 12, color: "var(--admin-accent)", textDecoration: "none" }}>
                              {c.email}
                            </a>
                            {c.phone && (
                              <div style={{ fontSize: 11, color: "var(--admin-text-muted)", marginTop: 2 }}>
                                {c.phone}
                              </div>
                            )}
                          </td>
                          <td>
                            <span
                              className={`admin-badge ${
                                c.status === "Active Client"
                                  ? "admin-badge-green"
                                  : c.status === "Lead"
                                    ? "admin-badge-yellow"
                                    : "admin-badge-gray"
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td style={{ fontSize: 12, color: "var(--admin-text-secondary)" }}>
                            {c.owner}
                          </td>
                          <td style={{ fontSize: 11, color: "var(--admin-text-muted)" }}>
                            {c.nextFollowUp ? new Date(c.nextFollowUp).toLocaleDateString() : "—"}
                          </td>
                          <td>
                            <div className="admin-actions">
                              <button
                                className="admin-btn admin-btn-ghost admin-btn-icon"
                                onClick={() => {
                                  setContactForm(c);
                                  setContactModal({ open: true, item: c });
                                }}
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                className="admin-btn admin-btn-danger admin-btn-icon"
                                onClick={() => setDeleteConfirm({ entity: "contact", id: c.id, name: c.name })}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: TASKS & FOLLOW-UPS */}
          {activeTab === "tasks" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>Done</th>
                      <th>Task Title</th>
                      <th>Related Deal / Account</th>
                      <th>Priority</th>
                      <th>Assignee</th>
                      <th>Due Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => {
                      const isOverdue = task.status !== "completed" && task.dueDate && new Date(task.dueDate) < new Date();

                      return (
                        <tr key={task.id} style={{ opacity: task.status === "completed" ? 0.6 : 1 }}>
                          <td>
                            <input
                              type="checkbox"
                              checked={task.status === "completed"}
                              onChange={() => handleToggleTask(task.id)}
                              style={{ width: 16, height: 16, cursor: "pointer" }}
                            />
                          </td>
                          <td>
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 500,
                                textDecoration: task.status === "completed" ? "line-through" : "none",
                                color: "var(--admin-text)",
                              }}
                            >
                              {task.title}
                            </span>
                            {task.description && (
                              <p style={{ fontSize: 11, color: "var(--admin-text-muted)", marginTop: 2 }}>
                                {task.description}
                              </p>
                            )}
                          </td>
                          <td style={{ fontSize: 12, color: "var(--admin-text-secondary)" }}>
                            {task.relatedName || "General Studio Task"}
                          </td>
                          <td>
                            <span
                              className={`admin-badge ${
                                task.priority === "urgent"
                                  ? "admin-badge-red"
                                  : task.priority === "high"
                                    ? "admin-badge-yellow"
                                    : "admin-badge-gray"
                              }`}
                            >
                              {task.priority.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ fontSize: 12, color: "var(--admin-text)" }}>
                            {task.assignee}
                          </td>
                          <td>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: isOverdue ? 700 : 400,
                                color: isOverdue ? "#f87171" : "var(--admin-text-muted)",
                              }}
                            >
                              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No date"}
                              {isOverdue && " (Overdue)"}
                            </span>
                          </td>
                          <td>
                            <div className="admin-actions">
                              <button
                                className="admin-btn admin-btn-ghost admin-btn-icon"
                                onClick={() => {
                                  setTaskForm(task);
                                  setTaskModal({ open: true, item: task });
                                }}
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                className="admin-btn admin-btn-danger admin-btn-icon"
                                onClick={() => setDeleteConfirm({ entity: "task", id: task.id, name: task.title })}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: PROPOSALS */}
          {activeTab === "proposals" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Proposal Title</th>
                      <th>Client / Organization</th>
                      <th>Value</th>
                      <th>Scope Overview</th>
                      <th>Status</th>
                      <th>Valid Until</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposals.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <strong className="td-primary">{p.title}</strong>
                        </td>
                        <td>
                          <span style={{ fontSize: 13, color: "var(--admin-text)" }}>{p.organizationName}</span>
                          <br />
                          <span style={{ fontSize: 11, color: "var(--admin-text-muted)" }}>{p.contactName}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#10b981" }}>
                            ${Number(p.value).toLocaleString()}
                          </span>
                        </td>
                        <td style={{ maxWidth: 260 }}>
                          <p style={{ fontSize: 12, color: "var(--admin-text-secondary)", margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {p.scope}
                          </p>
                        </td>
                        <td>
                          <span
                            className={`admin-badge ${
                              p.status === "accepted"
                                ? "admin-badge-green"
                                : p.status === "under_review" || p.status === "sent"
                                  ? "admin-badge-yellow"
                                  : "admin-badge-gray"
                            }`}
                          >
                            {p.status.replace("_", " ").toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontSize: 11, color: "var(--admin-text-muted)" }}>
                          {p.validUntil ? new Date(p.validUntil).toLocaleDateString() : "—"}
                        </td>
                        <td>
                          <div className="admin-actions">
                            <button
                              className="admin-btn admin-btn-ghost admin-btn-icon"
                              onClick={() => {
                                setProposalForm(p);
                                setProposalModal({ open: true, item: p });
                              }}
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              className="admin-btn admin-btn-danger admin-btn-icon"
                              onClick={() => setDeleteConfirm({ entity: "proposal", id: p.id, name: p.title })}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT LOG & ACTIVITIES */}
          {activeTab === "activity" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div className="admin-card">
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--admin-text)", marginBottom: 16 }}>
                  Recent Team Activities
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {activities.map((a) => (
                    <div
                      key={a.id}
                      style={{
                        padding: "10px 14px",
                        background: "var(--admin-surface-2)",
                        borderRadius: "var(--admin-radius-sm)",
                        border: "1px solid var(--admin-border)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <strong style={{ fontSize: 12, color: "var(--admin-text)" }}>{a.title}</strong>
                        <span style={{ fontSize: 10, color: "var(--admin-text-muted)" }}>
                          {new Date(a.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: "var(--admin-text-secondary)", marginTop: 4 }}>
                        {a.description}
                      </p>
                      <div style={{ fontSize: 10, color: "var(--admin-text-muted)", marginTop: 4 }}>
                        By {a.author} · {a.relatedName}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="admin-card">
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--admin-text)", marginBottom: 16 }}>
                  System Audit Trail
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {(metrics?.auditLog || []).map((entry) => (
                    <div
                      key={entry.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        borderBottom: "1px solid var(--admin-border)",
                        fontSize: 11,
                      }}
                    >
                      <div>
                        <span
                          className={`admin-badge ${
                            entry.action === "CREATE"
                              ? "admin-badge-green"
                              : entry.action === "DELETE"
                                ? "admin-badge-red"
                                : "admin-badge-yellow"
                          }`}
                          style={{ marginRight: 8, fontSize: 9 }}
                        >
                          {entry.action}
                        </span>
                        <strong style={{ color: "var(--admin-text)" }}>{entry.entityType}</strong>: {entry.details}
                      </div>
                      <span style={{ color: "var(--admin-text-muted)", whiteSpace: "nowrap", marginLeft: 12 }}>
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PROJECTS & DELIVERY (SHARED WITH CLIENT PORTAL) */}
          {activeTab === "projects" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--admin-text)" }}>
                    Active Client Delivery Projects
                  </h3>
                  <p style={{ fontSize: 12, color: "var(--admin-text-secondary)", marginTop: 2 }}>
                    Authoritative project workspace synchronized in real-time with each client&apos;s portal. Status changes to &quot;completed&quot; unlock verified client reviews.
                  </p>
                </div>
                <span className="admin-badge admin-badge-green" style={{ fontSize: 11 }}>
                  {accounts.length} Client Accounts on File
                </span>
              </div>

              {accounts.length === 0 ? (
                <div className="admin-card" style={{ padding: 48, textAlign: "center", color: "var(--admin-text-muted)" }}>
                  No delivery accounts found. Convert a won lead from the Sales Pipeline tab to initialize a client project.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {accounts.map((acc) => {
                    const p = acc.project;
                    const isCompleted = p.status === "completed" || p.status === "launched";
                    const deliverables = p.deliverables || [];
                    const milestones = p.milestones || [];
                    const inquiries = p.inquiries || [];

                    return (
                      <div key={acc.id} className="admin-card" style={{ padding: 24 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, borderBottom: "1px solid var(--admin-border)", paddingBottom: 16 }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <strong style={{ fontSize: 16, color: "var(--admin-text)" }}>{p.name || "Untitled Engagement"}</strong>
                              {isCompleted && (
                                <span className="admin-badge admin-badge-green" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                  <ShieldCheck size={11} /> Review Unlocked
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 12, color: "var(--admin-text-secondary)", marginTop: 4 }}>
                              Client: <strong>{acc.company || acc.name}</strong> ({acc.email}) · Started: {p.startDate || "N/A"}
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            {/* Project Lifecycle Status Dropdown */}
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 11, color: "var(--admin-text-muted)", textTransform: "uppercase" }}>
                                Lifecycle:
                              </span>
                              <select
                                className="admin-input"
                                value={p.status}
                                onChange={(e) => handleUpdateProject(acc.id, { status: e.target.value as ProjectStatus })}
                                style={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: isCompleted ? "#10b981" : "var(--admin-text)",
                                  padding: "4px 8px",
                                }}
                              >
                                <option value="planning">Planning</option>
                                <option value="design">Design</option>
                                <option value="development">Development</option>
                                <option value="testing">Testing</option>
                                <option value="launched">Launched</option>
                                <option value="completed">Completed (Unlocks Review)</option>
                                <option value="on-hold">On Hold</option>
                              </select>
                            </div>

                            {/* Progress percentage */}
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 11, color: "var(--admin-text-muted)" }}>Progress:</span>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                className="admin-input"
                                style={{ width: 64, fontSize: 12, textAlign: "center" }}
                                value={p.progress || 0}
                                onChange={(e) => handleUpdateProject(acc.id, { progress: Math.max(0, Math.min(100, Number(e.target.value))) })}
                              />
                              <span style={{ fontSize: 12, color: "var(--admin-text-muted)" }}>%</span>
                            </div>
                          </div>
                        </div>

                        {/* Milestones & Deliverables Subsections */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, marginTop: 18 }}>
                          {/* Milestones Column */}
                          <div style={{ background: "var(--admin-surface-2)", borderRadius: "var(--admin-radius-sm)", padding: 16 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                              <strong style={{ fontSize: 13, color: "var(--admin-text)" }}>
                                Milestones ({milestones.filter((m) => m.status === "done").length}/{milestones.length})
                              </strong>
                              <button
                                type="button"
                                className="admin-btn admin-btn-ghost"
                                style={{ fontSize: 11, padding: "2px 8px" }}
                                onClick={() => setNewMilestoneModal({ open: true, accountId: acc.id })}
                              >
                                <Plus size={12} /> Add Milestone
                              </button>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {milestones.length === 0 ? (
                                <span style={{ fontSize: 11, color: "var(--admin-text-muted)" }}>No milestones set</span>
                              ) : (
                                milestones.map((m, idx) => (
                                  <div
                                    key={m.id || idx}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      padding: "6px 10px",
                                      background: "var(--admin-surface)",
                                      borderRadius: 4,
                                      fontSize: 12,
                                    }}
                                  >
                                    <span style={{ color: "var(--admin-text)", fontWeight: 500 }}>{m.title}</span>
                                    <button
                                      type="button"
                                      className={`admin-badge ${m.status === "done" ? "admin-badge-green" : m.status === "active" ? "admin-badge-yellow" : "admin-badge-gray"}`}
                                      style={{ cursor: "pointer", border: "none" }}
                                      onClick={() => {
                                        const nextStatus = m.status === "done" ? "todo" : m.status === "active" ? "done" : "active";
                                        const updatedMilestones = [...milestones];
                                        updatedMilestones[idx] = { ...m, status: nextStatus };
                                        handleUpdateProject(acc.id, { milestones: updatedMilestones });
                                      }}
                                    >
                                      {m.status.toUpperCase()}
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* Deliverables Column */}
                          <div style={{ background: "var(--admin-surface-2)", borderRadius: "var(--admin-radius-sm)", padding: 16 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                              <strong style={{ fontSize: 13, color: "var(--admin-text)" }}>
                                Deliverables & Artifacts ({deliverables.length})
                              </strong>
                              <button
                                type="button"
                                className="admin-btn admin-btn-ghost"
                                style={{ fontSize: 11, padding: "2px 8px" }}
                                onClick={() => setNewDeliverableModal({ open: true, accountId: acc.id })}
                              >
                                <Plus size={12} /> Add Deliverable
                              </button>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {deliverables.length === 0 ? (
                                <span style={{ fontSize: 11, color: "var(--admin-text-muted)" }}>No deliverables shared</span>
                              ) : (
                                deliverables.map((d) => (
                                  <div
                                    key={d.id}
                                    style={{
                                      padding: "8px 10px",
                                      background: "var(--admin-surface)",
                                      borderRadius: 4,
                                      fontSize: 12,
                                    }}
                                  >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                      <strong style={{ color: "var(--admin-text)" }}>{d.title} (v{d.version || "1.0"})</strong>
                                      <span
                                        className={`admin-badge ${
                                          d.status === "approved"
                                            ? "admin-badge-green"
                                            : d.status === "revision_requested"
                                              ? "admin-badge-red"
                                              : "admin-badge-yellow"
                                        }`}
                                        style={{ fontSize: 10 }}
                                      >
                                        {d.status === "approved"
                                          ? "Approved by Client"
                                          : d.status === "revision_requested"
                                            ? "Revision Requested"
                                            : "Pending Approval"}
                                      </span>
                                    </div>
                                    {d.feedback && (
                                      <div style={{ marginTop: 4, fontSize: 11, color: "#f59e0b", background: "rgba(245, 158, 11, 0.1)", padding: "4px 8px", borderRadius: 4 }}>
                                        <strong>Client Feedback:</strong> &ldquo;{d.feedback}&rdquo;
                                      </div>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Client Inquiries in CRM */}
                        {inquiries.length > 0 && (
                          <div style={{ marginTop: 18, borderTop: "1px solid var(--admin-border)", paddingTop: 14 }}>
                            <strong style={{ fontSize: 13, color: "var(--admin-text)", display: "block", marginBottom: 8 }}>
                              Client Inquiries & Support Requests ({inquiries.filter((i) => i.status !== "resolved").length} Open)
                            </strong>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                              {inquiries.map((inq) => (
                                <div key={inq.id} style={{ background: "var(--admin-surface-2)", padding: 12, borderRadius: 6 }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                    <strong style={{ fontSize: 12, color: "var(--admin-text)" }}>{inq.subject}</strong>
                                    <span className={`admin-badge ${inq.status === "resolved" ? "admin-badge-green" : "admin-badge-yellow"}`} style={{ fontSize: 9 }}>
                                      {inq.status.toUpperCase()}
                                    </span>
                                  </div>
                                  <p style={{ fontSize: 11, color: "var(--admin-text-secondary)", marginTop: 4 }}>{inq.message}</p>
                                  {inq.response ? (
                                    <div style={{ marginTop: 6, fontSize: 11, color: "#10b981" }}>
                                      <strong>Quanta Response:</strong> {inq.response}
                                    </div>
                                  ) : (
                                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                                      <input
                                        type="text"
                                        placeholder="Type reply to client..."
                                        className="admin-input"
                                        style={{ fontSize: 11, height: 28 }}
                                        value={inquiryResponses[inq.id] || ""}
                                        onChange={(e) => setInquiryResponses({ ...inquiryResponses, [inq.id]: e.target.value })}
                                      />
                                      <button
                                        type="button"
                                        className="admin-btn admin-btn-primary"
                                        style={{ fontSize: 11, padding: "2px 10px" }}
                                        onClick={() => handleReplyInquiry(acc.id, inq.id)}
                                      >
                                        Reply & Resolve
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* NEW DELIVERABLE MODAL */}
      {newDeliverableModal.open && (
        <div className="admin-modal-overlay" onClick={() => setNewDeliverableModal({ open: false })}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Publish Project Deliverable</h2>
              <button className="admin-btn admin-btn-ghost admin-btn-icon" onClick={() => setNewDeliverableModal({ open: false })}>
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleCreateDeliverable}>
              <div className="admin-modal-body">
                <div className="admin-form">
                  <div className="admin-form-group">
                    <label className="admin-label">Deliverable Title *</label>
                    <input
                      className="admin-input"
                      required
                      value={delivForm.title}
                      onChange={(e) => setDelivForm({ ...delivForm, title: e.target.value })}
                      placeholder="e.g. Interactive Prototype & Design Token System"
                    />
                  </div>
                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label className="admin-label">Version</label>
                      <input
                        className="admin-input"
                        value={delivForm.version}
                        onChange={(e) => setDelivForm({ ...delivForm, version: e.target.value })}
                        placeholder="1.0"
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">Artifact URL</label>
                      <input
                        className="admin-input"
                        value={delivForm.url}
                        onChange={(e) => setDelivForm({ ...delivForm, url: e.target.value })}
                        placeholder="https://figma.com/... or staging link"
                      />
                    </div>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">Description / Instructions for Client</label>
                    <textarea
                      rows={3}
                      className="admin-textarea"
                      value={delivForm.description}
                      onChange={(e) => setDelivForm({ ...delivForm, description: e.target.value })}
                      placeholder="Review scope, specific items needing feedback..."
                    />
                  </div>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setNewDeliverableModal({ open: false })}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  Publish to Client Portal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW MILESTONE MODAL */}
      {newMilestoneModal.open && (
        <div className="admin-modal-overlay" onClick={() => setNewMilestoneModal({ open: false })}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Add Project Milestone</h2>
              <button className="admin-btn admin-btn-ghost admin-btn-icon" onClick={() => setNewMilestoneModal({ open: false })}>
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleCreateMilestone}>
              <div className="admin-modal-body">
                <div className="admin-form">
                  <div className="admin-form-group">
                    <label className="admin-label">Milestone Title *</label>
                    <input
                      className="admin-input"
                      required
                      value={milestoneForm.title}
                      onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                      placeholder="e.g. Final Design System Delivery"
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">Target Due Date</label>
                    <input
                      type="date"
                      className="admin-input"
                      value={milestoneForm.due}
                      onChange={(e) => setMilestoneForm({ ...milestoneForm, due: e.target.value })}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">Note / Scope</label>
                    <textarea
                      rows={2}
                      className="admin-textarea"
                      value={milestoneForm.note}
                      onChange={(e) => setMilestoneForm({ ...milestoneForm, note: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setNewMilestoneModal({ open: false })}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  Add Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LEAD MODAL */}
      {leadModal.open && (
        <div className="admin-modal-overlay" onClick={() => setLeadModal({ open: false })}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">{leadModal.item ? "Edit Lead Opportunity" : "Create New Lead"}</h2>
              <button className="admin-btn admin-btn-ghost admin-btn-icon" onClick={() => setLeadModal({ open: false })}>
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleSaveLead}>
              <div className="admin-modal-body">
                <div className="admin-form">
                  <div className="admin-form-group">
                    <label className="admin-label">Opportunity Title *</label>
                    <input
                      className="admin-input"
                      value={leadForm.title || ""}
                      onChange={(e) => setLeadForm({ ...leadForm, title: e.target.value })}
                      placeholder="e.g. Next-Gen Mobile Checkout Design"
                      required
                    />
                  </div>

                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label className="admin-label">Organization Name *</label>
                      <input
                        className="admin-input"
                        value={leadForm.organizationName || ""}
                        onChange={(e) => setLeadForm({ ...leadForm, organizationName: e.target.value })}
                        placeholder="e.g. Acme Labs"
                        required
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">Key Contact Name *</label>
                      <input
                        className="admin-input"
                        value={leadForm.contactName || ""}
                        onChange={(e) => setLeadForm({ ...leadForm, contactName: e.target.value })}
                        placeholder="e.g. Jane Doe"
                        required
                      />
                    </div>
                  </div>

                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label className="admin-label">Estimated Value ($)</label>
                      <input
                        type="number"
                        className="admin-input"
                        value={leadForm.value || 0}
                        onChange={(e) => setLeadForm({ ...leadForm, value: Number(e.target.value) })}
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">Pipeline Stage</label>
                      <select
                        className="admin-input"
                        value={leadForm.stage || "new"}
                        onChange={(e) => setLeadForm({ ...leadForm, stage: e.target.value as PipelineStage })}
                      >
                        {STAGES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label className="admin-label">Deal Owner</label>
                      <select
                        className="admin-input"
                        value={leadForm.owner || "Taha Shah"}
                        onChange={(e) => setLeadForm({ ...leadForm, owner: e.target.value })}
                      >
                        <option value="Taha Shah">Taha Shah</option>
                        <option value="Zeeshan Aftab">Zeeshan Aftab</option>
                        <option value="Yousaf Safeer">Yousaf Safeer</option>
                        <option value="Waleed Ahmad">Waleed Ahmad</option>
                        <option value="Faseeh Ur Rahman">Faseeh Ur Rahman</option>
                      </select>
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">Expected Decision Date</label>
                      <input
                        type="date"
                        className="admin-input"
                        value={leadForm.expectedCloseDate || ""}
                        onChange={(e) => setLeadForm({ ...leadForm, expectedCloseDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-label">Scope & Internal Notes</label>
                    <textarea
                      rows={3}
                      className="admin-textarea"
                      value={leadForm.notes || ""}
                      onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                      placeholder="Requirements, timeline, budget constraints..."
                    />
                  </div>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setLeadModal({ open: false })}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                  {saving ? "Saving..." : "Save Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONTACT MODAL */}
      {contactModal.open && (
        <div className="admin-modal-overlay" onClick={() => setContactModal({ open: false })}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">{contactModal.item ? "Edit Contact" : "Add New Contact"}</h2>
              <button className="admin-btn admin-btn-ghost admin-btn-icon" onClick={() => setContactModal({ open: false })}>
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleSaveContact}>
              <div className="admin-modal-body">
                <div className="admin-form">
                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label className="admin-label">Full Name *</label>
                      <input
                        className="admin-input"
                        value={contactForm.name || ""}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">Email Address *</label>
                      <input
                        type="email"
                        className="admin-input"
                        value={contactForm.email || ""}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label className="admin-label">Company / Organization</label>
                      <input
                        className="admin-input"
                        value={contactForm.organizationName || ""}
                        onChange={(e) => setContactForm({ ...contactForm, organizationName: e.target.value })}
                        list="org-suggestions"
                        placeholder="e.g. Veritas Labs"
                      />
                      <datalist id="org-suggestions">
                        {organizations.map((org) => (
                          <option key={org.id} value={org.name} />
                        ))}
                      </datalist>
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">Job Title</label>
                      <input
                        className="admin-input"
                        value={contactForm.jobTitle || ""}
                        onChange={(e) => setContactForm({ ...contactForm, jobTitle: e.target.value })}
                        placeholder="e.g. CTO, Product Lead"
                      />
                    </div>
                  </div>

                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label className="admin-label">Phone Number</label>
                      <input
                        className="admin-input"
                        value={contactForm.phone || ""}
                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">Relationship Status</label>
                      <select
                        className="admin-input"
                        value={contactForm.status || "Lead"}
                        onChange={(e) => setContactForm({ ...contactForm, status: e.target.value as Contact["status"] })}
                      >
                        <option value="Lead">Lead</option>
                        <option value="Active Client">Active Client</option>
                        <option value="Past Client">Past Client</option>
                        <option value="Partner">Partner</option>
                      </select>
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-label">Account Notes</label>
                    <textarea
                      rows={2}
                      className="admin-textarea"
                      value={contactForm.notes || ""}
                      onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setContactModal({ open: false })}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                  {saving ? "Saving..." : "Save Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK MODAL */}
      {taskModal.open && (
        <div className="admin-modal-overlay" onClick={() => setTaskModal({ open: false })}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">{taskModal.item ? "Edit Task" : "Create New Task"}</h2>
              <button className="admin-btn admin-btn-ghost admin-btn-icon" onClick={() => setTaskModal({ open: false })}>
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleSaveTask}>
              <div className="admin-modal-body">
                <div className="admin-form">
                  <div className="admin-form-group">
                    <label className="admin-label">Task Title *</label>
                    <input
                      className="admin-input"
                      value={taskForm.title || ""}
                      onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                      placeholder="e.g. Follow up on proposal feedback"
                      required
                    />
                  </div>

                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label className="admin-label">Assignee</label>
                      <select
                        className="admin-input"
                        value={taskForm.assignee || "Taha Shah"}
                        onChange={(e) => setTaskForm({ ...taskForm, assignee: e.target.value })}
                      >
                        <option value="Taha Shah">Taha Shah</option>
                        <option value="Zeeshan Aftab">Zeeshan Aftab</option>
                        <option value="Yousaf Safeer">Yousaf Safeer</option>
                        <option value="Waleed Ahmad">Waleed Ahmad</option>
                        <option value="Faseeh Ur Rahman">Faseeh Ur Rahman</option>
                      </select>
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">Priority</label>
                      <select
                        className="admin-input"
                        value={taskForm.priority || "medium"}
                        onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as TaskPriority })}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label className="admin-label">Due Date</label>
                      <input
                        type="date"
                        className="admin-input"
                        value={taskForm.dueDate ? taskForm.dueDate.slice(0, 10) : ""}
                        onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">Related Deal or Account</label>
                      <input
                        className="admin-input"
                        value={taskForm.relatedName || ""}
                        onChange={(e) => setTaskForm({ ...taskForm, relatedName: e.target.value })}
                        placeholder="e.g. Synapse Flow"
                      />
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-label">Details / Checklist</label>
                    <textarea
                      rows={3}
                      className="admin-textarea"
                      value={taskForm.description || ""}
                      onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setTaskModal({ open: false })}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                  {saving ? "Saving..." : "Save Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROPOSAL MODAL */}
      {proposalModal.open && (
        <div className="admin-modal-overlay" onClick={() => setProposalModal({ open: false })}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">{proposalModal.item ? "Edit Proposal" : "Create New Proposal"}</h2>
              <button className="admin-btn admin-btn-ghost admin-btn-icon" onClick={() => setProposalModal({ open: false })}>
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleSaveProposal}>
              <div className="admin-modal-body">
                <div className="admin-form">
                  <div className="admin-form-group">
                    <label className="admin-label">Proposal Title *</label>
                    <input
                      className="admin-input"
                      value={proposalForm.title || ""}
                      onChange={(e) => setProposalForm({ ...proposalForm, title: e.target.value })}
                      placeholder="e.g. Quanta Brand & Interactive Web Application"
                      required
                    />
                  </div>

                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label className="admin-label">Organization Name *</label>
                      <input
                        className="admin-input"
                        value={proposalForm.organizationName || ""}
                        onChange={(e) => setProposalForm({ ...proposalForm, organizationName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">Key Contact Name</label>
                      <input
                        className="admin-input"
                        value={proposalForm.contactName || ""}
                        onChange={(e) => setProposalForm({ ...proposalForm, contactName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label className="admin-label">Value ($)</label>
                      <input
                        type="number"
                        className="admin-input"
                        value={proposalForm.value || 0}
                        onChange={(e) => setProposalForm({ ...proposalForm, value: Number(e.target.value) })}
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">Status</label>
                      <select
                        className="admin-input"
                        value={proposalForm.status || "sent"}
                        onChange={(e) => setProposalForm({ ...proposalForm, status: e.target.value as Proposal["status"] })}
                      >
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="under_review">Under Review</option>
                        <option value="accepted">Accepted</option>
                        <option value="declined">Declined</option>
                      </select>
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-label">Scope & Deliverables</label>
                    <textarea
                      rows={3}
                      className="admin-textarea"
                      value={proposalForm.scope || ""}
                      onChange={(e) => setProposalForm({ ...proposalForm, scope: e.target.value })}
                      placeholder="Key milestones, deliverables, tech stack..."
                    />
                  </div>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setProposalModal({ open: false })}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                  {saving ? "Saving..." : "Save Proposal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm && (
        <div className="admin-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="admin-modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Confirm Deletion</h2>
              <button className="admin-btn admin-btn-ghost admin-btn-icon" onClick={() => setDeleteConfirm(null)}>
                <X size={15} />
              </button>
            </div>
            <div className="admin-modal-body admin-confirm">
              <p>Are you sure you want to permanently delete <strong>{deleteConfirm.name}</strong>?</p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20 }}>
                <button className="admin-btn admin-btn-ghost" onClick={() => setDeleteConfirm(null)}>
                  Cancel
                </button>
                <button className="admin-btn admin-btn-danger" onClick={executeDelete}>
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
