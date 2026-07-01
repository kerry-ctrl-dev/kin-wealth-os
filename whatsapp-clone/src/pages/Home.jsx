import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import CallWindow from '../components/CallWindow';
import { connectSocket } from '../services/socket';
import { useChatStore } from '../store/chatStore';
import { useCallStore } from '../store/callStore';

const Home = () => {
  const [activeTab, setActiveTab] = useState('chats');
  const [showCall, setShowCall] = useState(false);
  const selectedChat = useChatStore((state) => state.selectedChat);
  const incomingCall = useCallStore((state) => state.incomingCall);

  useEffect(() => {
    const socket = connectSocket();
    return () => {
      // Cleanup if needed
    };
  }, []);

  if (showCall || incomingCall) {
    return <CallWindow onClose={() => setShowCall(false)} />;
  }

  return (
    <div className="flex h-screen bg-whatsapp-bg2">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      {selectedChat ? (
        <ChatWindow chat={selectedChat} onCall={() => setShowCall(true)} />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-whatsapp-bg to-whatsapp-bg2">
          <div className="text-center">
            <div className="text-6xl mb-4">💬</div>
            <h2 className="text-2xl font-bold text-gray-500">WhatsApp Clone</h2>
            <p className="text-gray-400 mt-2">Select a chat to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
