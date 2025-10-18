import type { VehicleDataResponse, ErrorLogRequest, OpenRouterResponse, QueryType } from '../types/chatbot';

const VEHICLE_API_URL = 'https://mapache.gauchoracing.com/api/query/signals?vehicle_id=gr24-main&trip_id=4&signals=mobile_speed&token=01b3939d-678f-44ac-93ff-0d54e09ba3d6';
const BACKEND_URL = 'http://localhost:8080'; // Go backend URL
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// OpenRouter API key - in production, this should be stored securely
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';

export const fetchVehicleData = async (): Promise<VehicleDataResponse> => {
  try {
    const response = await fetch(VEHICLE_API_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Error fetching vehicle data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

export const logError = async (error: string, query: string): Promise<void> => {
  try {
    const errorLog: ErrorLogRequest = {
      error,
      query,
      timestamp: new Date().toISOString()
    };

    await fetch(`${BACKEND_URL}/api/log-error`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorLog),
    });
  } catch (err) {
    console.error('Failed to log error to backend:', err);
  }
};

// Enhanced keyword-based classification
const classifyQueryByKeywords = (query: string): QueryType => {
  const vehicleKeywords = [
    'speed', 'mobile', 'vehicle', 'data', 'average', 'signal', 'telemetry',
    'performance', 'racing', 'car', 'auto', 'mph', 'kmh', 'velocity',
    'acceleration', 'brake', 'throttle', 'rpm', 'engine', 'motor',
    'statistics', 'analysis', 'metrics', 'values', 'measurements'
  ];
  
  const queryLower = query.toLowerCase();
  const hasVehicleKeywords = vehicleKeywords.some(keyword => 
    queryLower.includes(keyword)
  );
  
  return hasVehicleKeywords ? 'vehicle_data' : 'unrelated';
};

export const classifyQuery = async (query: string): Promise<QueryType> => {
  // Always use keyword-based classification as primary method
  // OpenRouter is optional and only used if API key is available and working
  if (!OPENROUTER_API_KEY) {
    console.log('No OpenRouter API key, using keyword-based classification');
    return classifyQueryByKeywords(query);
  }

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Vehicle Data Chatbot'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a query classifier. Classify the user's query as either 'vehicle_data' or 'unrelated'. 
            
            Classify as 'vehicle_data' if the query is about:
            - Vehicle data, speed, mobile speed, signals
            - Averages, statistics, or analysis of vehicle data
            - Any question related to the vehicle's performance or telemetry
            
            Classify as 'unrelated' if the query is about anything else.
            
            Respond with only one word: 'vehicle_data' or 'unrelated'.`
          },
          {
            role: 'user',
            content: query
          }
        ],
        max_tokens: 10,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      // Handle specific error codes
      if (response.status === 402) {
        console.warn('OpenRouter API: Payment required (402). Falling back to keyword classification.');
      } else if (response.status === 401) {
        console.warn('OpenRouter API: Unauthorized (401). Check API key. Falling back to keyword classification.');
      } else {
        console.warn(`OpenRouter API error: ${response.status}. Falling back to keyword classification.`);
      }
      return classifyQueryByKeywords(query);
    }

    const data: OpenRouterResponse = await response.json();
    const classification = data.choices[0]?.message?.content?.trim().toLowerCase();
    
    return classification === 'vehicle_data' ? 'vehicle_data' : 'unrelated';
  } catch (error) {
    console.warn('Error with OpenRouter API, using keyword-based classification:', error);
    return classifyQueryByKeywords(query);
  }
};
