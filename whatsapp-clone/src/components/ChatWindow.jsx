import React, { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { FaPhone, FaVideo, FaSearch, FaEllipsisV, FaPaperclip, FaSmile, FaPaperPlane } from 'react-icons/fa';
import toast from 'react-hot-toast';

const ChatWindow = ({ chat, onCall }) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const { user } = useAuthStore();
  const { messages, addMessage } = useChatStore();
  const chatMessages = messages[chat.id] || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: Date.now(),
        text: message,
        sender: user.uid,
        senderName: user.displayName,
        timestamp: new Date(),
      };
      addMessage(chat.id, newMessage);
      setMessage('');
      toast.success('Message sent!');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="bg-whatsapp-dark text-white p-4 flex items-center justify-between shadow">
        <div>
          <h2 className="font-bold text-lg">{chat.name}</h2>
          <p className="text-xs text-gray-300">Last seen 2 hours ago</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={onCall}
            className="hover:bg-whatsapp-primary p-2 rounded-full transition"
          >
            <FaPhone />
          </button>
          <button className="hover:bg-whatsapp-primary p-2 rounded-full transition">
            <FaVideo />
          </button>
          <button className="hover:bg-whatsapp-primary p-2 rounded-full transition">
            <FaSearch />
          </button>
          <button className="hover:bg-whatsapp-primary p-2 rounded-full transition">
            <FaEllipsisV />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide bg-gradient-to-b from-gray-50 to-white">
        {chatMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === user.uid ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.sender === user.uid
                    ? 'bg-whatsapp-light text-gray-900 rounded-br-none'
                    : 'bg-gray-200 text-gray-900 rounded-bl-none'
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <p className="text-xs mt-1 opacity-70">
                  {msg.timestamp?.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex items-center gap-3">
          <button className="text-whatsapp-primary hover:bg-gray-100 p-2 rounded-full transition">
            <FaPaperclip />
          </button>
          <button className="text-whatsapp-primary hover:bg-gray-100 p-2 rounded-full transition">
            <FaSmile />
          </button>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full outline-none focus:border-whatsapp-primary transition"
          />
          <button
            onClick={handleSendMessage}
            className="text-whatsapp-primary hover:bg-gray-100 p-2 rounded-full transition"
          >
            <FaPaperPlane />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
