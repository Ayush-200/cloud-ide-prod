import chokidar from "chokidar";
import path from "path";
import { Server } from "socket.io";
import fs from 'fs';

// Determine the root directory to watch based on environment variables
const getWatchRoot = (): string => {
  // Use WORKSPACE_PATH if set (highest priority)
  if (process.env.WORKSPACE_PATH) {
    return path.resolve(process.env.WORKSPACE_PATH);
  }
  
  // Construct from USER_ID and PROJECT_NAME if available
  const userId = process.env.USER_ID;
  const projectName = process.env.PROJECT_NAME;
  
  if (userId && projectName) {
    return path.resolve(`/workspace/${userId}/${projectName}`);
  }
  
  // Fallback to /workspace root
  return path.resolve("/workspace");
};

const ROOT = getWatchRoot();

export const initializeFileWatcher = (io: Server) => {
  console.log("Initializing file watcher for:", ROOT);
  console.log("👤 User ID:", process.env.USER_ID || "N/A");
  console.log("📦 Project:", process.env.PROJECT_NAME || "N/A");
  console.log("📁 Workspace Path:", process.env.WORKSPACE_PATH || "N/A");
  
  // Ensure the directory exists before watching

  if (!fs.existsSync(ROOT)) {
    console.log(`Creating watch directory: ${ROOT}`);
    fs.mkdirSync(ROOT, { recursive: true });
  }
  
  const watcher = chokidar.watch(ROOT, {
    persistent: true,
    ignoreInitial: true,
    depth: Infinity,
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100
    },
    // Use polling for EFS - native fs.watch doesn't work well with network filesystems
    usePolling: true,
    interval: 1000, // Poll every 1 second
    binaryInterval: 3000, // Poll binary files every 3 seconds
    alwaysStat: true,
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
    })
    .on("error", (error) => {
      console.error("❌ Watcher error:", error);
    });

  return watcher;
};

