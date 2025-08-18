import { io } from "socket.io-client";

const BASE_URL = import.meta.env.VITE_NODE_URL 

export const initSocket = async () => {
        const options = {
        reconnectionAttempts: 'infinity',
        timeout: 10000,
        transports: ['websocket'],
    }

    return io("https://server-production-e5c5.up.railway.app", options)
}