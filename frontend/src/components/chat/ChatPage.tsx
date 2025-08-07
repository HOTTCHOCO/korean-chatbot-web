import React, { useEffect, useRef } from 'react';
import { useChatStore } from '../../store/chatStore';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

const ChatPage: React.FC = () => {
  const { messages, loading, error, streaming } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-neutral-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-neutral-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-primary-800">
            UNNI chat
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            한국어 학습을 도와드리는 따뜻한 AI 친구
          </p>
        </div>
      </div>

      {/* 채팅 영역 */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          {/* 메시지 목록 */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl text-primary-600">💬</span>
                </div>
                <h3 className="text-lg font-semibold text-neutral-800 mb-2">
                  안녕하세요! UNNI chat입니다
                </h3>
                <p className="text-neutral-600 max-w-md">
                  한국어에 대해 궁금한 점이 있으시면 언제든 물어보세요. 
                  친근하고 따뜻한 대화로 함께 배워봐요!
                </p>
                <div className="mt-6 space-y-2">
                  <div className="text-sm text-neutral-500">
                    💡 이런 질문들을 해보세요:
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {[
                      "안녕하세요",
                      "한국어 문법 알려주세요",
                      "일상 대화 표현",
                      "문화 차이점"
                    ].map((suggestion, index) => (
                      <button
                        key={index}
                        className="px-3 py-1 bg-primary-100 text-primary-700 text-xs rounded-full hover:bg-primary-200 transition-colors duration-200"
                        onClick={() => {
                          // TODO: 제안 클릭 시 자동 입력
                        }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <MessageList messages={messages} />
            )}
            
            {/* 로딩 인디케이터 */}
            {(loading || streaming) && (
              <div className="flex items-center space-x-2 p-4">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse-soft"></div>
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse-soft" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse-soft" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-neutral-500">
                  {streaming ? '답변을 생성하고 있어요...' : '잠시만 기다려주세요...'}
                </span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-red-500">⚠️</span>
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* 입력 영역 */}
          <div className="border-t border-neutral-200 bg-white p-6">
            <ChatInput />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
