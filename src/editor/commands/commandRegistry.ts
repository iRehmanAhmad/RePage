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
