"use client";

import Editor from "@monaco-editor/react";
import { useFileStore } from "@/store/filestore";
import throttle from 'lodash.throttle'
import { useMemo } from "react";
import axios from 'axios';
export const CodeEditor = () => {
  const updaateUsingThrottle = useMemo(() => {
    return throttle((value, path) => { 
      console.log(process.env.NEXT_PUBLIC_APP_URL);
      axios.post(`${process.env.NEXT_PUBLIC_APP_URL}/saveFileData`, {path: path, content: value});
    }, 5000)
  }, [])

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
          updaateUsingThrottle(fileContent, currentFilePath)
        }}
      />
    );
}

