import chokidar from "chokidar";
import path from "path";
import { Server } from "socket.io";

// Default to /workspace to match terminal and FolderPane
const ROOT = path.resolve("/workspace");

export const initializeFileWatcher = (io: Server) => {
  console.log("Initializing file watcher for:", ROOT);
  
  const watcher = chokidar.watch(ROOT, {
    persistent: true,
    ignoreInitial: true,
    depth: Infinity,
    ignored: /(^|[\/\\])\../, // ignore dotfiles
  });

  watcher
    // FILE EVENTS
    .on("add", (filePath) => {
      console.log("File created:", filePath);
      const relativePath = path.relative(ROOT, filePath);
      const fileName = path.basename(filePath);
      
      io.emit("file-created", {
        path: filePath,
        name: fileName,
        relativePath: relativePath,
        isDirectory: false,
      });
    })
    .on("change", (filePath) => {
      console.log("File modified:", filePath);
      const relativePath = path.relative(ROOT, filePath);
      const fileName = path.basename(filePath);
      
      io.emit("file-changed", {
        path: filePath,
        name: fileName,
        relativePath: relativePath,
        isDirectory: false,
      });
    })
    .on("unlink", (filePath) => {
      console.log("File deleted:", filePath);
      const relativePath = path.relative(ROOT, filePath);
      const fileName = path.basename(filePath);
      
      io.emit("file-deleted", {
        path: filePath,
        name: fileName,
        relativePath: relativePath,
        isDirectory: false,
      });
    })
    // FOLDER EVENTS
    .on("addDir", (dirPath) => {
      console.log("Folder created:", dirPath);
      const relativePath = path.relative(ROOT, dirPath);
      const dirName = path.basename(dirPath);
      
      io.emit("folder-created", {
        path: dirPath,
        name: dirName,
        relativePath: relativePath,
        isDirectory: true,
      });
    })
    .on("unlinkDir", (dirPath) => {
      console.log("Folder deleted:", dirPath);
      const relativePath = path.relative(ROOT, dirPath);
      const dirName = path.basename(dirPath);
      
      io.emit("folder-deleted", {
        path: dirPath,
        name: dirName,
        relativePath: relativePath,
        isDirectory: true,
      });
    })
    // SYSTEM EVENTS
    .on("ready", () => {
      console.log("✅ File watcher initialized successfully");
      console.log("📁 Watching directory:", ROOT);
      console.log("👤 User ID:", process.env.USER_ID || "N/A");
      console.log("📦 Project:", process.env.PROJECT_NAME || "N/A");
    })
    .on("error", (error) => {
      console.error("❌ Watcher error:", error);
    });

  return watcher;
};

