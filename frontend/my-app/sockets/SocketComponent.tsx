"use client";

import { useEffect } from "react";
import io from "socket.io-client";
import { useSocketStore, useSessionStore, useFolderStore } from "@/store/filestore";
import { terminalService } from "../app/services/terminalService";

const SocketComponent = () => {
  const setSocket = useSocketStore((state) => state.setSocket);
  const sessionId = useSessionStore((state) => state.sessionId);
  const { addNode, removeNode } = useFolderStore();

  useEffect(() => {
    // Only connect if we have a sessionId
    if (!sessionId) {
      console.log("No sessionId available, waiting...");
      return;
    }

    console.log(`Connecting socket with sessionId: ${sessionId}`);

    const socketInstance = io(
      "http://cloud-ide-load-balancer-1255940416.ap-south-1.elb.amazonaws.com:8080",
      {
        transports: ["websocket"],
        auth: {
          sessionId: sessionId,
        },
      }
    );

    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      console.log(`Socket connected with sessionId: ${sessionId}`);
    });

    socketInstance.on(
      "backend-response",
      (terminalId: string, data: string) => {
        terminalService.writeTerminal(terminalId, data);
      }
    );

    // File system events
    socketInstance.on("file-created", (data: { path: string; name: string; relativePath: string; isDirectory: boolean }) => {
      console.log("📁 File created event:", data);
      const parentPath = data.path.substring(0, data.path.lastIndexOf('/'));
      
      // If it's a root-level file (parent is the workspace root), add directly to folderStructure
      if (data.relativePath && !data.relativePath.includes('/')) {
        console.log("Adding root-level file:", data.name);
        const { folderStructure, setFolderStructure } = useFolderStore.getState();
        const newNode = {
          id: data.path,
          name: data.name,
          path: data.path,
          isDirectory: false,
          children: []
        };
        // Check if node already exists
        if (!folderStructure.some(n => n.path === data.path)) {
          setFolderStructure([...folderStructure, newNode]);
        }
      } else {
        // It's a nested file, use addNode
        addNode(parentPath, {
          id: data.path,
          name: data.name,
          path: data.path,
          isDirectory: false,
          children: []
        });
      }
    });

    socketInstance.on("file-changed", (data: { path: string; name: string; relativePath: string; isDirectory: boolean }) => {
      console.log("📝 File changed event:", data);
      // Optionally trigger a refresh of the file content if it's currently open
    });

    socketInstance.on("file-deleted", (data: { path: string; name: string; relativePath: string; isDirectory: boolean }) => {
      console.log("🗑️ File deleted event:", data);
      removeNode(data.path);
    });

    socketInstance.on("folder-created", (data: { path: string; name: string; relativePath: string; isDirectory: boolean }) => {
      console.log("📂 Folder created event:", data);
      const parentPath = data.path.substring(0, data.path.lastIndexOf('/'));
      
      // If it's a root-level folder (parent is the workspace root), add directly to folderStructure
      if (data.relativePath && !data.relativePath.includes('/')) {
        console.log("Adding root-level folder:", data.name);
        const { folderStructure, setFolderStructure } = useFolderStore.getState();
        const newNode = {
          id: data.path,
          name: data.name,
          path: data.path,
          isDirectory: true,
          children: []
        };
        // Check if node already exists
        if (!folderStructure.some(n => n.path === data.path)) {
          setFolderStructure([...folderStructure, newNode]);
        }
      } else {
        // It's a nested folder, use addNode
        addNode(parentPath, {
          id: data.path,
          name: data.name,
          path: data.path,
          isDirectory: true,
          children: []
        });
      }
    });

    socketInstance.on("folder-deleted", (data: { path: string; name: string; relativePath: string; isDirectory: boolean }) => {
      console.log("🗑️ Folder deleted event:", data);
      removeNode(data.path);
    });

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected");
      terminalService.disposeAll();
    });

    return () => {
      socketInstance.off("backend-response");
      socketInstance.off("file-created");
      socketInstance.off("file-changed");
      socketInstance.off("file-deleted");
      socketInstance.off("folder-created");
      socketInstance.off("folder-deleted");
      socketInstance.disconnect();
    };
  }, [setSocket, sessionId, addNode, removeNode]);

  return null;
};

export default SocketComponent;
