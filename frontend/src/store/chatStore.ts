import { create } from 'zustand';
import { useAuthStore } from './authStore';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

interface ChatState {
  messages: Message[];
  currentConversationId: string | null;
  loading: boolean;
  error: string | null;
  streaming: boolean;
  
  // Actions
  sendMessage: (content: string) => Promise<void>;
  sendMessageStream: (content: string) => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
  createNewConversation: () => Promise<void>;
  clearMessages: () => void;
  setError: (error: string | null) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  currentConversationId: null,
  loading: false,
  error: null,
  streaming: false,

  sendMessage: async (content: string) => {
    try {
      set({ loading: true, error: null });
      
      const { user, session } = useAuthStore.getState();
      
      if (!user || !session) {
        set({ error: '로그인이 필요합니다.', loading: false });
        return;
      }

      // 사용자 메시지 추가
      const userMessage: Message = {
        id: Date.now().toString(),
        content,
        role: 'user',
        timestamp: new Date().toISOString()
      };

      set(state => ({
        messages: [...state.messages, userMessage]
      }));

      // 새 대화 생성 (필요한 경우)
      let conversationId = get().currentConversationId;
      if (!conversationId) {
        try {
          const response = await fetch(`${API_URL}/api/conversations`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({})
          });

          if (!response.ok) {
            throw new Error('새 대화 생성에 실패했습니다.');
          }

          const data = await response.json();
          conversationId = data.id;
          set({ currentConversationId: conversationId });
        } catch (error) {
          console.error('대화 생성 오류:', error);
          set({ error: '새 대화 생성에 실패했습니다.', loading: false });
          return;
        }
      }

      // 메시지 저장
      try {
        const response = await fetch(`${API_URL}/api/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            conversation_id: conversationId,
            content,
            role: 'user'
          })
        });

        if (!response.ok) {
          throw new Error('메시지 저장에 실패했습니다.');
        }
      } catch (error) {
        console.error('메시지 저장 오류:', error);
      }

      // AI 응답 요청
      try {
        const response = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            message: content,
            conversationHistory: get().messages
          })
        });

        if (!response.ok) {
          throw new Error('AI 응답 요청에 실패했습니다.');
        }

        const data = await response.json();
        
        // AI 응답 메시지 추가
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response,
          role: 'assistant',
          timestamp: new Date().toISOString()
        };

        set(state => ({
          messages: [...state.messages, aiMessage],
          loading: false
        }));

        // AI 응답 저장
        try {
          await fetch(`${API_URL}/api/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              conversation_id: conversationId,
              content: data.response,
              role: 'assistant'
            })
          });
        } catch (error) {
          console.error('AI 응답 저장 오류:', error);
        }

      } catch (error) {
        console.error('AI 응답 오류:', error);
        set({ error: 'AI 응답을 받을 수 없습니다.', loading: false });
      }

    } catch (error) {
      console.error('메시지 전송 오류:', error);
      set({ error: '메시지 전송에 실패했습니다.', loading: false });
    }
  },

  sendMessageStream: async (content: string) => {
    try {
      set({ loading: true, error: null, streaming: true });
      
      const { user, session } = useAuthStore.getState();
      
      if (!user || !session) {
        set({ error: '로그인이 필요합니다.', loading: false, streaming: false });
        return;
      }

      // 사용자 메시지 추가
      const userMessage: Message = {
        id: Date.now().toString(),
        content,
        role: 'user',
        timestamp: new Date().toISOString()
      };

      set(state => ({
        messages: [...state.messages, userMessage]
      }));

      // 새 대화 생성 (필요한 경우)
      let conversationId = get().currentConversationId;
      if (!conversationId) {
        try {
          const response = await fetch(`${API_URL}/api/conversations`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({})
          });

          if (!response.ok) {
            throw new Error('새 대화 생성에 실패했습니다.');
          }

          const data = await response.json();
          conversationId = data.id;
          set({ currentConversationId: conversationId });
        } catch (error) {
          console.error('대화 생성 오류:', error);
          set({ error: '새 대화 생성에 실패했습니다.', loading: false, streaming: false });
          return;
        }
      }

      // 메시지 저장
      try {
        const response = await fetch(`${API_URL}/api/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            conversation_id: conversationId,
            content,
            role: 'user'
          })
        });

        if (!response.ok) {
          throw new Error('메시지 저장에 실패했습니다.');
        }
      } catch (error) {
        console.error('메시지 저장 오류:', error);
      }

      // 스트리밍 AI 응답 요청
      try {
        const response = await fetch(`${API_URL}/api/chat/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            message: content,
            conversationHistory: get().messages
          })
        });

        if (!response.ok) {
          throw new Error('스트리밍 응답 요청에 실패했습니다.');
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('스트리밍 응답을 읽을 수 없습니다.');
        }

        // AI 응답 메시지 초기화
        const aiMessageId = (Date.now() + 1).toString();
        const aiMessage: Message = {
          id: aiMessageId,
          content: '',
          role: 'assistant',
          timestamp: new Date().toISOString()
        };

        set(state => ({
          messages: [...state.messages, aiMessage]
        }));

        let fullResponse = '';

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.content) {
                  fullResponse += data.content;
                  
                  // 실시간으로 메시지 업데이트
                  set(state => ({
                    messages: state.messages.map(msg => 
                      msg.id === aiMessageId 
                        ? { ...msg, content: fullResponse }
                        : msg
                    )
                  }));
                }

                if (data.done) {
                  set({ loading: false, streaming: false });
                  
                  // AI 응답 저장
                  try {
                    await fetch(`${API_URL}/api/messages`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                      },
                      body: JSON.stringify({
                        conversation_id: conversationId,
                        content: fullResponse,
                        role: 'assistant'
                      })
                    });
                  } catch (error) {
                    console.error('AI 응답 저장 오류:', error);
                  }
                  
                  return;
                }
              } catch (error) {
                console.error('스트리밍 데이터 파싱 오류:', error);
              }
            }
          }
        }

      } catch (error) {
        console.error('스트리밍 응답 오류:', error);
        set({ error: '스트리밍 응답을 받을 수 없습니다.', loading: false, streaming: false });
      }

    } catch (error) {
      console.error('스트리밍 메시지 전송 오류:', error);
      set({ error: '메시지 전송에 실패했습니다.', loading: false, streaming: false });
    }
  },

  loadConversation: async (conversationId: string) => {
    try {
      set({ loading: true, error: null });
      
      const { session } = useAuthStore.getState();
      
      if (!session) {
        set({ error: '로그인이 필요합니다.', loading: false });
        return;
      }

      const response = await fetch(`${API_URL}/api/conversations/${conversationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('대화 기록을 불러올 수 없습니다.');
      }

      const data = await response.json();
      
      set({
        messages: data.messages || [],
        currentConversationId: conversationId,
        loading: false
      });

    } catch (error) {
      console.error('대화 로드 오류:', error);
      set({ error: '대화 기록을 불러올 수 없습니다.', loading: false });
    }
  },

  createNewConversation: async () => {
    try {
      set({ loading: true, error: null });
      
      const { session } = useAuthStore.getState();
      
      if (!session) {
        set({ error: '로그인이 필요합니다.', loading: false });
        return;
      }

      const response = await fetch(`${API_URL}/api/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error('새 대화 생성에 실패했습니다.');
      }

      const data = await response.json();
      
      set({
        messages: [],
        currentConversationId: data.id,
        loading: false
      });

    } catch (error) {
      console.error('대화 생성 오류:', error);
      set({ error: '새 대화 생성에 실패했습니다.', loading: false });
    }
  },

  clearMessages: () => {
    set({ messages: [], currentConversationId: null });
  },

  setError: (error: string | null) => {
    set({ error });
  }
}));
