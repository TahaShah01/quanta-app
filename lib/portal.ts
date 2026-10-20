// Client portal accounts and project progress.
//
// BACKEND NOTE: everything that reads or writes accounts lives in this file.
// It stores them in content/portal.json, like every other collection. A backend
// developer can swap these functions for database calls; the API routes and UI
// only use what is exported here.

import { readJSON, writeJSON } from "@/lib/content";
import { hashPassword } from "@/lib/auth";

export type ProjectStatus =
  | "planning"
  | "design"
  | "development"
  | "testing"
  | "launched"
  | "on-hold";

export type MilestoneStatus = "done" | "active" | "todo";

export interface PortalMilestone {
  id: string;
  title: string;
  status: MilestoneStatus;
  due: string;
  note: string;
}

export interface PortalUpdate {
  id: string;
  date: string;
  title: string;
  body: string;
}

export interface PortalLink {
  label: string;
  url: string;
}

export interface PortalProject {
  name: string;
  summary: string;
  status: ProjectStatus;
  /** 0 to 100 */
  progress: number;
  startDate: string;
  targetDate: string;
  milestones: PortalMilestone[];
  updates: PortalUpdate[];
  links: PortalLink[];
}

export interface PortalAccount {
  id: string;
  name: string;
  email: string;
  company: string;
  passwordHash: string;
  active: boolean;
  createdAt: string;
  lastLoginAt: string;
  project: PortalProject;
}

/** What a client (or the admin list) may see: never the hash. */
export type PublicAccount = Omit<PortalAccount, "passwordHash">;

interface PortalFile {
  accounts: PortalAccount[];
}

function load(): PortalFile {
  try {
    const data = readJSON<PortalFile>("portal.json");
    return { accounts: Array.isArray(data.accounts) ? data.accounts : [] };
  } catch {
    return { accounts: [] };
  }
}

function save(file: PortalFile) {
  writeJSON("portal.json", file);
}

export function toPublic(account: PortalAccount): PublicAccount {
  const { passwordHash: _hash, ...rest } = account;
  void _hash;
  return rest;
}

export function emptyProject(): PortalProject {
  return {
    name: "",
    summary: "",
    status: "planning",
    progress: 0,
    startDate: new Date().toISOString().slice(0, 10),
    targetDate: "",
    milestones: [],
    updates: [],
    links: [],
  };
}

export function listAccounts(): PortalAccount[] {
  return load().accounts;
}

export function findByEmail(email: string): PortalAccount | undefined {
  const needle = email.trim().toLowerCase();
  return load().accounts.find((a) => a.email.toLowerCase() === needle);
}

export function findById(id: string): PortalAccount | undefined {
  return load().accounts.find((a) => a.id === id);
}

export function createAccount(
  input: Partial<PortalAccount> & { name: string; email: string },
  password: string
): PortalAccount {
  const file = load();
  if (file.accounts.some((a) => a.email.toLowerCase() === input.email.trim().toLowerCase())) {
    throw new Error("An account with that email already exists.");
  }
  const account: PortalAccount = {
    id: `client-${Date.now()}`,
    name: input.name.trim(),
    email: input.email.trim(),
    company: input.company?.trim() ?? "",
    passwordHash: hashPassword(password),
    active: input.active ?? true,
    createdAt: new Date().toISOString(),
    lastLoginAt: "",
    project: { ...emptyProject(), ...(input.project ?? {}) },
  };
  file.accounts.push(account);
  save(file);
  return account;
}

export function updateAccount(
  id: string,
  patch: Partial<PublicAccount>,
  newPassword?: string
): PortalAccount | undefined {
  const file = load();
  const index = file.accounts.findIndex((a) => a.id === id);
  if (index === -1) return undefined;
  const current = file.accounts[index];
  const next: PortalAccount = {
    ...current,
    ...patch,
    id,
    passwordHash: newPassword ? hashPassword(newPassword) : current.passwordHash,
    project: { ...current.project, ...(patch.project ?? {}) },
  };
  file.accounts[index] = next;
  save(file);
  return next;
}

export function markLogin(id: string) {
  const file = load();
  const account = file.accounts.find((a) => a.id === id);
  if (!account) return;
  account.lastLoginAt = new Date().toISOString();
  save(file);
}

export function deleteAccount(id: string): boolean {
  const file = load();
  const next = file.accounts.filter((a) => a.id !== id);
  if (next.length === file.accounts.length) return false;
  save({ accounts: next });
  return true;
}
