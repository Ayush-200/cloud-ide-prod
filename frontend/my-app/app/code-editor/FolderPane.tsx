import {useEffect, useState} from 'react'
import axios from 'axios';
import { Tree } from 'react-arborist';
import { FileNode } from '../../types';
import {useFileStore} from '../../store/filestore';

const FolderPane = () => {
  const setFileContent = useFileStore((state) => state.setFileContent);
  const setCurrentFilePath = useFileStore((state) => state.setCurrentFilePath);
  const [data, setData] = useState<FileNode[]>([]);
  console.log(process.env.NEXT_PUBLIC_APP_URL);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  useEffect(() =>  {
    const fetchData = async () =>  {
      try{
        console.log('Fetching from:', API_URL);
        const res = await axios.post<FileNode[]>(`${API_URL}/getFolderStructure`, {path: '/workspace'});
        setData(res.data);
        console.log('Folder structure loaded:', res.data);
      }catch(err){
        console.log("error in first load of folder structure", err);
      }
    }

    fetchData();
  }, [API_URL]);
  
  const insertChildren = (targetPath: string, nodes: FileNode[], NewChildren: FileNode[]): FileNode[] =>  {
    return nodes.map((node: FileNode) => {
      if(node.path === targetPath){
        return {...node, children: NewChildren}
      }
      if(node.children && node.children.length > 0){
        return { 
          ...node, 
          children: insertChildren(targetPath, node.children, NewChildren)}
      }
      return node;
    })
  }

  return (
    <div className="w-64 h-full border-r border-gray-300 overflow-y-auto overflow-x-hidden scrollbar-hide">
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      {data.length === 0 ? (
        <div className="p-4 text-gray-500">Loading...</div>
      ) : (
        <Tree<FileNode>
         data={data} 
         idAccessor="id"
         width="100%"
         height={600}
         onActivate={ async (nodeApi) => { 
          const node = nodeApi.data;
          console.log('Clicked node:', node);
          
          if(!node.isDirectory){
            try{
              console.log('Fetching file content from:', `${API_URL}/getfileData`);
              const res = await axios.post<string>(`${API_URL}/getfileData`, {path: node.path});
              console.log('File content received:', res.data.substring(0, 100));
              setFileContent(res.data);
              setCurrentFilePath(node.path);
              return;
            }catch(err){
              console.error("error in fetching file content", err);
            }
          }

          if(node.children !== undefined && node.children?.length !== 0){
            return;
          }
          if(node.isDirectory){
            const folderStructure = await axios.post<FileNode[]>(`${API_URL}/getFolderStructure`, {path: node.path});
            const updatedDate = insertChildren(node.path, data, folderStructure.data);
            setData(updatedDate);
          }
         }}
        />
      )}
    </div>
  )
}

export default FolderPane
