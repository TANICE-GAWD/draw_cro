import React from 'react'
import Avatar from 'react-avatar'

const Client = ({ username }) => {
    return (
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
            <Avatar 
                name={username}
                size={32}
                round="8px"
                textSizeRatio={2}
            />
            <span className="text-sm font-medium text-gray-700">
                {username}
            </span>
        </div>
    )
}

export default Client