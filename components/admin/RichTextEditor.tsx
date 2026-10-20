"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Undo,
  Redo,
} from "lucide-react";
import { useEffect } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          HTMLAttributes: { class: "blog-link" },
        },
      }),
    ],
    content: value || "<p></p>",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync content if changed externally and editor is initialized
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "<p></p>");
    }
  }, [value, editor]);

  if (!editor) {
    return <div style={{ minHeight: 200, padding: 16, background: "var(--admin-bg)", borderRadius: 6 }}>Loading editor...</div>;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div
      style={{
        border: "1px solid var(--admin-border)",
        borderRadius: "var(--admin-radius-sm)",
        background: "var(--admin-bg)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          padding: 8,
          borderBottom: "1px solid var(--admin-border)",
          background: "var(--admin-surface)",
        }}
      >
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`admin-btn admin-btn-ghost admin-btn-icon ${editor.isActive("bold") ? "active" : ""}`}
          style={{ width: 28, height: 28, padding: 0 }}
          title="Bold"
        >
          <Bold size={13} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`admin-btn admin-btn-ghost admin-btn-icon ${editor.isActive("italic") ? "active" : ""}`}
          style={{ width: 28, height: 28, padding: 0 }}
          title="Italic"
        >
          <Italic size={13} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`admin-btn admin-btn-ghost admin-btn-icon ${editor.isActive("underline") ? "active" : ""}`}
          style={{ width: 28, height: 28, padding: 0 }}
          title="Underline"
        >
          <UnderlineIcon size={13} />
        </button>
        <div style={{ width: 1, height: 20, background: "var(--admin-border)", margin: "4px 4px" }} />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`admin-btn admin-btn-ghost admin-btn-icon ${editor.isActive("heading", { level: 2 }) ? "active" : ""}`}
          style={{ width: 28, height: 28, padding: 0 }}
          title="Heading 2"
        >
          <Heading2 size={13} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`admin-btn admin-btn-ghost admin-btn-icon ${editor.isActive("heading", { level: 3 }) ? "active" : ""}`}
          style={{ width: 28, height: 28, padding: 0 }}
          title="Heading 3"
        >
          <Heading3 size={13} />
        </button>
        <div style={{ width: 1, height: 20, background: "var(--admin-border)", margin: "4px 4px" }} />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`admin-btn admin-btn-ghost admin-btn-icon ${editor.isActive("bulletList") ? "active" : ""}`}
          style={{ width: 28, height: 28, padding: 0 }}
          title="Bullet List"
        >
          <List size={13} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`admin-btn admin-btn-ghost admin-btn-icon ${editor.isActive("orderedList") ? "active" : ""}`}
          style={{ width: 28, height: 28, padding: 0 }}
          title="Numbered List"
        >
          <ListOrdered size={13} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`admin-btn admin-btn-ghost admin-btn-icon ${editor.isActive("blockquote") ? "active" : ""}`}
          style={{ width: 28, height: 28, padding: 0 }}
          title="Blockquote"
        >
          <Quote size={13} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`admin-btn admin-btn-ghost admin-btn-icon ${editor.isActive("codeBlock") ? "active" : ""}`}
          style={{ width: 28, height: 28, padding: 0 }}
          title="Code Block"
        >
          <Code size={13} />
        </button>
        <button
          type="button"
          onClick={setLink}
          className={`admin-btn admin-btn-ghost admin-btn-icon ${editor.isActive("link") ? "active" : ""}`}
          style={{ width: 28, height: 28, padding: 0 }}
          title="Add Link"
        >
          <LinkIcon size={13} />
        </button>
        <div style={{ width: 1, height: 20, background: "var(--admin-border)", margin: "4px 4px" }} />
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="admin-btn admin-btn-ghost admin-btn-icon"
          style={{ width: 28, height: 28, padding: 0 }}
          title="Undo"
        >
          <Undo size={13} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="admin-btn admin-btn-ghost admin-btn-icon"
          style={{ width: 28, height: 28, padding: 0 }}
          title="Redo"
        >
          <Redo size={13} />
        </button>
      </div>

      <div style={{ padding: 16, minHeight: 260, color: "var(--admin-text-primary)", fontSize: 14 }}>
        <style jsx global>{`
          .ProseMirror {
            outline: none;
            min-height: 240px;
          }
          .ProseMirror p {
            margin: 0 0 1em 0;
            line-height: 1.6;
          }
          .ProseMirror h2 {
            font-size: 1.35rem;
            font-weight: 600;
            margin: 1.4em 0 0.5em 0;
            color: #fff;
          }
          .ProseMirror h3 {
            font-size: 1.15rem;
            font-weight: 600;
            margin: 1.2em 0 0.5em 0;
            color: #eee;
          }
          .ProseMirror ul,
          .ProseMirror ol {
            padding-left: 1.5rem;
            margin: 0.8em 0;
          }
          .ProseMirror blockquote {
            border-left: 3px solid var(--admin-accent);
            padding-left: 1rem;
            margin: 1em 0;
            color: var(--admin-text-secondary);
            font-style: italic;
          }
          .ProseMirror pre {
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid var(--admin-border);
            padding: 0.8rem 1rem;
            border-radius: 6px;
            font-family: monospace;
            font-size: 13px;
            overflow-x: auto;
          }
          .ProseMirror a {
            color: var(--admin-accent);
            text-decoration: underline;
          }
        `}</style>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
