"use client";

import { useEffect } from 'react';
import io from 'socket.io-client';
import { useSocketStore } from '@/store/filestore';

const SocketComponent = () => {
    const setSocket = useSocketStore((state) => state.setSocket);
    
    useEffect(() => { 
       const socketInstance = io(
  "http://cloud-ide-load-balancer-1345223155.ap-south-1.elb.amazonaws.com:8080",
  {
    transports: ["websocket"],
    auth: {
      sessionId: "12345"
    }
  }
);
        setSocket(socketInstance);
        
        socketInstance.on('connect', () => {
            console.log("socket connected successfully");
        });

        socketInstance.on('disconnect', () => {
            console.log("socket disconnected successfully");
        });

        return () => {
            socketInstance.disconnect();
        };
    }, [setSocket]);

    return null;
};

export default SocketComponent;