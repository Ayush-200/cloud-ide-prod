import { Socket } from 'socket.io-client';
import { create } from 'zustand';


interface fileContentStore {
    fileContent: string, 
    setFileContent: (newFileContent: string) => void
}

interface socketStore{
    socketInstance: Socket | null, 
    setSocket: (socket: Socket| null) => void
}
export const useFileStore = create<fileContentStore>((set) => ({
    fileContent: "", 
    setFileContent: ((newFileContent) => 
        set({fileContent: newFileContent}))
})) 

export const useSocketStore = create<socketStore>((set) =>  ({
    socketInstance: null, 
    setSocket: ((newSocketInstance) =>  
    set({socketInstance: newSocketInstance}))

}))