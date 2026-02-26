"use client";

import Editor from "@monaco-editor/react";
import { useFileStore } from "@/store/filestore";

export const CodeEditor = () => {
    const fileContent = useFileStore((state) => state.fileContent);
    const setFileContent = useFileStore((state) => state.setFileContent);

    return (
       <Editor
        height="100%"
        defaultLanguage="javascript"
        value={fileContent}
        theme="vs-dark"
        onChange={(value) => setFileContent(value ?? "")}
      />
    );
}

