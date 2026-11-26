# WhatsApp Clone

A full-featured real-time messaging application built with React, Firebase, and Socket.io.

## Features

- **Real-time Messaging**: Send and receive messages instantly
- **Group Chats**: Create and manage group conversations
- **Video & Audio Calls**: Make peer-to-peer calls using PeerJS
- **User Profiles**: Manage user information and settings
- **Typing Indicators**: See when users are typing
- **Call History**: Track your call history
- **Responsive Design**: Works on desktop and mobile
- **Firebase Integration**: Secure authentication and data storage

## Tech Stack

**Frontend:**
- React 18
- React Router v6
- Zustand (State Management)
- Tailwind CSS
- React Icons
- Socket.io Client
- Firebase SDK
- PeerJS (WebRTC)

**Backend:**
- Node.js
- Express.js
- Socket.io
- CORS

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- npm or yarn
- Firebase Account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/whatsapp-clone.git
   cd whatsapp-clone
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Setup Firebase**
   - Create a Firebase project at [https://firebase.google.com](https://firebase.google.com)
   - Get your Firebase config
   - Create `.env.local` file in the root directory:
   ```
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   REACT_APP_SERVER_URL=http://localhost:5000
   ```

4. **Install backend dependencies**
   ```bash
   cd server
   npm install
   cp .env.example .env
   ```
   Set `FIREBASE_WEB_API_KEY` to this Firebase project's Web API key and `CLIENT_URL` to the exact frontend origin. The server verifies Firebase ID tokens before accepting sockets; the Web API key is public app configuration, not a private service key.

5. **Run the application**

   **Terminal 1 - Frontend:**
   ```bash
   npm start
   ```

   **Terminal 2 - Backend:**
   ```bash
   cd server
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## Project Structure

```
whatsapp-clone/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx
│   │   ├── ChatWindow.jsx
│   │   ├── CallWindow.jsx
│   │   └── PrivateRoute.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   └── Home.jsx
│   ├── services/
│   │   ├── firebase.js
│   │   └── socket.js
│   ├── store/
│   │   ├── authStore.js
│   │   ├── chatStore.js
│   │   └── callStore.js
│   ├── App.jsx
│   ├── App.css
│   ├── index.js
│   └── index.css
├── server/
│   ├── index.js
│   └── package.json
├── package.json
├── tailwind.config.js
└── README.md
```

## Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Start Messaging**: Click on a chat or create a new one
3. **Make Calls**: Click the phone icon to initiate a call
4. **View Profile**: Check user profile in the sidebar

## Features Details

### Authentication
- Firebase Authentication
- Email/Password login and registration
- Secure session management

### Real-time Communication
- Socket.io for instant message delivery
- Typing indicators
- Online/Offline status

### Voice & Video Calls
- WebRTC implementation via PeerJS
- High-quality audio/video
- Call history tracking

### State Management
- Zustand for global state
- Separate stores for auth, chat, and calls

## API Endpoints

### GET `/api/health`
Check server status

### GET `/api/users`
Get list of active users

## Socket Events

Socket connections require a valid Firebase ID token and an allowed browser origin. The server assigns sender identity from the verified Firebase account; client-supplied identity fields are ignored.

### Client → Server
- `send_message`: Send a message
- `typing`: User is typing
- `call_user`: Initiate a call
- `answer_call`: Accept a call

### Server → Client
- `user_online`: User comes online
- `user_offline`: User goes offline
- `receive_message`: Receive a message
- `user_typing`: User is typing
- `incoming_call`: Incoming call notification
- `call_answered`: Call accepted

## Future Enhancements

- [ ] End-to-end encryption
- [ ] File sharing
- [ ] Media gallery
- [ ] Status updates
- [ ] Message reactions
- [ ] Dark mode
- [ ] Push notifications
- [ ] Database persistence

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Support

For support, email support@whatsappclone.com or open an issue on GitHub.
