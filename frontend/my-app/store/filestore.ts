import { Socket } from 'socket.io-client';
import { create } from 'zustand';
import { FileNode } from '../types';


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
    projectId: string | null,
    projectName: string | null,
    userId: string | null,
    setSessionData: (sessionId: string, taskArn: string, privateIp: string, projectId?: string, projectName?: string, userId?: string) => void,
    clearSessionData: () => void
}

interface folderStore {
    folderStructure: FileNode[],
    setFolderStructure: (structure: FileNode[]) => void,
    addNode: (parentPath: string, node: FileNode) => void,
    removeNode: (nodePath: string) => void,
    updateNode: (nodePath: string, updates: Partial<FileNode>) => void
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
    sessionId: typeof window !== 'undefined' ? localStorage.getItem('sessionId') : null,
    taskArn: typeof window !== 'undefined' ? localStorage.getItem('taskArn') : null,
    privateIp: typeof window !== 'undefined' ? localStorage.getItem('privateIp') : null,
    projectId: typeof window !== 'undefined' ? localStorage.getItem('projectId') : null,
    projectName: typeof window !== 'undefined' ? localStorage.getItem('projectName') : null,
    userId: typeof window !== 'undefined' ? localStorage.getItem('userId') : null,
    setSessionData: (sessionId, taskArn, privateIp, projectId, projectName, userId) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('sessionId', sessionId);
            localStorage.setItem('taskArn', taskArn);
            localStorage.setItem('privateIp', privateIp);
            if (projectId) localStorage.setItem('projectId', projectId);
            if (projectName) localStorage.setItem('projectName', projectName);
            if (userId) localStorage.setItem('userId', userId);
        }
        set({ sessionId, taskArn, privateIp, projectId, projectName, userId });
    },
    clearSessionData: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('sessionId');
            localStorage.removeItem('taskArn');
            localStorage.removeItem('privateIp');
            localStorage.removeItem('projectId');
            localStorage.removeItem('projectName');
            localStorage.removeItem('userId');
        }
        set({ sessionId: null, taskArn: null, privateIp: null, projectId: null, projectName: null, userId: null });
    }
}))

export const useFolderStore = create<folderStore>((set) => ({
    folderStructure: [],
    setFolderStructure: (structure) => set({ folderStructure: structure }),
    
    addNode: (parentPath, node) => set((state) => {
        const addToTree = (nodes: FileNode[]): FileNode[] => {
            return nodes.map(n => {
                if (n.path === parentPath) {
                    const children = n.children || [];
                    // Check if node already exists
                    if (!children.some(child => child.path === node.path)) {
                        return { ...n, children: [...children, node] };
                    }
                    return n;
                }
                if (n.children && n.children.length > 0) {
                    return { ...n, children: addToTree(n.children) };
                }
                return n;
            });
        };
        
        return { folderStructure: addToTree(state.folderStructure) };
    }),
    
    removeNode: (nodePath) => set((state) => {
        const removeFromTree = (nodes: FileNode[]): FileNode[] => {
            return nodes
                .filter(n => n.path !== nodePath)
                .map(n => ({
                    ...n,
                    children: n.children ? removeFromTree(n.children) : undefined
                }));
        };
        
        return { folderStructure: removeFromTree(state.folderStructure) };
    }),
    
    updateNode: (nodePath, updates) => set((state) => {
        const updateInTree = (nodes: FileNode[]): FileNode[] => {
            return nodes.map(n => {
                if (n.path === nodePath) {
                    return { ...n, ...updates };
                }
                if (n.children && n.children.length > 0) {
                    return { ...n, children: updateInTree(n.children) };
                }
                return n;
            });
        };
        
        return { folderStructure: updateInTree(state.folderStructure) };
    })
}))
