import React from 'react'
import { useState } from 'react'
import { v4 as uuid } from 'uuid'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router'
import useDataStore from '../utils/store'

const Home = () => {
    const {roomId, setRoomId, username, setUsername} = useDataStore()
    const navigate = useNavigate()

    const handleCreateRoom = (r) => {
        r.preventDefault();
        const newRoomId = uuid()
        setRoomId(newRoomId)

        toast.success('Room created successfully!')
    }
    
    const handleJoin = () => {
        if(!username || !roomId) {
            toast.error('Please enter both Room ID and Username')
            return
        }
        navigate(`/editor/${roomId}`)
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleJoin()
        }
    }

  return (
    <div className='min-h-screen flex flex-col relative bg-gray-50'>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gray-100"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-gray-100"></div>
      </div>

      <div className='flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8'>
        <div className='bg-white p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-md'>
          <h4 className='text-2xl font-semibold text-gray-800 mb-6 text-center'>Join a room</h4>
          <div className='space-y-4'>
            <input 
              type="text" 
              className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 transition-shadow' 
              placeholder='Room ID'
              value={roomId} 
              onChange={(e) => setRoomId(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <input 
              type="text" 
              className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 transition-shadow' 
              placeholder='Username' 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className='mt-6'>
            <button className='w-full bg-gray-800 text-white py-3 px-4 rounded-md hover:bg-gray-700 transition-all transform hover:scale-[1.02]'
            onClick={handleJoin}
            >
              Join
            </button>
          </div>
          <div className='mt-6 text-center'>
            <span className='text-sm text-gray-600'>
              Don't have an invite? then&nbsp;
              <a onClick={handleCreateRoom} className='text-gray-800 font-medium hover:underline'>
                Create one
              </a>
            </span>
          </div>
        </div>
      </div>

      <footer className='w-full py-6 px-4 mt-auto'>
        <div className='max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4'>
          <p className='text-gray-500 text-sm'>
            Made with ❤️ by Sanket 
          </p>
          <div className='text-gray-500 text-sm'>
            source code on&nbsp;
            <a 
              href="https://live-doc-kappa.vercel.app/" 
              className='text-gray-800 hover:underline'
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
