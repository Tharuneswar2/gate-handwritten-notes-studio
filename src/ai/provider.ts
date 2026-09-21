import type { AIProvider, AIAction } from '../types';

/**
 * AI Writer abstraction layer.
 * Providers can be plugged in later (OpenAI, Gemini, local).
 * The app works fully without any AI provider configured.
 */

class StubProvider implements AIProvider {
  name = 'None (AI not configured)';

  isAvailable(): boolean {
    return false;
  }

  async execute(_action: AIAction, _input: string): Promise<string> {
    throw new Error('No AI provider configured. The AI Writer feature requires an API key to be set up.');
  }
}

// Provider registry
const providers: Map<string, AIProvider> = new Map();
let activeProvider: AIProvider = new StubProvider();

export function registerProvider(provider: AIProvider): void {
  providers.set(provider.name, provider);
}

export function setActiveProvider(name: string): void {
  const p = providers.get(name);
  if (p) activeProvider = p;
}

export function getActiveProvider(): AIProvider {
  return activeProvider;
}

export function isAIAvailable(): boolean {
  return activeProvider.isAvailable();
}

export async function executeAIAction(action: AIAction, input: string): Promise<string> {
  return activeProvider.execute(action, input);
}

export function getAvailableActions(): { action: AIAction; label: string; icon: string }[] {
  return [
    { action: 'summarize', label: 'Summarize', icon: '📝' },
    { action: 'simplify', label: 'Simplify', icon: '✨' },
    { action: 'convert_to_gate_notes', label: 'Convert to GATE Notes', icon: '📋' },
    { action: 'generate_formula_sheet', label: 'Generate Formula Sheet', icon: '🔢' },
    { action: 'convert_to_bullets', label: 'Convert to Bullets', icon: '•' },
    { action: 'explain_teluglish', label: 'Explain in Teluglish', icon: '🗣️' },
    { action: 'extract_formulas', label: 'Extract Formulas', icon: 'ƒ' },
    { action: 'find_important', label: 'Find Important Points', icon: '⭐' },
    { action: 'generate_revision', label: 'Generate Quick Revision', icon: '🔄' },
  ];
}
