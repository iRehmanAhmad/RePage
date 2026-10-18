/**
 * Gallery wiring test: selecting a template goes through the
 * `file.newFromTemplate` command. The command layer is mocked here —
 * the contract under test is that the template id flows through the
 * command and yields a valid built document.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { commandRegistry } from '../editor/commands/commandRegistry';
import { documentSchema } from '../domain/document/schema';
import { TEMPLATE_REGISTRY, getTemplate } from './index';

describe('file.newFromTemplate command wiring', () => {
  const original = commandRegistry.get('file.newFromTemplate')?.execute;

  afterEach(() => {
    if (original) commandRegistry.setHandler('file.newFromTemplate', original);
  });

  it('dispatches the selected template id to the handler, which builds a valid document', () => {
    let receivedId: string | undefined;
    commandRegistry.setHandler('file.newFromTemplate', (id: string) => {
      receivedId = id;
    });

    const ok = commandRegistry.execute('file.newFromTemplate', 'exam-paper');
    expect(ok).toBe(true);
    expect(receivedId).toBe('exam-paper');

    // The App-level handler resolves the id through the registry and builds.
    const built = getTemplate(receivedId!)?.build();
    expect(built).toBeDefined();
    expect(documentSchema.safeParse(built).success).toBe(true);
  });

  it('every registered template id resolves through the command path', () => {
    const seen: string[] = [];
    commandRegistry.setHandler('file.newFromTemplate', (id: string) => {
      seen.push(id);
    });
    for (const t of TEMPLATE_REGISTRY) {
      expect(commandRegistry.execute('file.newFromTemplate', t.id)).toBe(true);
    }
    expect(seen).toEqual(TEMPLATE_REGISTRY.map((t) => t.id));
  });
});
