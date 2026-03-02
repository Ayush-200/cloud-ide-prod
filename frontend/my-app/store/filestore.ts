import { Socket } from 'socket.io-client';
import { create } from 'zustand';


interface fileContentStore {
    fileContent: string,
    currentFilePath: string | null,
    setFileContent: (newFileContent: string) => void,
    setCurrentFilePath: (path: string | null) => void
}

interface socketStore{
    socketInstance: Socket | null, 
    setSocket: (socket: Socket| null) => void
}

interface sessionStore {
    sessionId: string | null,
    taskArn: string | null,
    privateIp: string | null,
    setSessionData: (sessionId: string, taskArn: string, privateIp: string) => void,
    clearSessionData: () => void
}

export const useFileStore = create<fileContentStore>((set) => ({
    fileContent: "",
    currentFilePath: null,
    setFileContent: ((newFileContent) => 
        set({fileContent: newFileContent})),
    setCurrentFilePath: ((path) =>
        set({currentFilePath: path}))
})) 

export const useSocketStore = create<socketStore>((set) =>  ({
    socketInstance: null, 
    setSocket: ((newSocketInstance) =>  
    set({socketInstance: newSocketInstance}))

}))

export const useSessionStore = create<sessionStore>((set) => ({
    sessionId: null,
    taskArn: null,
    privateIp: null,
    setSessionData: (sessionId, taskArn, privateIp) => 
        set({ sessionId, taskArn, privateIp }),
    clearSessionData: () => 
        set({ sessionId: null, taskArn: null, privateIp: null })
}))