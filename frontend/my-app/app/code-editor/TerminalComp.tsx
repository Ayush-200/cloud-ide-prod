"use client";

import { useRef, useEffect } from 'react'
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { useSocketStore } from '@/store/filestore';

export const TerminalComp = () => {
  const socket = useSocketStore((state) => state.socketInstance);
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const termInstance = useRef<Terminal | null>(null);

useEffect(() => { 
    const el = terminalRef.current;

    if(el === null){
        return;
    }

    if(termInstance.current){
      return;
    }

    const term = new Terminal();
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(el);
    term.write("hello to the terminal");
    fitAddon.fit();

    socket?.on('backend-response', (message) => { 
      console.log("received message from backend", message);
      term.write(message);
    })

    term.onData((data) =>  {
      socket?.emit('frontend-response', (data));
    })
    return () =>{
        term.dispose();
    }
    
}, [socket])
  return (
    
    
    <div ref={terminalRef} className='h-[100] bg-amber-50'></div>
  )
}

