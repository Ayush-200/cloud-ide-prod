import fs from 'fs/promises';
import path from 'path';
import type { Request, Response } from 'express';
import type { getFolderStructureRequest, getFolderStructureResponse, FileNode } from '../types.js';

export const getFolderStructure = async (
    req: Request<{}, {}, getFolderStructureRequest>, 
    res: Response
) => {
    try {
        const { path: dirPath } = req.body;
        
        if (!dirPath) {
            return res.status(400).json({ error: 'path is required' });
        }

        const folderStructure = await fs.readdir(dirPath, { withFileTypes: true });

        const structure: FileNode[] = folderStructure.map((element) => {
            const name = element.name;
            const fullPath = path.join(dirPath, element.name);
            const isDirectory = element.isDirectory();
            
            return {
                id: fullPath,
                name,
                path: fullPath,
                isDirectory,
                children: isDirectory ? [] : undefined
            };
        });

        return res.json(structure);
    } catch (error) {
        console.error('Error reading folder structure:', error);
        return res.status(500).json({ error: 'Failed to read folder structure' });
    }
};

export const getfileData = async (req: Request<{}, {}, { path: string }>, res: Response) => {
    try {
        const { path: filePath } = req.body;
        
        if (!filePath) {
            return res.status(400).json({ error: 'path is required' });
        }

        const content = await fs.readFile(filePath, 'utf-8');
        return res.json(content);
    } catch (error) {
        console.error('Error reading file:', error);
        return res.status(500).json({ error: 'Failed to read file' });
    }
};

export const saveFileData = async (req: Request<{}, {}, { path: string, content: string }>, res: Response) => {
    try {
        const { path: filePath, content } = req.body;
        
        if (!filePath) {
            return res.status(400).json({ error: 'path is required' });
        }
        
        if (content === undefined) {
            return res.status(400).json({ error: 'content is required' });
        }

        await fs.writeFile(filePath, content, 'utf-8');
        return res.json({ success: true, message: 'File saved successfully' });
    } catch (error) {
        console.error('Error saving file:', error);
        return res.status(500).json({ error: 'Failed to save file' });
    }
};

export const createFile = async (req: Request<{}, {}, { parentPath: string, fileName: string }>, res: Response) => {
    try {
        const { parentPath, fileName } = req.body;
        
        if (!parentPath || !fileName) {
            return res.status(400).json({ error: 'parentPath and fileName are required' });
        }

        const filePath = path.join(parentPath, fileName);
        
        // Check if file already exists
        try {
            await fs.access(filePath);
            return res.status(400).json({ error: 'File already exists' });
        } catch {
            // File doesn't exist, proceed with creation
        }

        // Create empty file
        await fs.writeFile(filePath, '', 'utf-8');
        
        return res.json({ 
            success: true, 
            message: 'File created successfully',
            path: filePath,
            name: fileName
        });
    } catch (error) {
        console.error('Error creating file:', error);
        return res.status(500).json({ error: 'Failed to create file' });
    }
};

export const createFolder = async (req: Request<{}, {}, { parentPath: string, folderName: string }>, res: Response) => {
    try {
        const { parentPath, folderName } = req.body;
        
        if (!parentPath || !folderName) {
            return res.status(400).json({ error: 'parentPath and folderName are required' });
        }

        const folderPath = path.join(parentPath, folderName);
        
        // Check if folder already exists
        try {
            await fs.access(folderPath);
            return res.status(400).json({ error: 'Folder already exists' });
        } catch {
            // Folder doesn't exist, proceed with creation
        }

        // Create folder
        await fs.mkdir(folderPath, { recursive: true });
        
        return res.json({ 
            success: true, 
            message: 'Folder created successfully',
            path: folderPath,
            name: folderName
        });
    } catch (error) {
        console.error('Error creating folder:', error);
        return res.status(500).json({ error: 'Failed to create folder' });
    }
};

export const deleteFileOrFolder = async (req: Request<{}, {}, { path: string }>, res: Response) => {
    try {
        const { path: targetPath } = req.body;
        
        if (!targetPath) {
            return res.status(400).json({ error: 'path is required' });
        }

        // Check if path exists
        try {
            await fs.access(targetPath);
        } catch {
            return res.status(404).json({ error: 'File or folder not found' });
        }

        // Check if it's a directory or file
        const stats = await fs.stat(targetPath);
        
        if (stats.isDirectory()) {
            // Delete directory recursively
            await fs.rm(targetPath, { recursive: true, force: true });
            console.log('Folder deleted:', targetPath);
        } else {
            // Delete file
            await fs.unlink(targetPath);
            console.log('File deleted:', targetPath);
        }
        
        return res.json({ 
            success: true, 
            message: stats.isDirectory() ? 'Folder deleted successfully' : 'File deleted successfully',
            path: targetPath
        });
    } catch (error) {
        console.error('Error deleting file or folder:', error);
        return res.status(500).json({ error: 'Failed to delete file or folder' });
    }
};
