"use client";

import React, { useRef, useEffect, useState } from "react";
import "@xterm/xterm/css/xterm.css";
import { useSocketStore } from "@/store/filestore";
import { terminalService } from "../services/terminalService";

interface TerminalTab {
  id: string;
  name: string;
  ref: React.RefObject<HTMLDivElement | null>;
}

export const TerminalComp = () => {
  const socket = useSocketStore((state) => state.socketInstance);
  const [terminals, setTerminals] = useState<TerminalTab[]>([]);
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null);

  const createNewTerminal = () => {
    if (!socket) return;

    socket.emit("create-terminal", (terminalId: string) => {
      const newTab: TerminalTab = {
        id: terminalId,
        name: `Terminal ${terminals.length + 1}`,
        ref: React.createRef<HTMLDivElement | null>(),
      };

      setTerminals((prev) => [...prev, newTab]);
      setActiveTerminalId(terminalId);
    });
  };

  // Create terminal instances when terminals array changes
  useEffect(() => {
    if (!socket) return;

    terminals.forEach((terminal) => {
      // Check if terminal instance already exists
      if (!terminalService.hasTerminal(terminal.id) && terminal.ref.current) {
        console.log(`[TerminalComp] Creating terminal instance for ${terminal.id}`);
        terminalService.createTerminal(terminal.id, terminal.ref.current, socket);
      }
    });
  }, [terminals, socket]);

  const switchTerminal = (terminalId: string) => {
    console.log(`[TerminalComp] Switching to terminal ${terminalId}`);
    setActiveTerminalId(terminalId);
    
    // Fit terminal after switching
    if (socket) {
      setTimeout(() => {
        terminalService.refreshTerminal(terminalId);
        terminalService.fitTerminal(terminalId, socket);
      }, 50);
    }
  };

  const closeTerminal = (terminalId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!socket) return;

    terminalService.disposeTerminal(terminalId, socket);

    setTerminals((prev) => {
      const newTerminals = prev.filter((t) => t.id !== terminalId);
      
      if (activeTerminalId === terminalId && newTerminals.length > 0) {
        setActiveTerminalId(newTerminals[newTerminals.length - 1].id);
      } else if (newTerminals.length === 0) {
        setActiveTerminalId(null);
      }
      
      return newTerminals;
    });
  };

  useEffect(() => {
    if (socket && terminals.length === 0) {
      createNewTerminal();
    }
  }, [socket]);

  useEffect(() => {
    return () => {
      terminals.forEach((terminal) => {
        if (socket) {
          terminalService.disposeTerminal(terminal.id, socket);
        }
      });
    };
  }, []);

  return (
    <div className="h-full w-full flex flex-col bg-[#1e1e1e]">
      {/* Terminal Header */}
      <div className="flex items-center bg-[#252526] border-b border-[#3e3e42] h-9">
        {/* Terminal Tabs */}
        <div className="flex items-center flex-1 overflow-x-auto">
          {terminals.map((terminal) => (
            <div
              key={terminal.id}
              onClick={() => switchTerminal(terminal.id)}
              className={`
                flex items-center gap-2 px-3 h-9 cursor-pointer border-r border-[#3e3e42]
                ${
                  activeTerminalId === terminal.id
                    ? "bg-[#1e1e1e] text-white"
                    : "bg-[#2d2d30] text-[#cccccc] hover:bg-[#37373d]"
                }
              `}
            >
              <span className="text-sm">{terminal.name}</span>
              <button
                onClick={(e) => closeTerminal(terminal.id, e)}
                className="hover:bg-[#505050] rounded p-0.5"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M8 8.707l3.646 3.647.708-.707L8.707 8l3.647-3.646-.707-.708L8 7.293 4.354 3.646l-.707.708L7.293 8l-3.646 3.646.707.708L8 8.707z" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Add Terminal Button */}
        <button
          onClick={createNewTerminal}
          className="px-3 h-9 hover:bg-[#37373d] text-[#cccccc] flex items-center justify-center"
          title="New Terminal"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 3.5a.5.5 0 0 1 .5.5v3.5H12a.5.5 0 0 1 0 1H8.5V12a.5.5 0 0 1-1 0V8.5H4a.5.5 0 0 1 0-1h3.5V4a.5.5 0 0 1 .5-.5z" />
          </svg>
        </button>
      </div>

      {/* Terminal Container */}
      <div className="flex-1 bg-[#1e1e1e] relative">
        {terminals.map((terminal) => (
          <div
            key={terminal.id}
            ref={terminal.ref as any}
            className="h-full w-full absolute top-0 left-0"
            style={{
              display: activeTerminalId === terminal.id ? "block" : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
};
