import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { Socket } from "socket.io-client";

class TerminalService {
  private terminals = new Map<string, Terminal>();
  private fitAddons = new Map<string, FitAddon>();
  private resizeListeners = new Map<string, () => void>();

  createTerminal(
    terminalId: string,
    container: HTMLDivElement,
    socket: Socket
  ) {
    if (this.terminals.has(terminalId)) {
      console.log(`[createTerminal] Terminal ${terminalId} already exists`);
      return;
    }

    console.log(`[createTerminal] Creating new terminal ${terminalId}`);

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      scrollback: 10000, // Number of lines to keep in buffer (default is 1000)
      theme: {
        background: "#1e1e1e",
        foreground: "#ffffff",
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(container);

    // Fit after DOM is ready and notify backend
    setTimeout(() => {
      fitAddon.fit();
      socket.emit("resize-terminal", {
        terminalId,
        cols: term.cols,
        rows: term.rows,
      });
    }, 0);

    // Handle window resize
    const resizeHandler = () => {
      fitAddon.fit();
      socket.emit("resize-terminal", {
        terminalId,
        cols: term.cols,
        rows: term.rows,
      });
    };
    window.addEventListener("resize", resizeHandler);

    term.onData((data) => {
      socket.emit("frontend-response", terminalId, data);
    });

    this.terminals.set(terminalId, term);
    this.fitAddons.set(terminalId, fitAddon);
    this.resizeListeners.set(terminalId, resizeHandler);
  }

  hasTerminal(terminalId: string): boolean {
    return this.terminals.has(terminalId);
  }

  writeTerminal(terminalId: string, data: string) {
    const terminal = this.terminals.get(terminalId);
    if (!terminal) return;
    terminal.write(data);
  }

  fitTerminal(terminalId: string, socket: Socket) {
    const fitAddon = this.fitAddons.get(terminalId);
    const terminal = this.terminals.get(terminalId);
    if (!fitAddon || !terminal) return;
    
    fitAddon.fit();
    socket.emit("resize-terminal", {
      terminalId,
      cols: terminal.cols,
      rows: terminal.rows,
    });
  }

  refreshTerminal(terminalId: string) {
    const terminal = this.terminals.get(terminalId);
    if (!terminal) {
      console.log(`[refreshTerminal] Terminal ${terminalId} not found`);
      return;
    }
    
    // Log terminal buffer content
    console.log(`[refreshTerminal] Terminal ${terminalId} info:`, {
      rows: terminal.rows,
      cols: terminal.cols,
      bufferLength: terminal.buffer.active.length,
      cursorY: terminal.buffer.active.cursorY,
      cursorX: terminal.buffer.active.cursorX,
    });

    // Get some buffer content to verify data exists
    const bufferLines: string[] = [];
    for (let i = 0; i < Math.min(10, terminal.buffer.active.length); i++) {
      const line = terminal.buffer.active.getLine(i);
      if (line) {
        bufferLines.push(line.translateToString(true));
      }
    }
    console.log(`[refreshTerminal] First 10 lines of terminal ${terminalId}:`, bufferLines);
    
    // Force a refresh of the terminal display
    terminal.refresh(0, terminal.rows - 1);
  }
  

  disposeTerminal(terminalId: string, socket: Socket) {
    const terminal = this.terminals.get(terminalId);
    if (!terminal) return;

    // Remove resize listener
    const resizeListener = this.resizeListeners.get(terminalId);
    if (resizeListener) {
      window.removeEventListener("resize", resizeListener);
      this.resizeListeners.delete(terminalId);
    }

    // Notify backend to kill the terminal process
    socket.emit("kill-terminal", terminalId);

    terminal.dispose();
    this.terminals.delete(terminalId);
    this.fitAddons.delete(terminalId);
  }

  disposeAll() {
    // Clean up all resize listeners
    this.resizeListeners.forEach((listener) => {
      window.removeEventListener("resize", listener);
    });
    this.resizeListeners.clear();

    this.terminals.forEach((terminal) => terminal.dispose());
    this.terminals.clear();
    this.fitAddons.clear();
  }
}

export const terminalService = new TerminalService();