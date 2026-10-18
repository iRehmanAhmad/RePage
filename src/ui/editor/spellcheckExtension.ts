import { Extension } from '@tiptap/core';
import type { Editor } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Node as PMNode } from '@tiptap/pm/model';
import {
  findMisspelledRanges,
  getSpellingSuggestions,
} from '../../domain/language/urduSpellchecker';
import { isSpellcheckEnabled } from '../../domain/language/spellcheckSettings';

/** Broadcast when the user toggles spellcheck (detail: { enabled: boolean }). */
export const SPELLCHECK_CHANGED_EVENT = 'repage:spellcheck-changed';
/** Broadcast to force every mounted editor to re-run spellcheck. */
export const SPELLCHECK_RECHECK_EVENT = 'repage:spellcheck-recheck';

export function broadcastSpellcheckChanged(enabled: boolean): void {
  window.dispatchEvent(new CustomEvent(SPELLCHECK_CHANGED_EVENT, { detail: { enabled } }));
}

export function broadcastSpellcheckRecheck(): void {
  window.dispatchEvent(new CustomEvent(SPELLCHECK_RECHECK_EVENT));
}

export interface SpellcheckMenuInfo {
  word: string;
  from: number;
  to: number;
  suggestions: string[];
  x: number;
  y: number;
}

interface SpellcheckStorage {
  onContextMenu: ((info: SpellcheckMenuInfo) => void) | null;
}

interface SpellcheckPluginState {
  enabled: boolean;
  decos: DecorationSet;
}

interface SpellcheckMeta {
  recheck?: boolean;
  setEnabled?: boolean;
}

const spellcheckPluginKey = new PluginKey<SpellcheckPluginState>('repageSpellcheck');

const DECORATION_CLASS = 'repage-spellcheck-error';
const RECHECK_DEBOUNCE_MS = 350;

function computeDecorations(doc: PMNode): DecorationSet {
  const decos: Decoration[] = [];
  doc.descendants((node, pos) => {
    if (!node.isTextblock || !node.textContent) return true;
    for (const r of findMisspelledRanges(node.textContent)) {
      decos.push(
        Decoration.inline(pos + r.start + 1, pos + r.end + 1, { class: DECORATION_CLASS }),
      );
    }
    return true;
  });
  return DecorationSet.create(doc, decos);
}

/** Force an immediate spellcheck pass on one editor (e.g. after Add to dictionary). */
export function recheckSpellcheck(editor: Editor | null | undefined): void {
  if (!editor) return;
  editor.view.dispatch(editor.view.state.tr.setMeta(spellcheckPluginKey, { recheck: true }));
}

/** Register/replace the right-click menu handler for one editor instance. */
export function setSpellcheckMenuHandler(
  editor: Editor | null | undefined,
  handler: ((info: SpellcheckMenuInfo) => void) | null,
): void {
  if (!editor) return;
  const storage = editor.storage as unknown as Record<string, SpellcheckStorage>;
  if (storage.repageSpellcheck) storage.repageSpellcheck.onContextMenu = handler;
}

export const Spellcheck = Extension.create({
  name: 'repageSpellcheck',

  addStorage(): SpellcheckStorage {
    return { onContextMenu: null };
  },

  addProseMirrorPlugins() {
    const storage = this.storage as SpellcheckStorage;
    const plugin: Plugin<SpellcheckPluginState> = new Plugin<SpellcheckPluginState>({
      key: spellcheckPluginKey,
      state: {
        init: (_, state) => {
          const enabled = isSpellcheckEnabled();
          return { enabled, decos: enabled ? computeDecorations(state.doc) : DecorationSet.empty };
        },
        apply: (tr, prev, _oldState, newState) => {
          const meta = tr.getMeta(spellcheckPluginKey) as SpellcheckMeta | undefined;
          let { enabled, decos } = prev;
          if (meta?.setEnabled !== undefined) enabled = meta.setEnabled;
          if (!enabled) return { enabled, decos: DecorationSet.empty };
          if (meta?.recheck) return { enabled, decos: computeDecorations(newState.doc) };
          // Document edits are re-checked on a debounce via the view (below),
          // so keep the previous decorations until the debounced pass lands.
          if (tr.docChanged) {
            decos = decos.map(tr.mapping, tr.doc);
          }
          return { enabled, decos };
        },
      },
      props: {
        decorations: (state): DecorationSet =>
          plugin.getState(state)?.decos ?? DecorationSet.empty,
        handleDOMEvents: {
          contextmenu: (view, event) => {
            const st = plugin.getState(view.state);
            if (!st?.enabled || !storage.onContextMenu) return false;
            const e = event as MouseEvent;
            const coords = view.posAtCoords({ left: e.clientX, top: e.clientY });
            if (!coords) return false;
            const hit = st.decos.find(coords.pos, coords.pos).find((d: Decoration) => {
              const spec = d.spec as { class?: string };
              return spec.class === DECORATION_CLASS && d.from <= coords.pos && coords.pos <= d.to;
            });
            if (!hit) return false;
            e.preventDefault();
            const word = view.state.doc.textBetween(hit.from, hit.to);
            storage.onContextMenu({
              word,
              from: hit.from,
              to: hit.to,
              suggestions: getSpellingSuggestions(word),
              x: e.clientX,
              y: e.clientY,
            });
            return true;
          },
        },
      },
      view: (view) => {
        let timer: ReturnType<typeof setTimeout> | null = null;
        const onChanged = (e: Event) => {
          const enabled = (e as CustomEvent<{ enabled: boolean }>).detail.enabled;
          view.dispatch(view.state.tr.setMeta(spellcheckPluginKey, { setEnabled: enabled }));
        };
        const onRecheck = () => {
          view.dispatch(view.state.tr.setMeta(spellcheckPluginKey, { recheck: true }));
        };
        window.addEventListener(SPELLCHECK_CHANGED_EVENT, onChanged);
        window.addEventListener(SPELLCHECK_RECHECK_EVENT, onRecheck);
        return {
          update: (viewUpdate, prevState) => {
            const st = plugin.getState(viewUpdate.state);
            if (!st?.enabled) return;
            if (viewUpdate.state.doc.eq(prevState.doc)) return;
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
              viewUpdate.dispatch(
                viewUpdate.state.tr.setMeta(spellcheckPluginKey, { recheck: true }),
              );
            }, RECHECK_DEBOUNCE_MS);
          },
          destroy: () => {
            if (timer) clearTimeout(timer);
            window.removeEventListener(SPELLCHECK_CHANGED_EVENT, onChanged);
            window.removeEventListener(SPELLCHECK_RECHECK_EVENT, onRecheck);
          },
        };
      },
    });
    return [plugin];
  },
});
