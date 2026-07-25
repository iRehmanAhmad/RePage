import { describe, expect, it } from 'vitest';
import { parseDocument } from '../document/schema';
import {
  createDocumentFromTemplate,
  createNewspaperTemplate,
  createPoetryBookTemplate,
  DOCUMENT_TEMPLATES,
} from './documentTemplates';

describe('Urdu Document Templates', () => {
  it('creates valid newspaper template document passing Zod schema validation', () => {
    const doc = createNewspaperTemplate('روزنامہ پاکستان');
    const validated = parseDocument(doc);
    expect(validated.metadata.title).toBe('روزنامہ پاکستان');
    expect(Object.keys(validated.objects)).toHaveLength(2);
  });

  it('creates valid poetry book template document', () => {
    const doc = createPoetryBookTemplate('دیوان غالب');
    const validated = parseDocument(doc);
    expect(validated.metadata.title).toBe('دیوان غالب');
    expect(Object.keys(validated.stories)).toHaveLength(1);
  });

  it('instantiates document via template registry lookup', () => {
    const doc = createDocumentFromTemplate('newspaper', 'خبریں');
    expect(doc.metadata.title).toBe('خبریں');
  });

  it('lists registered templates', () => {
    const keys = Object.keys(DOCUMENT_TEMPLATES);
    expect(keys).toContain('newspaper');
    expect(keys).toContain('poetry');
  });
});
