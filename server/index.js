import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import http from 'http';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    }
});

const PORT = process.env.PORT

app.use(cors());

const userSocketMap = {}
const getAllConnectedClients = async (roomId) => {

    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => {
        return {
            socketId,
            username : userSocketMap[socketId]
        }
    })

}; 

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join-room', async ({ roomId, username }) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);
        const clients = await getAllConnectedClients(roomId);
        console.log(clients);
        
        clients.forEach(({socketId}) => {
            io.to(socketId).emit('joined', { clients, username, socketId : socket.id });
        })
        
    })

    socket.on('disconnecting' , () => {
        const rooms = [...socket.rooms]
        rooms.forEach((roomId) => {
            socket.in(roomId).emit('disconnected', {
                socketId: socket.id,
                username: userSocketMap[socket.id]
            })
        })
        delete userSocketMap[socket.id]
        socket.leave()
    })
})

io.on('disconnect', (socket) => {
    console.log('A user disconnected:', socket.id);
});

server.listen(PORT, () => {
    console.log('Server is running on port ', PORT);
})