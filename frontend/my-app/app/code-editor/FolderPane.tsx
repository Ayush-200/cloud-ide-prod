import {useEffect, useState} from 'react'
import axios from 'axios';
import { Tree } from 'react-arborist';
import { FileNode } from '../../types';
import {useFileStore} from '../../store/filestore';
import { handleFolderRightClick } from '../utils/handleFolderRightClick';

const FolderPane = () => {
  const setFileContent = useFileStore((state) => state.setFileContent);
  const setCurrentFilePath = useFileStore((state) => state.setCurrentFilePath);
  const [data, setData] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  useEffect(() =>  {
    const fetchData = async () =>  {
      try{
        setLoading(true);
        console.log('Fetching from:', API_URL);
        const res = await axios.post<FileNode[]>(`${API_URL}/getFolderStructure`, {path: '/workspace'});
        setData(res.data);
        console.log('Folder structure loaded:', res.data);
      }catch(err){
        console.log("error in first load of folder structure", err);
      } finally {
        setLoading(false);
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

  const getFileIcon = (fileName: string, isDirectory: boolean) => {
    if (isDirectory) {
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-yellow-500">
          <path d="M14.5 3H7.71l-.85-.85L6.51 2h-5l-.5.5v11l.5.5h13l.5-.5v-10L14.5 3zm-.51 8.49V13h-12V7h4.49l.35-.15.86-.86H14v1.5l-.01 4zm0-6.49h-6.5l-.35.15-.86.86H2v-3h4.29l.85.85.36.15H14l-.01.99z"/>
        </svg>
      );
    }

    // File icons based on extension
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    switch(ext) {
      case 'js':
      case 'jsx':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-yellow-400">
            <path d="M1 1v14h14V1H1zm13 13H2V2h12v12z"/>
            <path d="M7.5 11.5c-.3 0-.5-.2-.5-.5V8c0-.3.2-.5.5-.5s.5.2.5.5v3c0 .3-.2.5-.5.5zm2.5 0c-.8 0-1.5-.7-1.5-1.5 0-.3.2-.5.5-.5s.5.2.5.5c0 .3.2.5.5.5s.5-.2.5-.5V8c0-.3.2-.5.5-.5s.5.2.5.5v2c0 .8-.7 1.5-1.5 1.5z"/>
          </svg>
        );
      case 'ts':
      case 'tsx':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-blue-500">
            <path d="M1 1v14h14V1H1zm13 13H2V2h12v12z"/>
            <path d="M5 5h3v1H6v5H5V5zm4 0h3v1h-1v5h-1V6H9V5z"/>
          </svg>
        );
      case 'json':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-green-500">
            <path d="M6 2.984V2h-.09c-.313 0-.616.062-.909.185a2.33 2.33 0 0 0-.775.53 2.23 2.23 0 0 0-.493.753v.001a3.542 3.542 0 0 0-.198.83v.002a6.08 6.08 0 0 0-.024.863c.012.29.018.58.018.869 0 .203-.04.393-.117.572v.001a1.504 1.504 0 0 1-.765.787 1.376 1.376 0 0 1-.558.115H2v.984h.09c.195 0 .38.04.556.121l.001.001c.178.078.329.184.455.318l.002.001c.13.13.233.285.307.465l.001.002c.078.18.117.368.117.566 0 .29-.006.58-.018.869-.012.296-.004.585.024.87v.001c.033.283.099.558.197.824v.001c.106.273.271.524.494.753.223.23.482.407.775.53.293.123.596.185.91.185H6v-.984h-.09c-.2 0-.387-.038-.562-.115a1.613 1.613 0 0 1-.457-.32 1.659 1.659 0 0 1-.309-.467c-.074-.18-.11-.37-.11-.573 0-.228.003-.453.011-.672.008-.228.008-.45 0-.665a4.639 4.639 0 0 0-.055-.64 2.682 2.682 0 0 0-.168-.609A2.284 2.284 0 0 0 3.522 8a2.284 2.284 0 0 0 .738-.955c.08-.192.135-.393.168-.602.033-.21.051-.423.055-.64.008-.22.008-.442 0-.666-.008-.224-.012-.45-.012-.678a1.47 1.47 0 0 1 .877-1.354 1.33 1.33 0 0 1 .563-.121H6zm4 10.032V14h.09c.313 0 .616-.062.909-.185.293-.123.552-.3.775-.53.223-.23.388-.48.493-.753v-.001c.1-.266.165-.543.198-.83v-.002c.028-.284.036-.573.024-.863-.012-.29-.018-.58-.018-.869 0-.203.04-.393.117-.572v-.001a1.504 1.504 0 0 1 .765-.787c.176-.077.362-.115.558-.115H14v-.984h-.09c-.195 0-.38-.04-.556-.121l-.001-.001a1.376 1.376 0 0 1-.455-.318l-.002-.001a1.415 1.415 0 0 1-.307-.465l-.001-.002a1.405 1.405 0 0 1-.117-.566c0-.29.006-.58.018-.869a6.174 6.174 0 0 0-.024-.87v-.001a3.537 3.537 0 0 0-.197-.824v-.001a2.23 2.23 0 0 0-.494-.753 2.33 2.33 0 0 0-.775-.53 2.325 2.325 0 0 0-.91-.185H10v.984h.09c.2 0 .387.038.562.115.174.082.326.188.457.32.127.134.23.29.309.467.074.18.11.37.11.573 0 .228-.003.452-.011.672-.008.228-.008.45 0 .665.004.217.022.43.055.64.033.214.089.416.168.609a2.285 2.285 0 0 0 .738.955 2.285 2.285 0 0 0-.738.955 2.689 2.689 0 0 0-.168.602c-.033.21-.051.423-.055.64-.008.22-.008.442 0 .666.008.224.012.45.012.678a1.47 1.47 0 0 1-.877 1.354 1.33 1.33 0 0 1-.563.121H10z"/>
          </svg>
        );
      case 'md':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-gray-400">
            <path d="M14 3v10H2V3h12m0-1H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"/>
            <path d="M3 5h10v1H3zm0 2h10v1H3zm0 2h10v1H3zm0 2h7v1H3z"/>
          </svg>
        );
      case 'css':
      case 'scss':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-purple-500">
            <path d="M1 1v14h14V1H1zm13 13H2V2h12v12z"/>
          </svg>
        );
      case 'html':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-orange-500">
            <path d="M1 1v14h14V1H1zm13 13H2V2h12v12z"/>
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-gray-400">
            <path d="M13.71 4.29l-3-3L10 1H4L3 2v12l1 1h9l1-1V5l-.29-.71zM13 14H4V2h5v4h4v8zm-3-9V2l3 3h-3z"/>
          </svg>
        );
    }
  };

  return (
    <div className="w-64 h-full border-r border-gray-700 bg-[#252526] overflow-y-auto overflow-x-hidden scrollbar-hide">
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      {loading ? (
        <div className="p-4 text-gray-400 flex items-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          Loading...
        </div>
      ) : data.length === 0 ? (
        <div className="p-4 text-gray-400">No files found</div>
      ) : (
        <Tree<FileNode>
         data={data} 
         idAccessor="id"
         width="100%"
         height={600}
         indent={20}
         rowHeight={24}
         onActivate={ async (nodeApi) => { 
          const node = nodeApi.data;
          console.log('=== Node Clicked ===');
          console.log('Node:', node);
          console.log('Is Directory:', node.isDirectory);
          console.log('Is Open:', nodeApi.isOpen);
          console.log('Has Children:', node.children?.length || 0);
          
          // If it's a directory, handle folder expansion
          if(node.isDirectory){
            // If folder is open, close it
            if(nodeApi.isOpen){
              console.log('Closing folder:', node.path);
              nodeApi.close();
              return;
            }
            
            // If children not loaded yet, load them first
            if(!node.children || node.children.length === 0){
              try {
                // Add to loading set
                setLoadingNodes(prev => new Set(prev).add(node.path));
                
                console.log('📡 API Call: Loading children for:', node.path);
                console.log('API URL:', `${API_URL}/getFolderStructure`);
                console.log('Request payload:', { path: node.path });
                
                const folderStructure = await axios.post<FileNode[]>(`${API_URL}/getFolderStructure`, {path: node.path});
                
                console.log('✅ API Response received');
                console.log('Children count:', folderStructure.data.length);
                console.log('Children:', folderStructure.data);
                
                const updatedData = insertChildren(node.path, data, folderStructure.data);
                setData(updatedData);
                console.log('Data updated, opening folder...');
                
                // Remove from loading set
                setLoadingNodes(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(node.path);
                  return newSet;
                });
                
                // Open after data is set
                setTimeout(() => {
                  nodeApi.open();
                  console.log('Folder opened');
                }, 0);
              } catch(err) {
                console.error("❌ Error loading folder structure:", err);
                // Remove from loading set on error
                setLoadingNodes(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(node.path);
                  return newSet;
                });
              }
            } else {
              // Children already loaded, just open
              console.log('Children already loaded, opening folder:', node.path);
              nodeApi.open();
            }
            return;
          }
          
          // If it's a file, load its content
          if(!node.isDirectory){
            try{
              console.log('📡 API Call: Fetching file content');
              console.log('File path:', node.path);
              console.log('API URL:', `${API_URL}/getfileData`);
              console.log('Request payload:', { path: node.path });
              
              const res = await axios.post<string>(`${API_URL}/getfileData`, {path: node.path});
              
              console.log('✅ File content received');
              console.log('Content length:', res.data.length);
              console.log('Content preview:', res.data.substring(0, 100));
              
              setFileContent(res.data);
              setCurrentFilePath(node.path);
              console.log('File content set in store');
            }catch(err){
              console.error("❌ Error fetching file content:", err);
            }
          }
         }}
        >
          {({ node, style, dragHandle }) => (
            <div
              ref={dragHandle}
              style={style}
              className="flex items-center px-2 hover:bg-[#2a2d2e] cursor-pointer text-[#cccccc] text-sm relative"
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const path = node.data.path;
                const isDirectory = node.data.isDirectory;
                const xAxis = e.clientX;
                const yAxis = e.clientY;
                console.log('Right click on:', { path, isDirectory, xAxis, yAxis });
                handleFolderRightClick(path, isDirectory, xAxis, yAxis);
              }}
            >
              {/* Folder arrow */}
              {node.data.isDirectory && (
                <span className="mr-1 flex-shrink-0">
                  {loadingNodes.has(node.data.path) ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                  ) : node.isOpen ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M6 4v8l4-4-4-4z" transform="rotate(90 8 8)"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M6 4v8l4-4-4-4z"/>
                    </svg>
                  )}
                </span>
              )}
              
              {/* Spacer for files to align with folder content */}
              {!node.data.isDirectory && <span className="w-4 flex-shrink-0"></span>}
              
              {/* File/Folder icon */}
              <span className="mr-2 flex-shrink-0">
                {getFileIcon(node.data.name, node.data.isDirectory)}
              </span>
              
              {/* File/Folder name */}
              <span className="truncate">{node.data.name}</span>
            </div>
          )}
        </Tree>
      )}
    </div>
  )
}

export default FolderPane
