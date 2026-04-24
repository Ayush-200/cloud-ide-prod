"use client";

import Editor from "@monaco-editor/react";
import { useFileStore } from "@/store/filestore";
import throttle from 'lodash.throttle'
import { useMemo } from "react";
import axios from 'axios';

export const CodeEditor = () => {
  const API_URL = process.env.NEXT_PUBLIC_CONTAINER_API_URL || 'http://localhost:8080';
  
  const updaateUsingThrottle = useMemo(() => {
    return throttle((value, path) => { 
      if (!path) {
        console.warn('⚠️ No file path, skipping save');
        return;
      }
      
      console.log('💾 Saving file:', path);
      console.log('📝 Content length:', value?.length || 0);
      
      axios.post(`${API_URL}/saveFileData`, {
        path: path, 
        content: value
      })
      .then(() => {
        console.log('✅ File saved successfully');
      })
      .catch((err) => {
        console.error('❌ Failed to save file:', err);
      });
    }, 2000) // Reduced to 2 seconds
  }, [API_URL])

    const fileContent = useFileStore((state) => state.fileContent);
    const setFileContent = useFileStore((state) => state.setFileContent);
    const currentFilePath = useFileStore((state) => state.currentFilePath);

    return (
       <Editor
        height="100%"
        defaultLanguage="javascript"
        value={fileContent}
        theme="vs-dark"
        onChange={(value) => {
          setFileContent(value ?? "")
          updaateUsingThrottle(value, currentFilePath) // Fixed: use 'value' not 'fileContent'
        }}
      />
    );
}

