import { get, set, del, keys } from 'idb-keyval';
import type { DocumentModel, SavedDocument } from '../types';

const DOC_PREFIX = 'gate_notes_doc_';
const RECENT_KEY = 'gate_notes_recent';
const SETTINGS_KEY = 'gate_notes_settings';
const AUTOSAVE_KEY = 'gate_notes_autosave';

export async function saveDocument(doc: DocumentModel): Promise<void> {
  const saved: SavedDocument = {
    id: doc.id,
    title: doc.title,
    mode: doc.mode,
    subject: doc.subject,
    updatedAt: Date.now(),
    data: doc,
  };
  await set(DOC_PREFIX + doc.id, saved);
  await addToRecent(doc.id, doc.title);
}

export async function loadDocument(id: string): Promise<DocumentModel | null> {
  const saved = await get<SavedDocument>(DOC_PREFIX + id);
  return saved?.data || null;
}

export async function deleteDocument(id: string): Promise<void> {
  await del(DOC_PREFIX + id);
  const recent = await getRecentDocuments();
  await set(
    RECENT_KEY,
    recent.filter((r) => r.id !== id)
  );
}

export async function listDocuments(): Promise<SavedDocument[]> {
  const allKeys = await keys();
  const docKeys = allKeys.filter((k) => String(k).startsWith(DOC_PREFIX));
  const docs: SavedDocument[] = [];
  for (const key of docKeys) {
    const saved = await get<SavedDocument>(key);
    if (saved) docs.push({ ...saved, data: undefined as any }); // exclude data for listing
  }
  return docs.sort((a, b) => b.updatedAt - a.updatedAt);
}

interface RecentEntry {
  id: string;
  title: string;
  accessedAt: number;
}

async function addToRecent(id: string, title: string): Promise<void> {
  let recent = await getRecentDocuments();
  recent = recent.filter((r) => r.id !== id);
  recent.unshift({ id, title, accessedAt: Date.now() });
  if (recent.length > 20) recent = recent.slice(0, 20);
  await set(RECENT_KEY, recent);
}

export async function getRecentDocuments(): Promise<RecentEntry[]> {
  return (await get<RecentEntry[]>(RECENT_KEY)) || [];
}

export async function autoSave(doc: DocumentModel): Promise<void> {
  await set(AUTOSAVE_KEY, doc);
}

export async function loadAutoSave(): Promise<DocumentModel | null> {
  return (await get<DocumentModel>(AUTOSAVE_KEY)) || null;
}

export async function saveSettings(settings: any): Promise<void> {
  await set(SETTINGS_KEY, settings);
}

export async function loadSettings(): Promise<any> {
  return await get(SETTINGS_KEY);
}

export function exportDocumentJSON(doc: DocumentModel): string {
  return JSON.stringify(doc, null, 2);
}

export function importDocumentJSON(json: string): DocumentModel {
  const parsed = JSON.parse(json);
  if (!parsed.id || !parsed.blocks) {
    throw new Error('Invalid document format');
  }
  return parsed as DocumentModel;
}
