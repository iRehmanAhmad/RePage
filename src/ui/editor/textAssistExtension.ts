import { Extension, Mark } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { EditorState, Transaction } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import { closeHistory } from '@tiptap/pm/history';
import {
  getAutoCorrection,
  isWordDelimiter,
} from '../../domain/language/autoCorrect';
import { getCompletions } from '../../domain/language/wordCompletion';
import {
  getDocumentVocabulary,
  isAutoCorrectEnabled,
  isWordCompletionEnabled,
} from '../../domain/language/textAssistSettings';
import { getDocumentIgnoredWords } from '../../domain/language/spellcheckSettings';

/**
 * TextAssist (Phase 4 batch 12): three cooperating pieces in the story
 * editors —
 *
 *  1. CharacterStyleMark: the Tiptap side of canonical
 *     TextRun.characterStyleId. Parses/renders `span[data-character-style]`
 *     and carries ONLY the style id; the style's properties are rendered
 *     from the document registry via injected CSS (characterStylesCss),
 *     never baked into the document as direct marks.
 *
 *  2. Auto-correct: when a delimiter (space / punctuation) is TYPED after
 *     a word, a curated known typo (domain/language/autoCorrect) is
 *     replaced in the SAME transaction as the delimiter lands, flagged
 *     closeHistory — so exactly one Ctrl+Z reverts the correction and
 *     restores the typo. Typing paths only: handleTextInput is a native
 *     typing hook (paste/drop never reach it), plus explicit calls from
 *     the editors' own mapped-key / virtual-keyboard paths. Words on the
 *     personal dictionary, the session ignore or the document ignore
 *     list are never touched (the engine's isSpellingCorrect guard),
 *     and a word straddling a formatting boundary is left alone.
 *
 *  3. Word completion: a popup listing candidates for the word being
 *     typed (document vocabulary first, then the dictionary frequency
 *     head). Tab/Enter accepts (inserting only the missing suffix),
 *     Esc dismisses (and stays dismissed for that word), arrows navigate,
 *     mouse click accepts. All state lives in a ProseMirror plugin; the
 *     popup is a plain fixed-position div in the editor's parent.
 */

export const CharacterStyleMark = Mark.create({
  name: 'characterStyle',
  addAttributes() {
    return {
      styleId: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-character-style'),
        renderHTML: (attributes: { styleId?: string | null }) =>
          attributes.styleId ? { 'data-character-style': attributes.styleId } : {},
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-character-style]' }];
  },
  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
    return ['span', HTMLAttributes, 0];
  },
});

// ---------------------------------------------------------------------------
// Word scanning helpers
// ---------------------------------------------------------------------------

const WORD_CHAR_RE = /[A-Za-z\u0621-\u063A\u0641-\u064A\u0671-\u06D3\u06FA-\u06FC\u200C'’]/;

function isWordChar(ch: string | undefined): boolean {
  return ch !== undefined && ch.length === 1 && WORD_CHAR_RE.test(ch);
}

interface WordAtCaret {
  word: string;
  /** Absolute doc position of the word start. */
  from: number;
  /** Absolute doc position of the word end (== caret when at word end). */
  to: number;
  /** True when the character before the word is a digit (numeric string). */
  precededByDigit: boolean;
  /** True when a word character follows the caret (caret is mid-word). */
  followedByWordChar: boolean;
}

/** The maximal word ending exactly at the caret, or null. */
function wordBeforeCaret(state: EditorState): WordAtCaret | null {
  const { selection } = state;
  if (!selection.empty) return null;
  const { $from } = selection;
  if (!$from.parent.isTextblock) return null;
  const parentText = $from.parent.textBetween(0, $from.parent.content.size, undefined, '￼');
  const caret = $from.parentOffset;
  let start = caret;
  while (start > 0 && isWordChar(parentText[start - 1])) start -= 1;
  // Edge apostrophes are quotes, not part of the word (checker convention).
  while (start < caret && (parentText[start] === "'" || parentText[start] === '’')) start += 1;
  let end = caret;
  while (end > start && (parentText[end - 1] === "'" || parentText[end - 1] === '’')) end -= 1;
  if (end <= start) return null;
  const from = $from.start() + start;
  return {
    word: parentText.slice(start, end),
    from,
    to: $from.start() + end,
    precededByDigit: start > 0 && /\d/.test(parentText[start - 1]!),
    followedByWordChar: isWordChar(parentText[caret]),
  };
}

/** True when every text node in [from, to) shares identical marks. */
function hasUniformFormatting(state: EditorState, from: number, to: number): boolean {
  let signature: string | null = null;
  let uniform = true;
  state.doc.nodesBetween(from, to, (node) => {
    if (!uniform) return false;
    if (node.isText) {
      const sig = JSON.stringify(node.marks.map((m) => [m.type.name, m.attrs]));
      if (signature === null) signature = sig;
      else if (signature !== sig) uniform = false;
    }
    return uniform;
  });
  return uniform;
}

// ---------------------------------------------------------------------------
// Auto-correct
// ---------------------------------------------------------------------------

/**
 * If the word before the caret is a curated typo, replace it and insert
 * `delimiter` in ONE history-closing transaction. Returns true when a
 * correction was dispatched (callers that route delimiter keys manually
 * must then NOT insert the delimiter themselves).
 */
export function tryAutoCorrectAtDelimiter(view: EditorView, delimiter: string): boolean {
  if (!isAutoCorrectEnabled() || view.composing) return false;
  const { state } = view;
  const found = wordBeforeCaret(state);
  if (!found || found.to !== state.selection.from) return false;
  if (found.precededByDigit) return false;
  const correction = getAutoCorrection(found.word, {
    documentIgnoredWords: getDocumentIgnoredWords(),
  });
  if (!correction || correction === found.word) return false;
  if (!hasUniformFormatting(state, found.from, found.to)) return false;

  // The corrected word keeps the original word's marks (uniformity was
  // verified above, so the mark set at the word's start is THE mark set).
  const marks = state.doc.resolve(found.from).nodeAfter?.marks ?? [];
  let tr: Transaction = state.tr.replaceWith(
    found.from,
    found.to,
    state.schema.text(correction, marks),
  );
  tr = tr.insertText(delimiter);
  tr = closeHistory(tr);
  view.dispatch(tr.scrollIntoView());
  return true;
}

// ---------------------------------------------------------------------------
// Word completion
// ---------------------------------------------------------------------------

export interface CompletionState {
  from: number;
  prefix: string;
  items: string[];
  index: number;
}

interface TextAssistPluginState {
  completion: CompletionState | null;
  /** "from:prefix" the user dismissed with Esc — not shown again. */
  dismissedFor: string | null;
}

const textAssistKey = new PluginKey<TextAssistPluginState>('repageTextAssist');

function computeCompletion(
  state: EditorState,
  dismissedFor: string | null,
): CompletionState | null {
  if (!isWordCompletionEnabled()) return null;
  const found = wordBeforeCaret(state);
  if (!found) return null;
  if (found.to !== state.selection.from) return null;
  if (found.followedByWordChar || found.precededByDigit) return null;
  if (found.word.length < 3) return null;
  if (dismissedFor === `${found.from}:${found.word}`) return null;
  const items = getCompletions(found.word, getDocumentVocabulary());
  if (items.length === 0) return null;
  return { from: found.from, prefix: found.word, items, index: 0 };
}

export function getCompletionState(view: EditorView): CompletionState | null {
  return textAssistKey.getState(view.state)?.completion ?? null;
}

export function acceptCompletion(view: EditorView, index?: number): boolean {
  const pluginState = textAssistKey.getState(view.state);
  const completion = pluginState?.completion;
  if (!completion) return false;
  const item = completion.items[index ?? completion.index];
  if (!item) return false;
  const suffix = item.slice(completion.prefix.length);
  let tr = view.state.tr.insertText(suffix);
  tr = tr.setMeta(textAssistKey, { type: 'clear' });
  view.dispatch(tr);
  return true;
}

export function dismissCompletion(view: EditorView): void {
  const completion = getCompletionState(view);
  if (!completion) return;
  view.dispatch(
    view.state.tr.setMeta(textAssistKey, {
      type: 'dismiss',
      dismissedFor: `${completion.from}:${completion.prefix}`,
    }),
  );
}

function moveCompletionSelection(view: EditorView, delta: number): void {
  const completion = getCompletionState(view);
  if (!completion) return;
  const index = (completion.index + delta + completion.items.length) % completion.items.length;
  view.dispatch(view.state.tr.setMeta(textAssistKey, { type: 'setIndex', index }));
}

/**
 * Key handling for an open completion popup. Exported so editors whose
 * editorProps.handleKeyDown runs BEFORE plugin props (the paged body
 * editor intercepts Tab/Enter itself) can give the popup first claim on
 * Tab / Enter / Esc / arrows. Returns true when the key was consumed.
 */
export function handleCompletionKeyDown(view: EditorView, event: KeyboardEvent): boolean {
  const completion = getCompletionState(view);
  if (!completion || view.composing) return false;
  switch (event.key) {
    case 'Tab':
    case 'Enter':
      return acceptCompletion(view);
    case 'Escape':
      dismissCompletion(view);
      return true;
    case 'ArrowDown':
      moveCompletionSelection(view, 1);
      return true;
    case 'ArrowUp':
      moveCompletionSelection(view, -1);
      return true;
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// Popup view
// ---------------------------------------------------------------------------

class CompletionPopupView {
  private readonly dom: HTMLDivElement;
  private readonly parent: HTMLElement;

  constructor(private readonly view: EditorView) {
    this.parent = view.dom.parentElement ?? document.body;
    this.dom = document.createElement('div');
    this.dom.className = 'repage-completion-popup';
    // position:fixed + coordsAtPos (viewport coordinates) — immune to
    // whichever ancestor happens to be the offset parent in the paged /
    // overlay / draft editor surfaces.
    this.dom.style.cssText =
      'position:fixed;display:none;z-index:99990;min-width:140px;max-height:196px;overflow-y:auto;' +
      'background:#ffffff;border:1px solid #cbd5e1;border-radius:8px;box-shadow:0 8px 24px rgba(15,23,42,0.18);' +
      'padding:4px;font-family:inherit;';
    this.dom.addEventListener('mousedown', (event) => {
      // Keep editor focus/selection; accept on click.
      event.preventDefault();
      const target = (event.target as HTMLElement).closest('[data-completion-index]');
      if (target) {
        const index = Number(target.getAttribute('data-completion-index'));
        if (Number.isFinite(index)) acceptCompletion(this.view, index);
      }
    });
    this.parent.appendChild(this.dom);
    this.update(view);
  }

  update(view: EditorView): void {
    const completion = view.composing ? null : getCompletionState(view);
    if (!completion) {
      this.dom.style.display = 'none';
      return;
    }
    this.dom.replaceChildren();
    completion.items.forEach((item, i) => {
      const row = document.createElement('div');
      row.setAttribute('data-completion-index', String(i));
      row.style.cssText =
        'padding:4px 8px;border-radius:5px;cursor:pointer;font-size:13px;white-space:nowrap;' +
        (i === completion.index ? 'background:#0f766e;color:#ffffff;' : 'color:#0f172a;');
      const typed = document.createElement('span');
      typed.style.opacity = '0.65';
      typed.textContent = item.slice(0, completion.prefix.length);
      const rest = document.createElement('span');
      rest.textContent = item.slice(completion.prefix.length);
      row.append(typed, rest);
      this.dom.appendChild(row);
    });
    let coords: { left: number; bottom: number };
    try {
      coords = view.coordsAtPos(completion.from);
    } catch {
      // No layout (headless DOM, hidden editor): cosmetics must never
      // break editing — leave the popup unpositioned/hidden this frame.
      this.dom.style.display = 'none';
      return;
    }
    this.dom.style.display = 'block';
    this.dom.style.left = `${coords.left}px`;
    this.dom.style.top = `${coords.bottom + 2}px`;
  }

  destroy(): void {
    this.dom.remove();
  }
}

// ---------------------------------------------------------------------------
// Extension
// ---------------------------------------------------------------------------

export const TextAssist = Extension.create({
  name: 'textAssist',
  addProseMirrorPlugins() {
    return [
      new Plugin<TextAssistPluginState>({
        key: textAssistKey,
        state: {
          init: (): TextAssistPluginState => ({ completion: null, dismissedFor: null }),
          apply(tr, prev, _oldState, newState): TextAssistPluginState {
            const meta = tr.getMeta(textAssistKey) as
              | { type: 'dismiss'; dismissedFor: string }
              | { type: 'clear' }
              | { type: 'setIndex'; index: number }
              | undefined;
            if (meta?.type === 'dismiss') {
              return { completion: null, dismissedFor: meta.dismissedFor };
            }
            if (meta?.type === 'clear') {
              return { completion: null, dismissedFor: prev.dismissedFor };
            }
            if (meta?.type === 'setIndex') {
              return {
                ...prev,
                completion: prev.completion
                  ? { ...prev.completion, index: meta.index }
                  : null,
              };
            }
            if (!tr.docChanged && !tr.selectionSet) return prev;
            return {
              completion: computeCompletion(newState, prev.dismissedFor),
              dismissedFor: prev.dismissedFor,
            };
          },
        },
        view: (view) => new CompletionPopupView(view),
        props: {
          handleTextInput(view, from, to, text) {
            if (text.length === 1 && isWordDelimiter(text) && from === to) {
              return tryAutoCorrectAtDelimiter(view, text);
            }
            return false;
          },
          handleKeyDown(view, event) {
            return handleCompletionKeyDown(view, event);
          },
        },
      }),
    ];
  },
});
