import * as pty from "node-pty";
import os from "os";

const terminals = new Map<string, pty.IPty>();

export function createTerminal(terminalId: string) {
  if (!terminals.has(terminalId)) {
    const isWindows = os.platform() === "win32";

    const shell = isWindows ? "powershell.exe" : "bash";

    // Get userId and projectName from environment variables
    const userId = process.env.USER_ID;
    const projectName = process.env.PROJECT_NAME;

    // Determine working directory
    let cwd: string;
    if (isWindows) {
      cwd = process.cwd(); // Windows path
    } else {
      // Use WORKSPACE_PATH if set, otherwise construct from userId/projectName
      if (process.env.WORKSPACE_PATH) {
        cwd = process.env.WORKSPACE_PATH;
      } else if (userId && projectName) {
        cwd = `/workspace/${userId}/${projectName}`;
      } else {
        cwd = '/workspace'; // Fallback to root workspace
      }
    }

    console.log('Creating terminal with:');
    console.log('  Terminal ID:', terminalId);
    console.log('  User ID:', userId || 'N/A');
    console.log('  Project Name:', projectName || 'N/A');
    console.log('  Working Directory:', cwd);

    const terminal = pty.spawn(shell, [], {
      name: "xterm-color",
      cols: 80,
      rows: 24,
      cwd,
      env: process.env
    });

    terminals.set(terminalId, terminal);

    console.log("✅ Terminal created:", terminalId);
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

