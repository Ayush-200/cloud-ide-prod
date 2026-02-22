import fs from 'fs/promises';
import path from 'path';
import { CLIENT_RENEG_LIMIT } from 'tls';

export const getFolderStructure = async (req:string) => {
    const dir = 'C:\\Users\\DELL\\Desktop\\cloud-ide\\aws-backend\\src';
    const folderStructure = await fs.readdir(dir, { withFileTypes: true});

    const structure = folderStructure.map((element) =>  {
        const name = element.name;
        const fullPath = path.join(dir, element.name);
        const type = element.isDirectory() ? 'folder' : 'file'; 
        
        return { name, type, path: fullPath };
    })

    console.log(structure);

}

export const getfileData = async (req: {path:string}) => { 
    const content = await fs.readFile(req.path, 'utf-8');
    // console.log(content);
    return content;


}
// getFolderStructure('');
getfileData({path: 'C:\\Users\\DELL\\Desktop\\cloud-ide\\aws-backend\\new.txt'});