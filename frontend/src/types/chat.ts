export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  created_at: string;
  messages?: Message[];
}

export interface ChatState {
  messages: Message[];
  currentConversationId: string | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  addMessage: (message: Omit<Message, 'id' | 'created_at'>) => void;
  setMessages: (messages: Message[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentConversationId: (conversationId: string | null) => void;
  
  // API calls
  sendMessage: (content: string) => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
  createNewConversation: () => Promise<void>;
}
