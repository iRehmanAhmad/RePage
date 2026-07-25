import { describe, expect, it } from 'vitest';
import { createStarterDocument } from './createDocument';
import {
  acceptAllRevisions,
  acceptRevision,
  recordRevision,
  rejectRevision,
} from './trackChangesEngine';

describe('trackChangesEngine (Phase UX-7)', () => {
  it('records a new tracked revision', () => {
    const doc = createStarterDocument();
    const updated = recordRevision(doc, {
      type: 'insert',
      author: 'User A',
      text: 'نیا پیراگراف',
      paragraphIndex: 1,
    });

    expect(updated.revisions).toBeDefined();
    expect(updated.revisions?.length).toBe(1);
    expect(updated.revisions?.[0]?.text).toBe('نیا پیراگراف');
  });

  it('accepts and rejects tracked revisions', () => {
    let doc = createStarterDocument();
    doc = recordRevision(doc, {
      type: 'insert',
      author: 'Reviewer',
      text: 'تبصرہ شدہ متن',
      paragraphIndex: 0,
    });

    const revId = doc.revisions![0]!.id;

    // Accept revision
    const accepted = acceptRevision(doc, revId);
    expect(accepted.revisions?.length).toBe(0);

    // Reject revision
    const rejected = rejectRevision(doc, revId);
    expect(rejected.revisions?.length).toBe(0);
  });

  it('accepts all revisions in bulk', () => {
    let doc = createStarterDocument();
    doc = recordRevision(doc, { type: 'insert', author: 'A', text: '1', paragraphIndex: 0 });
    doc = recordRevision(doc, { type: 'insert', author: 'B', text: '2', paragraphIndex: 1 });

    const cleared = acceptAllRevisions(doc);
    expect(cleared.revisions?.length).toBe(0);
  });
});
