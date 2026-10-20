import { Suspense } from "react";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { CONTENT_FILES } from "@/lib/content-files";

export function generateStaticParams() {
  return CONTENT_FILES.map((f) => ({ file: f.key }));
}

async function Editor({ params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  return <ContentEditor file={file} />;
}

export default function AdminContentPage({ params }: { params: Promise<{ file: string }> }) {
  return (
    <Suspense fallback={null}>
      <Editor params={params} />
    </Suspense>
  );
}
