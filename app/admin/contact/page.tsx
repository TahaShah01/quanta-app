"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Mail,
  Search,
  CheckCircle2,
  Archive,
  Trash2,
  Send,
  ExternalLink,
  Copy,
  Check,
  Building,
  DollarSign,
  AlertCircle,
  Inbox,
  X,
  RotateCcw,
} from "lucide-react";
import type { ContactMessage, MessageStats, MessageStatus, MessageSource } from "@/lib/messages";

export default function AdminContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [stats, setStats] = useState<MessageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | MessageStatus>("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | MessageSource>("all");

  // Selected message for view / reply modal
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Email composer form state
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [replySentBy, setReplySentBy] = useState("Quanta Studio Team");
  const [savingReply, setSavingReply] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/contact");
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setStats(data.stats || null);
      }
    } catch (e) {
      console.error("Failed to fetch messages:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
    void fetchMessages();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMessages();
  };

  // Open modal to view & reply
  const handleOpenMessage = (msg: ContactMessage) => {
    setSelectedMessage(msg);
    setReplySubject(`Re: ${msg.subject || "Project Inquiry"} — Quanta Studio`);
    setReplyBody(
      msg.replyBody ||
        `Hi ${msg.name.split(" ")[0] || msg.name},\n\nThank you for reaching out to Quanta Studio regarding your project inquiry.\n\nWe have reviewed your details and would love to schedule a brief alignment call to discuss the scope and next steps.\n\nCould you let us know what days and times work best for your team this week?\n\nBest regards,\nQuanta Studio Team\nhttps://quanta.design`
    );
    setReplySentBy(msg.replySentBy || "Quanta Studio Team");
    setReplyModalOpen(true);

    // If unread, automatically mark as read
    if (msg.status === "unread") {
      updateStatus(msg.id, "read");
    }
  };

  // Update status (read, unread, archived, replied)
  const updateStatus = async (id: string, status: MessageStatus) => {
    try {
      const res = await fetch(`/api/contact/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, status } : m))
        );
        if (selectedMessage?.id === id) {
          setSelectedMessage((prev) => (prev ? { ...prev, status } : null));
        }
        fetchMessages();
      }
    } catch (e) {
      console.error("Failed to update status:", e);
    }
  };

  // Delete message
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/contact/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteConfirmId(null);
        if (selectedMessage?.id === id) {
          setReplyModalOpen(false);
          setSelectedMessage(null);
        }
        showToast("Message deleted successfully.");
        fetchMessages();
      }
    } catch (e) {
      console.error("Failed to delete message:", e);
    }
  };

  // Send & record email reply
  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage) return;

    setSavingReply(true);
    try {
      const res = await fetch(`/api/contact/${selectedMessage.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "replied",
          replySubject,
          replyBody,
          replySentBy,
        }),
      });

      if (res.ok) {
        showToast(`Reply recorded & status updated for ${selectedMessage.name}.`);
        setReplyModalOpen(false);
        fetchMessages();
      }
    } catch (e) {
      console.error("Failed to save reply:", e);
    } finally {
      setSavingReply(false);
    }
  };

  // Build mailto link
  const mailtoUrl = useMemo(() => {
    if (!selectedMessage) return "";
    const subject = encodeURIComponent(replySubject);
    const body = encodeURIComponent(replyBody);
    return `mailto:${selectedMessage.email}?subject=${subject}&body=${body}`;
  }, [selectedMessage, replySubject, replyBody]);

  // Copy email
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  // Filter messages
  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (sourceFilter !== "all" && m.source !== sourceFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          (m.company && m.company.toLowerCase().includes(q)) ||
          (m.subject && m.subject.toLowerCase().includes(q)) ||
          m.message.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [messages, statusFilter, sourceFilter, search]);

  return (
    <div className="admin-content">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-[#12121a] px-4 py-3 font-mono text-xs text-emerald-400 shadow-2xl backdrop-blur-md">
          <CheckCircle2 size={16} />
          {toastMessage}
        </div>
      )}

      {/* Page Header */}
      <div className="admin-header flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="admin-title flex items-center gap-2.5 text-2xl font-bold">
            <Mail size={22} className="text-[var(--admin-accent)]" />
            Messages & Inquiries
          </h1>
          <p className="admin-subtitle text-xs text-[var(--admin-text-secondary)] mt-1">
            Centralized communications inbox for inbound website contact leads, prospective clients, and portal inquiries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="admin-btn admin-btn-secondary flex items-center gap-2 text-xs"
          >
            <RotateCcw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="admin-card p-5">
          <div className="flex items-center justify-between text-xs text-[var(--admin-text-secondary)] mb-2">
            <span>Total Messages</span>
            <Inbox size={16} className="text-[var(--admin-accent)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--admin-text)]">
            {stats ? stats.total : "..."}
          </div>
          <p className="text-[11px] text-[var(--admin-text-muted)] mt-1 font-mono">
            All inbound communications
          </p>
        </div>

        <div className="admin-card p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-xs text-amber-400 mb-2 font-medium">
            <span>Unread Inquiries</span>
            <AlertCircle size={16} />
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {stats ? stats.unread : "..."}
          </div>
          <p className="text-[11px] text-[var(--admin-text-muted)] mt-1 font-mono">
            Awaiting initial review
          </p>
        </div>

        <div className="admin-card p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-xs text-emerald-400 mb-2 font-medium">
            <span>Replied / Resolved</span>
            <CheckCircle2 size={16} />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {stats ? stats.replied : "..."}
          </div>
          <p className="text-[11px] text-[var(--admin-text-muted)] mt-1 font-mono">
            Followed up via email
          </p>
        </div>

        <div className="admin-card p-5">
          <div className="flex items-center justify-between text-xs text-[var(--admin-text-secondary)] mb-2">
            <span>Client Portal Requests</span>
            <Building size={16} className="text-[var(--admin-accent)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--admin-text)]">
            {stats ? stats.portalCount : "..."}
          </div>
          <p className="text-[11px] text-[var(--admin-text-muted)] mt-1 font-mono">
            Active client engagements
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="admin-card p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "all" as const, label: "All Messages", count: stats?.total },
            { id: "unread" as const, label: "Unread", count: stats?.unread },
            { id: "read" as const, label: "Read", count: stats?.read },
            { id: "replied" as const, label: "Replied", count: stats?.replied },
            { id: "archived" as const, label: "Archived", count: stats?.archived },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? "bg-[var(--admin-accent)] text-white font-semibold"
                  : "bg-[var(--admin-surface-2)] text-[var(--admin-text-secondary)] hover:text-[var(--admin-text)]"
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === "number" && tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    statusFilter === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-[var(--admin-surface)] text-[var(--admin-text)]"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Source Filter & Search Input */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as "all" | MessageSource)}
            className="admin-select text-xs py-1.5 px-3 rounded-lg bg-[var(--admin-surface-2)] text-[var(--admin-text)] border border-[var(--admin-border)]"
          >
            <option value="all">All Sources</option>
            <option value="website_contact">Website Contact Form</option>
            <option value="client_portal">Client Portal Inquiries</option>
          </select>

          <div className="relative flex-1 md:w-64">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)]"
            />
            <input
              type="text"
              placeholder="Search sender, email, company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-input pl-9 pr-3 py-1.5 text-xs w-full"
            />
          </div>
        </div>
      </div>

      {/* Message List Table */}
      <div className="admin-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[var(--admin-text-muted)] font-mono">
            Loading messages...
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-16 text-center">
            <Mail size={32} className="mx-auto mb-3 text-[var(--admin-text-muted)] opacity-50" />
            <p className="text-sm font-medium text-[var(--admin-text)]">No messages match your criteria</p>
            <p className="text-xs text-[var(--admin-text-secondary)] mt-1">
              Try adjusting your search terms or status filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--admin-border)] text-[var(--admin-text-muted)] font-mono uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 w-8">Status</th>
                  <th className="py-3 px-4">Sender & Company</th>
                  <th className="py-3 px-4">Subject & Message</th>
                  <th className="py-3 px-4">Budget / Context</th>
                  <th className="py-3 px-4">Received</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--admin-border)]">
                {filteredMessages.map((msg) => {
                  const isUnread = msg.status === "unread";
                  const isReplied = msg.status === "replied";

                  return (
                    <tr
                      key={msg.id}
                      onClick={() => handleOpenMessage(msg)}
                      className={`cursor-pointer transition-colors hover:bg-[var(--admin-surface-2)]/60 ${
                        isUnread ? "bg-[var(--admin-accent-subtle)]/20 font-medium" : ""
                      }`}
                    >
                      {/* Status Indicator */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block w-2.5 h-2.5 rounded-full ${
                            isUnread
                              ? "bg-amber-400 ring-4 ring-amber-400/20"
                              : isReplied
                              ? "bg-emerald-400"
                              : "bg-[var(--admin-text-muted)]"
                          }`}
                          title={`Status: ${msg.status}`}
                        />
                      </td>

                      {/* Sender */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-[var(--admin-text)]">
                            {msg.name}
                          </span>
                          <span className="text-[11px] text-[var(--admin-text-secondary)] font-mono">
                            {msg.email}
                          </span>
                          {msg.company && (
                            <span className="text-[10px] text-[var(--admin-accent)] flex items-center gap-1 mt-0.5">
                              <Building size={10} /> {msg.company}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Subject & Preview */}
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-[var(--admin-text)] truncate">
                            {msg.subject || "Project Inquiry"}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded font-mono text-[9px] uppercase tracking-wider ${
                              msg.source === "client_portal"
                                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            }`}
                          >
                            {msg.source === "client_portal" ? "Client Portal" : "Website"}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--admin-text-secondary)] line-clamp-2 leading-relaxed">
                          {msg.message}
                        </p>
                      </td>

                      {/* Budget / Meta */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {msg.budget ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <DollarSign size={10} /> {msg.budget}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[var(--admin-text-muted)] font-mono">
                            Unspecified
                          </span>
                        )}
                      </td>

                      {/* Received Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-[var(--admin-text-muted)] font-mono">
                        {new Date(msg.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        <span className="block text-[10px]">
                          {new Date(msg.createdAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenMessage(msg)}
                            className="admin-btn admin-btn-sm admin-btn-secondary inline-flex items-center gap-1 text-[11px]"
                            title="Reply via Email"
                          >
                            <Send size={12} className="text-[var(--admin-accent)]" />
                            Reply
                          </button>

                          {msg.status !== "archived" ? (
                            <button
                              type="button"
                              onClick={() => updateStatus(msg.id, "archived")}
                              className="p-1.5 rounded-lg text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-surface-2)]"
                              title="Archive message"
                            >
                              <Archive size={14} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => updateStatus(msg.id, "read")}
                              className="p-1.5 rounded-lg text-emerald-400 hover:bg-[var(--admin-surface-2)]"
                              title="Unarchive message"
                            >
                              <CheckCircle2 size={14} />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(msg.id)}
                            className="p-1.5 rounded-lg text-[var(--admin-text-muted)] hover:text-rose-400 hover:bg-rose-500/10"
                            title="Delete message"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW & EMAIL REPLY MODAL */}
      {replyModalOpen && selectedMessage && (
        <div
          className="admin-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setReplyModalOpen(false)}
        >
          <div
            className="admin-modal w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 md:p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[var(--admin-border)] mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider ${
                      selectedMessage.status === "unread"
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        : selectedMessage.status === "replied"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-[var(--admin-surface-2)] text-[var(--admin-text-secondary)]"
                    }`}
                  >
                    {selectedMessage.status}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded font-mono text-[10px] uppercase tracking-wider ${
                      selectedMessage.source === "client_portal"
                        ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                        : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                    }`}
                  >
                    {selectedMessage.source === "client_portal" ? "Client Portal" : "Website Contact"}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[var(--admin-text)]">
                  {selectedMessage.subject || "Project Inquiry"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReplyModalOpen(false)}
                className="rounded-full p-1 text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sender Metadata Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] p-4 mb-5 text-xs">
              <div>
                <span className="font-mono text-[10px] uppercase text-[var(--admin-text-muted)] block mb-0.5">
                  Sender
                </span>
                <span className="font-semibold text-[var(--admin-text)]">
                  {selectedMessage.name}
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <a
                    href={`mailto:${selectedMessage.email}`}
                    className="font-mono text-[11px] text-[var(--admin-accent)] hover:underline"
                  >
                    {selectedMessage.email}
                  </a>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedMessage.email)}
                    className="p-1 rounded text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]"
                    title="Copy email address"
                  >
                    {copiedEmail ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              <div>
                <span className="font-mono text-[10px] uppercase text-[var(--admin-text-muted)] block mb-0.5">
                  Company / Organization
                </span>
                <span className="text-[var(--admin-text)]">
                  {selectedMessage.company || "Independent / Individual"}
                </span>

                {selectedMessage.budget && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="font-mono text-[10px] text-[var(--admin-text-muted)]">Budget:</span>
                    <span className="font-mono text-emerald-400 font-medium">{selectedMessage.budget}</span>
                  </div>
                )}
              </div>

              <div className="sm:col-span-2 pt-2 border-t border-[var(--admin-border)] flex items-center justify-between text-[11px] text-[var(--admin-text-muted)] font-mono">
                <span>
                  Received: {new Date(selectedMessage.createdAt).toLocaleString()}
                </span>
                {selectedMessage.readAt && (
                  <span>First read: {new Date(selectedMessage.readAt).toLocaleString()}</span>
                )}
              </div>
            </div>

            {/* Original Message Content */}
            <div className="mb-6">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--admin-text-muted)] block mb-2 font-medium">
                Inquiry Message:
              </span>
              <div className="rounded-xl border border-[var(--admin-border)] bg-[#0d0d12] p-4 text-xs text-[var(--admin-text)] leading-relaxed whitespace-pre-wrap font-sans">
                {selectedMessage.message}
              </div>
            </div>

            {/* Recorded Past Reply (if already replied) */}
            {selectedMessage.repliedAt && selectedMessage.replyBody && (
              <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Recorded Reply Sent by {selectedMessage.replySentBy || "Team"}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--admin-text-muted)]">
                    {new Date(selectedMessage.repliedAt).toLocaleString()}
                  </span>
                </div>
                {selectedMessage.replySubject && (
                  <p className="font-medium text-[var(--admin-text)] mb-1">
                    Subject: {selectedMessage.replySubject}
                  </p>
                )}
                <p className="text-[var(--admin-text-secondary)] whitespace-pre-wrap leading-relaxed">
                  {selectedMessage.replyBody}
                </p>
              </div>
            )}

            {/* Reply Composer Form */}
            <form onSubmit={handleSaveReply} className="flex flex-col gap-4 border-t border-[var(--admin-border)] pt-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send size={15} className="text-[var(--admin-accent)]" />
                  <h4 className="text-sm font-semibold text-[var(--admin-text)]">
                    Reply to {selectedMessage.name} via Email
                  </h4>
                </div>

                <a
                  href={mailtoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="admin-btn admin-btn-sm admin-btn-secondary inline-flex items-center gap-1.5 text-xs text-[var(--admin-accent)] hover:text-white"
                  title="Launch external mail app with prefilled body and subject"
                >
                  <ExternalLink size={12} />
                  Launch Mail App (mailto:)
                </a>
              </div>

              {/* Subject */}
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[11px] text-[var(--admin-text-muted)] uppercase tracking-wider">
                  Subject Line
                </label>
                <input
                  type="text"
                  required
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  className="admin-input text-xs w-full"
                />
              </div>

              {/* Reply Body */}
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[11px] text-[var(--admin-text-muted)] uppercase tracking-wider">
                  Email Response Body
                </label>
                <textarea
                  rows={7}
                  required
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  className="admin-textarea text-xs w-full resize-none font-sans leading-relaxed"
                />
              </div>

              {/* Responder Signature */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="font-mono text-[11px] text-[var(--admin-text-muted)]">Signed by:</span>
                  <input
                    type="text"
                    value={replySentBy}
                    onChange={(e) => setReplySentBy(e.target.value)}
                    className="admin-input text-xs py-1 px-2.5 w-44"
                  />
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setReplyModalOpen(false)}
                    className="admin-btn admin-btn-secondary text-xs"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={savingReply}
                    className="admin-btn admin-btn-primary inline-flex items-center gap-1.5 text-xs font-semibold"
                  >
                    <CheckCircle2 size={14} />
                    {savingReply ? "Saving & Updating..." : "Mark as Replied & Save"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div
          className="admin-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            className="admin-modal w-full max-w-md rounded-2xl border border-rose-500/30 bg-[var(--admin-surface)] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <AlertCircle size={20} />
              <h3 className="text-base font-bold text-[var(--admin-text)]">Confirm Deletion</h3>
            </div>
            <p className="text-xs text-[var(--admin-text-secondary)] leading-relaxed mb-5">
              Are you sure you want to delete this message record? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="admin-btn admin-btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="admin-btn admin-btn-danger text-xs font-semibold"
              >
                Delete Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
