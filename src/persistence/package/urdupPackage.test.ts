import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../../domain/document/createDocument';
import { createUrdupPackage, readUrdupPackage } from './urdupPackage';

describe('.urdup package', () => {
  it('round-trips a canonical document without changing Urdu content', async () => {
    const document = createStarterDocument();
    const bytes = await createUrdupPackage(document);
    const reopened = await readUrdupPackage(bytes);

    expect(reopened).toEqual(document);
  });

  it('rejects data that is not a ZIP package', async () => {
    await expect(readUrdupPackage(new TextEncoder().encode('{}'))).rejects.toThrow();
  });
});
