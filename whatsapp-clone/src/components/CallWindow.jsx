import React, { useEffect, useState } from 'react';
import Peer from 'peerjs';
import { useCallStore } from '../store/callStore';
import { FaPhone, FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash } from 'react-icons/fa';
import toast from 'react-hot-toast';

const CallWindow = ({ onClose }) => {
  const [peer, setPeer] = useState(null);
  const [callActive, setCallActive] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const { addToCallHistory } = useCallStore();

  useEffect(() => {
    // Initialize PeerJS
    const newPeer = new Peer();
    setPeer(newPeer);

    return () => {
      newPeer.destroy();
    };
  }, []);

  useEffect(() => {
    if (!callActive) return;

    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [callActive]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    setCallActive(false);
    addToCallHistory({
      id: Date.now(),
      name: 'John Doe',
      duration: callDuration,
      type: 'outgoing',
      timestamp: new Date(),
    });
    toast.success('Call ended');
    setTimeout(onClose, 500);
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black">
        {/* Video Area */}
        <div className="flex-1 w-full flex items-center justify-center">
          <div className="text-center">
            <div className="text-8xl mb-6 animate-pulse">📞</div>
            <h2 className="text-3xl font-bold text-white mb-2">John Doe</h2>
            <p className="text-gray-300 text-lg">{formatDuration(callDuration)}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 bg-opacity-50 p-8 rounded-full flex gap-6 mb-12">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-4 rounded-full transition ${
              isMuted
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-green-500 hover:bg-green-600'
            } text-white`}
          >
            {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
          </button>
          <button
            onClick={() => setIsVideoOn(!isVideoOn)}
            className={`p-4 rounded-full transition ${
              isVideoOn ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
            } text-white`}
          >
            {isVideoOn ? <FaVideo /> : <FaVideoSlash />}
          </button>
          <button
            onClick={handleEndCall}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition"
          >
            <FaPhone />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallWindow;
