import React, { useState } from 'react';
import { useChatStore } from '../../store/chatStore';

const ChatInput: React.FC = () => {
  const [message, setMessage] = useState('');
  const { sendMessageStream, loading, streaming } = useChatStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || loading || streaming) return;

    const trimmedMessage = message.trim();
    setMessage('');
    await sendMessageStream(trimmedMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          {/* 입력 필드 */}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="한국어에 대해 궁금한 점을 물어보세요..."
            disabled={loading || streaming}
            className="w-full px-4 py-3 pr-12 border border-neutral-300 rounded-xl bg-white text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            rows={1}
            style={{
              minHeight: '48px',
              maxHeight: '120px'
            }}
          />
          
          {/* 전송 버튼 */}
          <button
            type="submit"
            disabled={!message.trim() || loading || streaming}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors duration-200 shadow-soft"
          >
            {loading || streaming ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        
        {/* 도움말 텍스트 */}
        <div className="mt-2 text-xs text-neutral-500 text-center">
          Enter로 전송, Shift+Enter로 줄바꿈
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
