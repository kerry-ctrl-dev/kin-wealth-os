import { create } from 'zustand';

export const useChatStore = create((set) => ({
  chats: [],
  selectedChat: null,
  messages: {},
  typing: {},
  loading: false,
  error: null,

  setChats: (chats) => set({ chats }),
  setSelectedChat: (chat) => set({ selectedChat: chat }),
  setMessages: (chatId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [chatId]: messages },
    })),
  addMessage: (chatId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: [...(state.messages[chatId] || []), message],
      },
    })),
  setTyping: (chatId, userId, isTyping) =>
    set((state) => ({
      typing: {
        ...state.typing,
        [chatId]: { ...state.typing[chatId], [userId]: isTyping },
      },
    })),
}));
