import { notFound } from 'next/navigation';
import { EditorShell } from '@/components/editor/editor-shell';
import { GALLERY, getTemplate } from '@/templates/registry';

export const dynamicParams = false;

export function generateStaticParams() {
  return GALLERY.map((entry) => ({ templateId: entry.key }));
}

export default async function EditorPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  const [id, variantId] = templateId.split('--');
  if (!getTemplate(id)) notFound();
  return <EditorShell templateId={id} variantId={variantId ?? null} />;
}
