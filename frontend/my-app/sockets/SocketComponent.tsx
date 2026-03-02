"use client";

import { useEffect } from "react";
import io from "socket.io-client";
import { useSocketStore, useSessionStore } from "@/store/filestore";
import { terminalService } from "../app/services/terminalService";

const SocketComponent = () => {
  const setSocket = useSocketStore((state) => state.setSocket);
  const sessionId = useSessionStore((state) => state.sessionId);

  useEffect(() => {
    // Only connect if we have a sessionId
    if (!sessionId) {
      console.log("No sessionId available, waiting...");
      return;
    }

    console.log(`Connecting socket with sessionId: ${sessionId}`);

    const socketInstance = io(
      "http://cloud-ide-load-balancer-1345223155.ap-south-1.elb.amazonaws.com:8080",
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

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected");
      terminalService.disposeAll();
    });

    return () => {
      socketInstance.off("backend-response");
      socketInstance.disconnect();
    };
  }, [setSocket, sessionId]);

  return null;
};

export default SocketComponent;