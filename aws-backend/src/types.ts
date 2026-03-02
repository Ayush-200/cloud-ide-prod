export type getFolderStructureRequest = {
    path: string
}

export type FileNode = {
    id: string;
    name: string;
    path: string;
    isDirectory: boolean;
    children?: FileNode[];
}

export type getFolderStructureResponse = FileNode[];


export type writeTerminalRequest = {
    terminalId: string, 
    data: string
}