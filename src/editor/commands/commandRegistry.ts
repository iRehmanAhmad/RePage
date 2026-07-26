/**
 * RePage Command Registry & Dispatcher
 *
 * Maps abstract command IDs (e.g. 'file.save', 'text.bold', 'insert.textbox')
 * to executable handlers, keyboard shortcuts, undoability, and UI labels.
 */

export interface CommandDefinition {
  id: string;
  label: string;
  category: 'file' | 'edit' | 'insert' | 'format' | 'view' | 'urdu' | 'collaboration';
  shortcut?: string;
  icon?: string;
  isUndoable?: boolean;
  execute: (...args: any[]) => void | Promise<void>;
  canExecute?: () => boolean;
}

class CommandRegistry {
  private commands = new Map<string, CommandDefinition>();

  public register(def: CommandDefinition): void {
    this.commands.set(def.id, def);
  }

  public get(id: string): CommandDefinition | undefined {
    return this.commands.get(id);
  }

  public setHandler(id: string, execute: (...args: any[]) => void | Promise<void>): void {
    const existing = this.commands.get(id);
    if (existing) {
      existing.execute = execute;
    } else {
      this.commands.set(id, {
        id,
        label: id,
        category: 'edit',
        execute,
      });
    }
  }

  public getAll(): CommandDefinition[] {
    return Array.from(this.commands.values());
  }

  public execute(id: string, ...args: any[]): boolean {
    const cmd = this.commands.get(id);
    if (!cmd) {
      // eslint-disable-next-line no-console
      console.warn(`[CommandRegistry] Command not found: ${id}`);
      return false;
    }
    if (cmd.canExecute && !cmd.canExecute()) {
      return false;
    }
    cmd.execute(...args);
    return true;
  }
}

export const commandRegistry = new CommandRegistry();

// Default Registration of Clipboard Commands
commandRegistry.register({
  id: 'edit.cut',
  label: 'Cut Selection',
  category: 'edit',
  shortcut: 'Ctrl+X',
  icon: '✂️',
  isUndoable: true,
  execute: () => {},
});

commandRegistry.register({
  id: 'edit.copy',
  label: 'Copy Selection',
  category: 'edit',
  shortcut: 'Ctrl+C',
  icon: '📄',
  isUndoable: false,
  execute: () => {},
});

commandRegistry.register({
  id: 'edit.paste',
  label: 'Paste',
  category: 'edit',
  shortcut: 'Ctrl+V',
  icon: '📋',
  isUndoable: true,
  execute: () => {},
});

commandRegistry.register({
  id: 'edit.pasteUnformatted',
  label: 'Keep Text Only',
  category: 'edit',
  shortcut: 'Ctrl+Shift+V',
  icon: '📄',
  isUndoable: true,
  execute: () => {},
});

