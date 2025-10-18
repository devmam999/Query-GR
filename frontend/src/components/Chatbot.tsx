import React, { useState, useRef } from 'react';
import { MessageList } from './MessageList';
import { useTheme } from '../contexts/ThemeContext';
import { fetchVehicleData, logError, classifyQuery } from '../services/api';
import type { Message as MessageType } from '../types/chatbot';

export const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);

  const addMessage = (content: string, sender: 'user' | 'bot', isLoading = false) => {
    const newMessage: MessageType = {
      id: Date.now().toString(),
      content,
      sender,
      timestamp: new Date(),
      isLoading
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const updateMessage = (messageId: string, content: string, isLoading = false) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content, isLoading }
          : msg
      )
    );
  };

  const processVehicleDataQuery = async (query: string) => {
    const loadingMessage = addMessage('', 'bot', true);
    
    try {
      const vehicleData = await fetchVehicleData();
      
      if (vehicleData.success && vehicleData.data) {
        const speedData = vehicleData.data.signals.mobile_speed;
        const average = speedData.reduce((sum, speed) => sum + speed, 0) / speedData.length;
        const max = Math.max(...speedData);
        const min = Math.min(...speedData);
        
        const response = `Here's the mobile speed data analysis:

📊 **Statistics:**
- Average Speed: ${average.toFixed(2)} units
- Maximum Speed: ${max.toFixed(2)} units  
- Minimum Speed: ${min.toFixed(2)} units
- Total Data Points: ${speedData.length}

📈 **Speed Values:**
${speedData.slice(0, 10).map((speed, index) => `${index + 1}. ${speed.toFixed(2)}`).join('\n')}
${speedData.length > 10 ? `... and ${speedData.length - 10} more values` : ''}`;

        updateMessage(loadingMessage.id, response, false);
      } else {
        const errorMsg = "Sorry, I couldn't fetch the data";
        updateMessage(loadingMessage.id, errorMsg, false);
        
        // Log error to backend
        await logError(vehicleData.error || 'Unknown error', query);
      }
    } catch (error) {
      const errorMsg = "Sorry, I couldn't fetch the data";
      updateMessage(loadingMessage.id, errorMsg, false);
      
      // Log error to backend
      await logError(error instanceof Error ? error.message : 'Unknown error', query);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const query = inputValue.trim();
    setInputValue('');
    addMessage(query, 'user');
    setIsLoading(true);

    try {
      const queryType = await classifyQuery(query);
      
      if (queryType === 'vehicle_data') {
        await processVehicleDataQuery(query);
      } else {
        addMessage("Sorry, I can't help you with that. I can only assist with vehicle data queries.", 'bot');
      }
    } catch (error) {
      console.error('Error processing query:', error);
      addMessage("Sorry, I encountered an error processing your request.", 'bot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={`flex flex-col h-screen ${isDarkMode ? 'dark' : ''}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🚗</div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
                Vehicle Data Assistant
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ask me about vehicle telemetry and speed data
              </p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            aria-label="Toggle theme"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={messages} />

      {/* Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about vehicle data..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};
