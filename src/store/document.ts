import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { DocumentModel, DocumentMode, Block, GATESubject } from '../types';

interface DocumentState {
  document: DocumentModel;
  // Actions
  setDocument: (doc: DocumentModel) => void;
  setTitle: (title: string) => void;
  setMode: (mode: DocumentMode) => void;
  setSubject: (subject: string) => void;
  setRawText: (text: string) => void;
  setBlocks: (blocks: Block[]) => void;
  addBlock: (block: Block, index?: number) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  removeBlock: (id: string) => void;
  moveBlock: (id: string, direction: 'up' | 'down') => void;
  newDocument: () => void;
  loadDocument: (doc: DocumentModel) => void;
}

const createEmptyDocument = (): DocumentModel => ({
  id: uuidv4(),
  title: 'GATE DA — Untitled Notes',
  mode: 'study_notes',
  subject: 'Other',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  rawText: '',
  blocks: [],
});

export const useDocumentStore = create<DocumentState>((set) => ({
  document: createEmptyDocument(),

  setDocument: (doc) => set({ document: { ...doc, updatedAt: Date.now() } }),

  setTitle: (title) =>
    set((state) => ({
      document: { ...state.document, title, updatedAt: Date.now() },
    })),

  setMode: (mode) =>
    set((state) => ({
      document: { ...state.document, mode, updatedAt: Date.now() },
    })),

  setSubject: (subject) =>
    set((state) => ({
      document: { ...state.document, subject, updatedAt: Date.now() },
    })),

  setRawText: (rawText) =>
    set((state) => ({
      document: { ...state.document, rawText, updatedAt: Date.now() },
    })),

  setBlocks: (blocks) =>
    set((state) => ({
      document: { ...state.document, blocks, updatedAt: Date.now() },
    })),

  addBlock: (block, index) =>
    set((state) => {
      const blocks = [...state.document.blocks];
      if (index !== undefined) {
        blocks.splice(index, 0, block);
      } else {
        blocks.push(block);
      }
      return { document: { ...state.document, blocks, updatedAt: Date.now() } };
    }),

  updateBlock: (id, updates) =>
    set((state) => ({
      document: {
        ...state.document,
        blocks: state.document.blocks.map((b) =>
          b.id === id ? { ...b, ...updates } : b
        ),
        updatedAt: Date.now(),
      },
    })),

  removeBlock: (id) =>
    set((state) => ({
      document: {
        ...state.document,
        blocks: state.document.blocks.filter((b) => b.id !== id),
        updatedAt: Date.now(),
      },
    })),

  moveBlock: (id, direction) =>
    set((state) => {
      const blocks = [...state.document.blocks];
      const idx = blocks.findIndex((b) => b.id === id);
      if (idx < 0) return state;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= blocks.length) return state;
      [blocks[idx], blocks[newIdx]] = [blocks[newIdx], blocks[idx]];
      return { document: { ...state.document, blocks, updatedAt: Date.now() } };
    }),

  newDocument: () => set({ document: createEmptyDocument() }),

  loadDocument: (doc) => set({ document: doc }),
}));
