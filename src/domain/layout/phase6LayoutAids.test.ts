import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../document/createDocument';
import { toggleSnapToGuidesCommand, updateGuidesCommand } from '../../editor/commands/pageLayoutCommands';
import type { PageGuide } from '../document/types';
import { createUrdupPackage, readUrdupPackage } from '../../persistence/package/urdupPackage';

describe('Phase 6 Layout Aids Engine', () => {
  it('toggles snap-to-guides setting', () => {
    const doc = createStarterDocument();
    expect(doc.settings.snapToGuides).toBeFalsy();

    const docSnapOn = toggleSnapToGuidesCommand(doc, true);
    expect(docSnapOn.settings.snapToGuides).toBe(true);

    const docSnapToggled = toggleSnapToGuidesCommand(docSnapOn);
    expect(docSnapToggled.settings.snapToGuides).toBe(false);
  });

  it('updates and persists page guidelines', () => {
    const doc = createStarterDocument();
    const p1 = doc.pageOrder[0]!;

    const guides: PageGuide[] = [
      { id: 'g1', orientation: 'vertical', position: 100 },
      { id: 'g2', orientation: 'horizontal', position: 200 },
    ];

    const docWithGuides = updateGuidesCommand(doc, p1, guides);
    expect(docWithGuides.pages[p1]?.guides).toEqual(guides);
  });

  it('preserves page.guides and snapToGuides in .urdup package roundtrip', async () => {
    const doc = createStarterDocument();
    const p1 = doc.pageOrder[0]!;

    const guides: PageGuide[] = [
      { id: 'g1', orientation: 'vertical', position: 150 },
    ];

    const docPrepared = toggleSnapToGuidesCommand(
      updateGuidesCommand(doc, p1, guides),
      true,
    );

    const pkgBlob = await createUrdupPackage(docPrepared);
    const reloadedDoc = await readUrdupPackage(pkgBlob);

    expect(reloadedDoc.settings.snapToGuides).toBe(true);
    expect(reloadedDoc.pages[p1]?.guides).toEqual(guides);
  });
});
