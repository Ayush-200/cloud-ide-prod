import { Socket } from "socket.io";
import { v4 as uuid} from 'uuid';
import { createTerminal, writeTerminal, getTerminal, killTerminal } from "../services/terminalService.js";


export const registerTerminalSocket = (socket: Socket) => {

    const terminalIdSet = new Set<string>();

    socket.on('create-terminal', (callback) => {
        const terminalId = uuid();
        createTerminal(terminalId);
        terminalIdSet.add(terminalId);
        const terminal = getTerminal(terminalId);

        terminal?.onData((data) => { 
            socket.emit('backend-response', terminalId, data);
        })

        callback(terminalId);
    })

    socket.on('frontend-response', (terminalId, data) => { 
        writeTerminal(terminalId, data);
    });

    socket.on('resize-terminal', ({ terminalId, cols, rows }) => {
        const ptyProcess = getTerminal(terminalId);
        if (ptyProcess) {
            ptyProcess.resize(cols, rows);
        }
    });

    socket.on('kill-terminal', (terminalId) => {
        killTerminal(terminalId);
        terminalIdSet.delete(terminalId);
    });

    socket.on('disconnect', () => { 
        for(const id of terminalIdSet){
            killTerminal(id);
        }
    })
    
}