import React, { useEffect, useRef } from 'react';
import type { Message as MessageType } from '../types/chatbot';
import { Message } from './Message';

interface MessageListProps {
  messages: MessageType[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {messages.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
          <div className="text-4xl mb-4">🚗</div>
          <h3 className="text-lg font-semibold mb-2">Vehicle Data Assistant</h3>
          <p>Ask me about vehicle data, speed averages, or any telemetry information!</p>
          <div className="mt-4 text-sm">
            <p className="mb-1">Try asking:</p>
            <p className="text-blue-500 dark:text-blue-400">"Give me the averages of the mobile speed"</p>
            <p className="text-blue-500 dark:text-blue-400">"What's the vehicle speed data?"</p>
          </div>
        </div>
      ) : (
        messages.map((message) => (
          <Message key={message.id} message={message} />
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};
