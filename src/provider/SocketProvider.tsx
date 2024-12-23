"use client";
import React, { createContext, ReactNode, useContext, useMemo } from "react";
import { io, Socket } from "socket.io-client";

type SocketContextType = Socket | null;
interface SocketProviderProps {
  children: ReactNode;
}

const SocketContext = createContext<SocketContextType>(null);

export const useSocket = () => {
  const socket = useContext(SocketContext);
  return socket;
};

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const socket = useMemo(() => io(process.env.NEXT_PUBLIC_SERVER_URL), []);
  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
