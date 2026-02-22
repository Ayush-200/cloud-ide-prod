import express from 'express';
import cors from 'cors';
import { router as containerRouter } from './routes/container.routes'; 
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import pty from 'node-pty';
const app = express();
const PORT = process.env.PORT || 3000;
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

const shell = pty.spawn('bash', [], {
    name: 'xterm-color', 
    cols: 80, 
    rows: 24, 
    cwd: process.env.WORKSPACE_DIR || '/workspace'
});

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', 
    methods: ['GET', 'POST']
}));

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('frontend-response', (message) => {
        console.log("message received", message);
        shell.write(message);

    })

    shell.onData((data) => {
        console.log("data received from backend", data);
        socket.emit('backend-response', data);
    })

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
})

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.get('/container', containerRouter);


server.listen(PORT, () => {
    console.log("server is running on port ", PORT);
})