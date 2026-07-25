import { Extension } from '@tiptap/core';
import type { EditorState } from '@tiptap/pm/state';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

type DeleteSide = 'backspace' | 'delete';
type StrongDirection = 'rtl' | 'ltr';

interface PreviewRange {
  from: number;
  to: number;
}

const previewPluginKey = new PluginKey<boolean>('smartDeletePreview');

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

function segmentsFor(text: string, wordMode: boolean): Array<{ index: number; length: number; isWordLike: boolean }> {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const granularity = wordMode ? 'word' : 'grapheme';
    const segmenter = new Intl.Segmenter(undefined, { granularity });
    return Array.from(segmenter.segment(text)).map((segment) => ({
      index: segment.index,
      length: segment.segment.length,
      isWordLike: segment.isWordLike ?? true,
    }));
  }

  return Array.from(text).map((segment, index) => ({ index, length: segment.length, isWordLike: /\S/u.test(segment) }));
}

function targetSegment(
  segments: Array<{ index: number; length: number; isWordLike: boolean }>,
  offset: number,
  side: DeleteSide,
  wordMode: boolean,
) {
  const candidates = side === 'backspace'
    ? segments.filter((segment) => segment.index + segment.length <= offset).reverse()
    : segments.filter((segment) => segment.index >= offset);

  return wordMode ? candidates.find((segment) => segment.isWordLike) : candidates[0];
}

function previewRange(state: EditorState, side: DeleteSide, wordMode: boolean): PreviewRange | null {
  const { selection } = state;
  if (!selection.empty) return null;

  const $position = selection.$from;
  if (!$position.parent.isTextblock) return null;

  const text = $position.parent.textBetween(0, $position.parent.content.size, '\uFFFC', '\n');
  const offset = $position.parentOffset;
  const beforeDirection = nearestStrongDirection(text, offset, -1);
  const afterDirection = nearestStrongDirection(text, offset, 1);

  // Hints are intentionally limited to a true bidi boundary so ordinary typing
  // is not cluttered by decorations.
  if (!beforeDirection || !afterDirection || beforeDirection === afterDirection) return null;

  const segment = targetSegment(segmentsFor(text, wordMode), offset, side, wordMode);
  if (!segment) return null;

  const parentStart = $position.start();
  return {
    from: parentStart + segment.index,
    to: parentStart + segment.index + segment.length,
  };
}

/**
 * Shows the grapheme (or word while Ctrl/Command is held) that Backspace and
 * Delete will target at a mixed RTL/LTR cursor boundary.
 */
export const SmartDeletePreview = Extension.create({
  name: 'smartDeletePreview',

  addProseMirrorPlugins() {
    return [
      new Plugin<boolean>({
        key: previewPluginKey,
        state: {
          init: () => false,
          apply(transaction, currentValue) {
            const nextValue = transaction.getMeta(previewPluginKey);
            return typeof nextValue === 'boolean' ? nextValue : currentValue;
          },
        },
        props: {
          decorations(state) {
            const wordMode = previewPluginKey.getState(state) ?? false;
            const backspace = previewRange(state, 'backspace', wordMode);
            const forwardDelete = previewRange(state, 'delete', wordMode);
            const decorations: Decoration[] = [];

            if (backspace) {
              decorations.push(
                Decoration.inline(backspace.from, backspace.to, {
                  class: 'smart-delete-preview smart-delete-preview-backspace',
                  title: wordMode ? 'Ctrl+Backspace will delete this word' : 'Backspace will delete this character',
                  'aria-label': wordMode ? 'Ctrl+Backspace deletion target' : 'Backspace deletion target',
                }),
              );
            }
            if (forwardDelete) {
              decorations.push(
                Decoration.inline(forwardDelete.from, forwardDelete.to, {
                  class: 'smart-delete-preview smart-delete-preview-forward',
                  title: wordMode ? 'Ctrl+Delete will delete this word' : 'Delete will delete this character',
                  'aria-label': wordMode ? 'Ctrl+Delete deletion target' : 'Delete deletion target',
                }),
              );
            }

            return DecorationSet.create(state.doc, decorations);
          },
          handleKeyDown(view, event) {
            const shouldShowWordTargets = event.ctrlKey || event.metaKey;
            if ((previewPluginKey.getState(view.state) ?? false) !== shouldShowWordTargets) {
              view.dispatch(view.state.tr.setMeta(previewPluginKey, shouldShowWordTargets));
            }
            return false;
          },
          handleDOMEvents: {
            keyup(view) {
              if (previewPluginKey.getState(view.state)) {
                view.dispatch(view.state.tr.setMeta(previewPluginKey, false));
              }
              return false;
            },
            blur(view) {
              if (previewPluginKey.getState(view.state)) {
                view.dispatch(view.state.tr.setMeta(previewPluginKey, false));
              }
              return false;
            },
          },
        },
      }),
    ];
  },
});
