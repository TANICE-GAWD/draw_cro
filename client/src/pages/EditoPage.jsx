import { useState, useEffect, useRef } from "react"
import Client from "../components/Client"
import Editor from '../components/Editor'
import { Button } from '@mui/material';
import { DocumentTextIcon } from '@heroicons/react/24/solid'
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast";
import useDataStore from '../utils/store'
import { initSocket } from "../lib/socket"


const EditoPage = () => {
    const {roomId, username} = useDataStore()
    const socketRef = useRef(null)
    const [connectionStatus, setConnectionStatus] = useState("Connecting...")
    const navigate = useNavigate()
    const [clients, setClients] = useState([])

    useEffect(() => {
        const init = async () => {
            if (socketRef.current) return;

            socketRef.current = await initSocket();

            socketRef.current.on('connect_error', (err) => {
                console.error('Socket connection error:', err);
                toast.error('Could not connect to the room.');
                navigate('/');
            });

            socketRef.current.on('connect', () => {
                setConnectionStatus("Connected")
                toast.success("Connected to the room!")
                // socketRef.current.emit('join-room', { roomId, username })
            });
            
            socketRef.current.emit('join-room',{
                roomId,
                username
            })

            socketRef.current.on('joined', ({clients : updatedClients, username : joinedUsername}) => {
                if(username !== joinedUsername) {
                    toast.success(`${joinedUsername} joined the room.`)
                }
                console.log('Clients in room:', updatedClients);

                setClients(updatedClients)
            })

            socketRef.current.on('disconnected', ({ socketId, username: disconnectedUsername }) => {
                toast(`${disconnectedUsername} is disconnected`, {
                    icon: '👋',
                    autoClose: 10
                })
                setClients((prev) => {
                    return prev.filter(client => client.socketId !== socketId)
                });
            });
        };

        init();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current.off('connect_error');
                socketRef.current.off('connect');
                socketRef.current.off('join-room');
                socketRef.current.off('joined');
                socketRef.current.off('disconnected');
            }
        };
    }, []);

    const handleCopyRoomId = () => {
        navigator.clipboard.writeText(roomId)
        toast.success("Room ID copied to clipboard!")
    
    }

    const handleLeaveRoom = () => {
        setConnectionStatus("You have left the room.")
        setClients([])
        navigate("/")
    }
  
    return (
        <div className="flex h-screen">
            <div className="w-64 bg-white h-full shadow-lg rounded-r-3xl">
                <div className="flex flex-col h-full p-6">
                    <div className="flex items-center gap-3 mb-8">
                        <DocumentTextIcon className="w-8 h-8 text-gray-900" />
                        <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">
                            Live-Doc
                        </h1>
                    </div>

                    <div className="mb-8 pl-2">
                        <span className="text-xl font-medium text-gray-800">
                            {username}
                        </span>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-600">
                            Status: <span className="text-green-500">{connectionStatus}</span>
                        </h3>
                    </div>

                    <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-600 mb-4">Connected Users</h3>
                        <div className="space-y-2">
                            {clients?.map((client) => (
                                <Client key={client.socketId} username={client.username} />
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6 mb-6 mt-8">
                        <Button 
                            variant="contained" 
                            className="w-full mb-2 !bg-gray-700 !normal-case !py-3"
                            onClick={handleCopyRoomId}
                        >
                            Copy Room ID
                        </Button>
                    </div>
                    <div className="mb-3" >
                        <Button 
                            variant="contained" 
                            color="error" 
                            className="w-full !normal-case !py-3 "
                            onClick={handleLeaveRoom}
                        >
                            Leave Room
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-gray-50">
                <Editor roomId={roomId} />
            </div>
        </div>
    )
}

export default EditoPage