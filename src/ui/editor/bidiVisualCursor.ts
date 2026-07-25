import { Extension } from '@tiptap/core';
import type { EditorState } from '@tiptap/pm/state';
import { Plugin, TextSelection } from '@tiptap/pm/state';

type StrongDirection = 'rtl' | 'ltr';

interface Segment {
  index: number;
  length: number;
}

function strongDirectionOf(character: string): StrongDirection | null {
  if (/[\u0590-\u08ff\ufb1d-\ufdff\ufe70-\ufeff]/u.test(character)) return 'rtl';
  if (/[A-Za-z\u00c0-\u024f0-9]/u.test(character)) return 'ltr';
  return null;
}

function nearestStrongDirection(text: string, offset: number, step: -1 | 1): StrongDirection | null {
  for (let index = step < 0 ? offset - 1 : offset; index >= 0 && index < text.length; index += step) {
    const direction = strongDirectionOf(text[index]!);
    if (direction) return direction;
  }
  return null;
}

function graphemeSegments(text: string): Segment[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    return Array.from(segmenter.segment(text)).map((segment) => ({
      index: segment.index,
      length: segment.segment.length,
    }));
  }

  let offset = 0;
  return Array.from(text).map((segment) => {
    const result = { index: offset, length: segment.length };
    offset += segment.length;
    return result;
  });
}

/**
 * Returns the next logical document position required to move the caret in the
 * requested visual direction inside a single-direction text run. Returning
 * null deliberately delegates a mixed-run boundary to the browser's bidi
 * engine, which has the required visual affinity information.
 */
export function visualCursorTarget(state: EditorState, key: 'ArrowLeft' | 'ArrowRight'): number | null {
  const { selection } = state;
  if (!(selection instanceof TextSelection) || !selection.empty) return null;

  const $position = selection.$from;
  if (!$position.parent.isTextblock) return null;

  const text = $position.parent.textBetween(0, $position.parent.content.size, '\uFFFC', '\n');
  const offset = $position.parentOffset;
  const beforeDirection = nearestStrongDirection(text, offset, -1);
  const afterDirection = nearestStrongDirection(text, offset, 1);

  // A real bidi boundary has two valid visual caret affinities. Let the browser
  // choose there; force visual movement only while safely inside one text run.
  if (!beforeDirection || !afterDirection || beforeDirection !== afterDirection) return null;

  const segments = graphemeSegments(text);
  const previous = segments.filter((segment) => segment.index + segment.length <= offset).at(-1);
  const next = segments.find((segment) => segment.index >= offset);
  const isRtlRun = beforeDirection === 'rtl';
  const moveToPreviousLogicalBoundary = (key === 'ArrowLeft') !== isRtlRun;
  const parentStart = $position.start();

  if (moveToPreviousLogicalBoundary && previous) return parentStart + previous.index;
  if (!moveToPreviousLogicalBoundary && next) return parentStart + next.index + next.length;
  return null;
}

/**
 * Makes Left/Right follow the visible direction of the active Urdu or English
 * run, avoiding the paragraph-level RTL setting reversing navigation in a
 * nested English phrase.
 */
export const BidiVisualCursor = Extension.create({
  name: 'bidiVisualCursor',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleKeyDown(view, event) {
            if (
              (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') ||
              event.ctrlKey ||
              event.metaKey ||
              event.altKey
            ) {
              return false;
            }

            const target = visualCursorTarget(view.state, event.key);
            if (target === null) return false;

            const { selection } = view.state;
            const nextSelection = event.shiftKey
              ? TextSelection.create(view.state.doc, selection.anchor, target)
              : TextSelection.create(view.state.doc, target);

            view.dispatch(view.state.tr.setSelection(nextSelection).scrollIntoView());
            event.preventDefault();
            return true;
          },
        },
      }),
    ];
  },
});
