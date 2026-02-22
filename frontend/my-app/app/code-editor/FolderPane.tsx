import {useEffect, useState} from 'react'
import axios from 'axios';
import { Tree } from 'react-arborist';
import { FileNode } from '../../types';
import {useFileStore} from '../../store/filestore';


const FolderPane = () => {
  const setFileContent = useFileStore((state) => state.setFileContent);
  const [data, setData] = useState<FileNode[]>([]);
  // const [selectedNode, setSelectedNode] =  useState<FileNode | null>();

  useEffect(() =>  {
    const fetchData = async () =>  {
      try{
        const res = await axios.post(`${process.env.APP_URL}/getFolderStructure`, {path: '/'});
        setData(res.data);
      }catch(err){
        console.log("error in first load of folder structure", err);
      }

    }

    fetchData();
  }, []);
  const insertChildren = (targetPath: string, NewChildren: FileNode[]): FileNode[] =>  {

    return data.map((node: FileNode) => {
      if(node.path === targetPath){
        return {...node, children: NewChildren}
      }
      if(node.children ){
        return { 
          ...node, 
          children: insertChildren(targetPath, NewChildren)}
      }
      return node;
    })
  }

  return (
    <div>
      <Tree<FileNode>
       data={data} 
       idAccessor="id"
       onActivate={ async (nodeApi) => { 
        const node = nodeApi.data;
        if(!node.isDirectory){
          try{
            const res = await axios.post(`${process.env.APP_URL}/getfileData`, {path: node.path});
            const code = res.data;
            setFileContent(code);
            return;
          }catch(err){
            console.log("error in fetching file content", err);
          }
        }

        if(node.children !== undefined && node.children?.length !== 0){
          return;
        }
        // setSelectedNode(node);
        if(node.isDirectory){
          const folderStructure = await axios.post(`${process.env.APP_URL}/getFolderStructure`, {path: node.path});
          const updatedDate = insertChildren(node.path, folderStructure.data);
          setData(updatedDate);
        }
       }}
      />
    </div>
  )
}

export default FolderPane
