import { create } from 'zustand';

export const useCallStore = create((set) => ({
  activeCall: null,
  callHistory: [],
  incomingCall: null,

  setActiveCall: (call) => set({ activeCall: call }),
  setIncomingCall: (call) => set({ incomingCall: call }),
  addToCallHistory: (call) =>
    set((state) => ({
      callHistory: [call, ...state.callHistory],
    })),
  clearCallHistory: () => set({ callHistory: [] }),
}));
