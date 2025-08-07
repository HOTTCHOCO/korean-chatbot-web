import React, { useEffect, useRef } from 'react';
import { Message } from './Message';
import type { Message as MessageType } from '../../types/chat';

interface MessageListProps {
  messages: MessageType[];
  loading?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, loading = false }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 && !loading && (
        <div className="text-center text-gray-500 mt-8">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-lg font-medium mb-2">새로운 대화를 시작해보세요!</h3>
          <p className="text-sm">
            한국어 학습에 관한 질문을 자유롭게 해주세요.
          </p>
        </div>
      )}
      
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
      
      {loading && (
        <div className="flex justify-start mb-4">
          <div className="bg-gray-200 text-gray-800 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm text-gray-600">생각 중...</span>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};
