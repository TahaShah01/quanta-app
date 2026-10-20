import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";

const CONTENT_DIR = path.resolve(process.cwd(), "content");

function triggerRevalidation() {
  try {
    revalidatePath("/", "layout");
  } catch {
    // ignore if called outside Next.js request context (e.g. build time or scripts)
  }
}

/** Resolves and guarantees path is strictly inside CONTENT_DIR to prevent path traversal */
function resolveSafe(relativePath: string): string {
  const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, "");
  const target = path.resolve(CONTENT_DIR, normalized);
  if (!target.startsWith(CONTENT_DIR)) {
    throw new Error(`Security Violation: Path traversal attempt: ${relativePath}`);
  }
  return target;
}

/** Atomic write: writes to temporary file then renames, preventing corrupt zero-byte writes */
function atomicWrite(targetPath: string, content: string): void {
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Backup existing file if valid
  const backupPath = `${targetPath}.bak`;
  if (fs.existsSync(targetPath)) {
    try {
      fs.copyFileSync(targetPath, backupPath);
    } catch {
      // Non-fatal if backup copy fails
    }
  }

  const tempPath = path.join(
    dir,
    `.${path.basename(targetPath)}.tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );

  fs.writeFileSync(tempPath, content, "utf-8");

  // Attempt atomic rename with retry on Windows EPERM
  let attempts = 0;
  while (attempts < 5) {
    try {
      fs.renameSync(tempPath, targetPath);
      return;
    } catch (err: unknown) {
      attempts++;
      const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : "";
      if (attempts >= 5 || (code !== "EPERM" && code !== "EBUSY")) {
        // Fallback to direct write if rename is persistently locked
        try {
          fs.writeFileSync(targetPath, content, "utf-8");
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
          return;
        } catch {
          throw err;
        }
      }
      // Busy wait short delay on Windows file lock
      const start = Date.now();
      while (Date.now() - start < 10) {}
    }
  }
}

export function readJSON<T>(filename: string): T {
  const filePath = resolveSafe(filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Content file not found: ${filename}`);
  }

  let raw = "";
  try {
    raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch (err) {
    // If parse failed, try recovering from backup file if available
    const backupPath = `${filePath}.bak`;
    if (fs.existsSync(backupPath)) {
      try {
        const backupRaw = fs.readFileSync(backupPath, "utf-8");
        const parsed = JSON.parse(backupRaw) as T;
        // Restore good file
        fs.copyFileSync(backupPath, filePath);
        return parsed;
      } catch {
        // If backup also fails, throw original error
      }
    }
    throw err;
  }
}

export function writeJSON<T>(filename: string, data: T): void {
  const filePath = resolveSafe(filename);
  const serialized = JSON.stringify(data, null, 2);
  atomicWrite(filePath, serialized);
  triggerRevalidation();
}

export function readBlogPost(slug: string) {
  const sanitizedSlug = slug.replace(/[^a-zA-Z0-9_-]/g, "");
  const filePath = resolveSafe(path.join("blog", `${sanitizedSlug}.json`));
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

export function writeBlogPost(slug: string, data: object): void {
  const sanitizedSlug = slug.replace(/[^a-zA-Z0-9_-]/g, "");
  const filePath = resolveSafe(path.join("blog", `${sanitizedSlug}.json`));
  atomicWrite(filePath, JSON.stringify(data, null, 2));
  triggerRevalidation();
}

export function deleteBlogPost(slug: string): void {
  const sanitizedSlug = slug.replace(/[^a-zA-Z0-9_-]/g, "");
  const filePath = resolveSafe(path.join("blog", `${sanitizedSlug}.json`));
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  const backup = `${filePath}.bak`;
  if (fs.existsSync(backup)) fs.unlinkSync(backup);
  triggerRevalidation();
}

export function listBlogPosts() {
  const blogDir = resolveSafe("blog");
  if (!fs.existsSync(blogDir)) return [];
  const files = fs.readdirSync(blogDir).filter((f) => f.endsWith(".json") && !f.endsWith(".bak"));
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(blogDir, file), "utf-8");
    return JSON.parse(raw);
  });
}
