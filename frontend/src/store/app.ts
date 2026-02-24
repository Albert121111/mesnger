import { create } from 'zustand';

type State = {
  activeChatId?: string;
  replyTo?: any;
  editMessage?: any;
  profileOpen: boolean;
  settingsOpen: boolean;
  set: (v: Partial<State>) => void;
};
export const useAppStore = create<State>((set) => ({ profileOpen: false, settingsOpen: false, set: (v) => set(v) } as State));
