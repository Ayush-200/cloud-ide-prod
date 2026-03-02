import { v4 as uuid } from "uuid";
import * as pty from "node-pty";
import os from "os";
import path from "path";

const terminals = new Map<string, pty.IPty>();

export function createTerminal(terminalId: string) {
 

  if (!terminals.has(terminalId)) {
    const isWindows = os.platform() === "win32";

    const shell = isWindows ? "powershell.exe" : "bash";

    const cwd = isWindows
      ? process.cwd()               // valid Windows path
      : process.env.WORKSPACE_DIR || "/workspace";

    const terminal = pty.spawn(shell, [], {
      name: "xterm-color",
      cols: 80,
      rows: 24,
      cwd,
      env: process.env
    });

    terminals.set(terminalId, terminal);

    console.log("Terminal created:", terminalId);
  }

  return terminalId;
}

export function getTerminal(terminalId: string){
    return terminals.get(terminalId);
}

export function writeTerminal(terminalId: string, data: string){
    const terminal = terminals.get(terminalId);
    if(!terminal){
        console.error("Terminal not found:", terminalId);
        return;
    }
    terminal.write(data);
}


export function killTerminal(id: string){
    const terminal = terminals.get(id);
    terminal?.kill();
    terminals.delete(id);

}

