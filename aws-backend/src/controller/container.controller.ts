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
