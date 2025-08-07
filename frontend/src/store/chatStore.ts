import { create } from 'zustand';
import type { Message, ChatState } from '../types/chat';
import { useAuthStore } from './authStore';

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  currentConversationId: null,
  loading: false,
  error: null,

  addMessage: (message) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(), // 임시 ID
      created_at: new Date().toISOString(),
    };
    
    set((state) => ({
      messages: [...state.messages, newMessage],
    }));
  },

  setMessages: (messages) => set({ messages }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setCurrentConversationId: (conversationId) => set({ currentConversationId: conversationId }),

  sendMessage: async (content: string) => {
    const { user } = useAuthStore.getState();
    
    if (!user) {
      set({ error: '로그인이 필요합니다.' });
      return;
    }

    try {
      set({ loading: true, error: null });

      // 사용자 메시지 추가
      const userMessage: Omit<Message, 'id' | 'created_at'> = {
        conversation_id: get().currentConversationId || 'temp',
        user_id: user.id,
        role: 'user',
        content,
      };
      
      get().addMessage(userMessage);

      // AI 응답 시뮬레이션 (임시)
      setTimeout(() => {
        const aiMessage: Omit<Message, 'id' | 'created_at'> = {
          conversation_id: get().currentConversationId || 'temp',
          user_id: 'ai-assistant',
          role: 'assistant',
          content: `안녕하세요! "${content}"에 대한 답변을 드리겠습니다. 이는 임시 응답이며, 실제 OpenAI API 연동 시 실제 답변이 표시됩니다.`,
        };
        
        get().addMessage(aiMessage);
        set({ loading: false });
      }, 2000);

    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '메시지 전송 중 오류가 발생했습니다.',
        loading: false 
      });
    }
  },

  loadConversation: async (conversationId: string) => {
    try {
      set({ loading: true, error: null });
      
      // 임시 데이터 (실제로는 API 호출)
      const mockMessages: Message[] = [
        {
          id: '1',
          conversation_id: conversationId,
          user_id: 'user',
          role: 'user',
          content: '안녕하세요!',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          conversation_id: conversationId,
          user_id: 'ai-assistant',
          role: 'assistant',
          content: '안녕하세요! 한국어 학습을 도와드릴게요. 무엇을 도와드릴까요?',
          created_at: new Date().toISOString(),
        },
      ];

      set({ 
        messages: mockMessages,
        currentConversationId: conversationId,
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '대화 로드 중 오류가 발생했습니다.',
        loading: false 
      });
    }
  },

  createNewConversation: async () => {
    try {
      set({ loading: true, error: null });
      
      // 임시로 새 대화 ID 생성
      const newConversationId = `conv_${Date.now()}`;
      
      set({ 
        messages: [],
        currentConversationId: newConversationId,
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '새 대화 생성 중 오류가 발생했습니다.',
        loading: false 
      });
    }
  },
}));
