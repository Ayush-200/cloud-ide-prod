import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";

import testRoutes from "./routes/test.routes.js";
import filesRoutes from "./routes/files.routes.js";
import testWatcherRoutes from "./routes/test-watcher.routes.js";
import proxyRoutes from "./routes/proxy.routes.js";
import { registerTerminalSocket } from './sockets/sockets.terminal.js'
import { initializeFileWatcher } from './services/fileWatcherService.js';

const app = express();
const PORT = Number(process.env.PORT) || 8080;

const server = createServer(app);
const io = new Server(server, {
  cors: { 
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
  }
});

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Handle preflight requests explicitly
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test routes for Docker container validation
app.use("/api/test", testRoutes);

// Test routes for chokidar watcher
app.use("/api/watcher", testWatcherRoutes);

// Proxy routes for accessing localhost ports
app.use("/proxy", proxyRoutes);

// File system routes
app.use("/", filesRoutes);

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Initialize file watcher
initializeFileWatcher(io);

io.on("connection", (socket) => {
  const sessionId = socket.handshake.auth.sessionId;

  if (!sessionId) {
    socket.disconnect(true);
    return;
  }

  console.log("Connected session:", sessionId);

  registerTerminalSocket(socket);

  socket.on("disconnect", () => {
  });
});
server.listen(PORT, "0.0.0.0", () => {
  console.log("server running on port", PORT);
});