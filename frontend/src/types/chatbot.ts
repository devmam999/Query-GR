export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isLoading?: boolean;
}

export interface VehicleDataResponse {
  success: boolean;
  data?: {
    signals: {
      mobile_speed: number[];
    };
    timestamps: number[];
  };
  error?: string;
}

export interface ErrorLogRequest {
  error: string;
  query: string;
  timestamp: string;
}

export interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export interface ChatbotState {
  messages: Message[];
  isLoading: boolean;
  isDarkMode: boolean;
}

export type QueryType = 'vehicle_data' | 'unrelated';
