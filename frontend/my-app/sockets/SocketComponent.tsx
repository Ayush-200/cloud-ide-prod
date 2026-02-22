"use  client"
import { useEffect } from 'react';
import io from 'socket.io-client';
import { useSocketStore } from '@/store/filestore';


const SocketComponent = () =>  {
    const setSocket = useSocketStore((state) => state.setSocket);
    useEffect(() => { 
        const socketInstance = io(`${process.env.APP_URL}`);
        setSocket(socketInstance);
        socketInstance.on('connection', () => {
            console.log("socket connected successfully");
        })

        socketInstance.on('disconnect', () => {
            console.log("socket disconnected sucessfully");
        })
    })
}

export default SocketComponent;