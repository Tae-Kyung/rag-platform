import { create } from 'zustand';

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: { title: string; url?: string }[];
  createdAt: Date;
}

interface ChatState {
  messages: ChatMessageItem[];
  conversationId: string | null;
  isLoading: boolean;
  language: string;
  addMessage: (role: 'user' | 'assistant', content: string) => void;
  updateLastAssistantMessage: (content: string) => void;
  setConversationId: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setLanguage: (lang: string) => void;
  resetChat: () => void;
}

let msgCounter = 0;

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  conversationId: null,
  isLoading: false,
  language: 'en',

  addMessage: (role, content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: `msg-${++msgCounter}`,
          role,
          content,
          createdAt: new Date(),
        },
      ],
    })),

  updateLastAssistantMessage: (content) =>
    set((state) => {
      const msgs = [...state.messages];
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === 'assistant') {
          msgs[i] = { ...msgs[i], content };
          break;
        }
      }
      return { messages: msgs };
    }),

  setConversationId: (id) => set({ conversationId: id }),
  setLoading: (loading) => set({ isLoading: loading }),
  setLanguage: (lang) => set({ language: lang }),

  resetChat: () =>
    set({
      messages: [],
      conversationId: null,
      isLoading: false,
    }),
}));
