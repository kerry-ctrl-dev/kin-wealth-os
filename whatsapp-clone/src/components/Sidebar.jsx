import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { FaSearch, FaEllipsisV, FaPlus, FaPhone, FaUser } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuthStore();
  const { chats, setChats, selectedChat, setSelectedChat } = useChatStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    // Fetch chats from Firebase
    const mockChats = [
      {
        id: '1',
        name: 'John Doe',
        lastMessage: 'Hey, how are you?',
        timestamp: new Date(Date.now() - 5 * 60000),
        avatar: '👨',
      },
      {
        id: '2',
        name: 'Team Group',
        lastMessage: 'Meeting at 3 PM',
        timestamp: new Date(Date.now() - 30 * 60000),
        avatar: '👥',
      },
    ];
    setChats(mockChats);
  }, [setChats]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully!');
    } catch (err) {
      toast.error('Failed to logout');
    }
  };

  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-96 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Header */}
      <div className="bg-whatsapp-dark text-white p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">WhatsApp</h1>
        <div className="flex gap-2 relative">
          <button className="hover:bg-whatsapp-primary p-2 rounded-full">
            <FaPlus />
          </button>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="hover:bg-whatsapp-primary p-2 rounded-full"
          >
            <FaEllipsisV />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-10 bg-white text-gray-800 rounded-lg shadow-lg w-40 z-10">
              <button
                onClick={() => setActiveTab('profile')}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
              >
                <FaUser /> Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500 font-semibold"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 border-b">
        {['chats', 'calls', 'profile'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 font-semibold transition ${
              activeTab === tab
                ? 'text-whatsapp-primary border-b-2 border-whatsapp-primary'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center bg-gray-100 rounded-full px-3 py-2">
          <FaSearch className="text-gray-500" />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent ml-3 w-full outline-none text-sm"
          />
        </div>
      </div>

      {/* Chats List */}
      {activeTab === 'chats' && (
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {filteredChats.length > 0 ? (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition ${
                  selectedChat?.id === chat.id ? 'bg-gray-100' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{chat.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <h3 className="font-semibold text-gray-900">{chat.name}</h3>
                      <span className="text-xs text-gray-500">
                        {chat.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              No chats found
            </div>
          )}
        </div>
      )}

      {/* Calls Tab */}
      {activeTab === 'calls' && (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <FaPhone className="text-4xl mb-3 mx-auto opacity-50" />
            <p>No recent calls</p>
          </div>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="text-6xl mb-4">👤</div>
            <h3 className="text-lg font-semibold text-gray-800">{user?.displayName}</h3>
            <p className="text-gray-600 text-sm mt-1">{user?.email}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
