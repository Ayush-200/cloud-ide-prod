export type FileNode = {
    id: string, 
    name: string, 
    path: string,
    isDirectory: boolean,
    children?: FileNode[]
}