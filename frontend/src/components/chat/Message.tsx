import React from 'react';
import type { Message as MessageType } from '../../store/chatStore';

interface MessageProps {
  message: MessageType;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const timestamp = new Date(message.timestamp).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in`}>
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        <div
          className={`px-4 py-3 rounded-2xl shadow-soft ${
            isUser
              ? 'bg-primary-600 text-white rounded-br-md'
              : 'bg-white text-neutral-800 border border-neutral-200 rounded-bl-md'
          }`}
        >
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
        </div>
        
        {/* 타임스탬프 */}
        <div className={`text-xs text-neutral-400 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {timestamp}
        </div>
      </div>
      
      {/* 아바타 */}
      <div className={`flex-shrink-0 mx-2 ${isUser ? 'order-1' : 'order-2'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-primary-600 text-white' 
            : 'bg-primary-100 text-primary-600'
        }`}>
          {isUser ? (
            <span className="text-sm font-medium">
              {message.content.charAt(0).toUpperCase()}
            </span>
          ) : (
            <span className="text-sm">💬</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
