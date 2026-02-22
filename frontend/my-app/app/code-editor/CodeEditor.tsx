"use client";

import Editor from "@monaco-editor/react";
import { useState } from 'react';
import { useFileStore } from "@/store/filestore";
const setFileContent = useFileStore((state) => state.setFileContent);
export const CodeEditor = () => {

    return (
       <Editor
        height="100%"
        defaultLanguage="javascript"
        defaultValue="// Start coding..."
        theme="vs-dark"
        onChange={(value) => setFileContent(value ?? "no content in this file")}
      />
    );
}

