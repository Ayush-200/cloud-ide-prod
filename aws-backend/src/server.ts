import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import * as pty from "node-pty";
import testRoutes from "./routes/test.routes.js";

const app = express();
const PORT = Number(process.env.PORT) || 8080;

const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test routes for Docker container validation
app.use("/api/test", testRoutes);

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});
io.on("connection", (socket) => {
  const sessionId = socket.handshake.auth.sessionId;

  if (!sessionId) {
    socket.disconnect(true);
    return;
  }

  console.log("Connected session:", sessionId);

  const shell = pty.spawn("bash", [], {
    name: "xterm-color",
    cols: 80,
    rows: 24,
    cwd: process.env.WORKSPACE_DIR || "/workspace"
  });

  socket.on("frontend-response", (message) => {
    shell.write(message);
  });

  shell.onData((data) => {
    socket.emit("backend-response", data);
  });

  socket.on("disconnect", () => {
    shell.kill();
  });
});
server.listen(PORT, "0.0.0.0", () => {
  console.log("server running on port", PORT);
});