# Vehicle Data Chatbot

A React + TypeScript chatbot application that provides intelligent vehicle data analysis through a modern web interface. The chatbot can process vehicle telemetry queries, fetch real-time data from racing APIs, and provide statistical analysis with a beautiful light/dark mode interface.

## 🚀 Features

- **Intelligent Query Processing**: Uses OpenRouter AI to classify and process vehicle data queries
- **Real-time Data Fetching**: Fetches live vehicle data from racing telemetry APIs
- **Light/Dark Mode**: Toggle between light and dark themes with persistent preferences
- **Error Handling**: Comprehensive error logging and user-friendly error messages
- **Responsive Design**: Modern UI built with Tailwind CSS
- **TypeScript**: Full type safety and excellent developer experience
- **Go Backend**: Lightweight backend for error logging and API management

## 🛠 Tech Stack

### Frontend
- **React 19** - Modern React with hooks
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool and dev server
- **OpenRouter** - AI integration for query classification

### Backend
- **Go** - High-performance backend language
- **Gorilla Mux** - HTTP router and URL matcher
- **CORS** - Cross-origin resource sharing support

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Go 1.21+
- OpenRouter API key (optional, for AI classification)

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file (optional):
```bash
# Create .env file for OpenRouter API key
echo "VITE_OPENROUTER_API_KEY=your_api_key_here" > .env
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Initialize Go modules and install dependencies:
```bash
go mod tidy
```

3. Run the backend server:
```bash
go run main.go
```

The backend will be available at `http://localhost:8080`

## 🤖 How the Chatbot Works

### Query Processing Flow

1. **User Input**: User types a query in the chat interface
2. **AI Classification**: Query is sent to OpenRouter AI to classify as:
   - `vehicle_data`: Queries about speed, telemetry, or vehicle performance
   - `unrelated`: Any other type of query
3. **Data Fetching**: For vehicle data queries, the system fetches real-time data from the racing API
4. **Analysis**: Data is processed to calculate statistics (average, min, max, etc.)
5. **Response**: Formatted response is displayed to the user

### API Integration

#### Vehicle Data API
- **Endpoint**: `https://mapache.gauchoracing.com/api/query/signals`
- **Parameters**: 
  - `vehicle_id=gr24-main`
  - `trip_id=4`
  - `signals=mobile_speed`
  - `token=01b3939d-678f-44ac-93ff-0d54e09ba3d6`
- **Response**: JSON containing speed data and timestamps

#### OpenRouter AI
- **Purpose**: Query classification and intelligent processing
- **Model**: GPT-3.5-turbo
- **Fallback**: Keyword-based classification if API key is not provided

#### Backend Error Logging
- **Endpoint**: `POST /api/log-error`
- **Purpose**: Log errors for debugging and monitoring
- **Data**: Error message, original query, and timestamp

### Error Handling

The application includes comprehensive error handling:

1. **API Failures**: If the vehicle data API fails, errors are logged to the backend
2. **Network Issues**: Graceful handling of network timeouts and connection errors
3. **AI Classification**: Fallback to keyword-based classification if OpenRouter is unavailable
4. **User Feedback**: Clear error messages displayed to users

## 🎨 UI/UX Features

### Light/Dark Mode
- Toggle button in the header
- Persistent theme preference using localStorage
- System preference detection
- Smooth transitions between themes

### Chat Interface
- Clean, modern chat UI
- Message timestamps
- Loading indicators
- Auto-scroll to latest messages
- Responsive design for all screen sizes

### Welcome Screen
- Helpful introduction when no messages are present
- Example queries to guide users
- Vehicle emoji and branding

## 📝 Example Usage

### Sample Queries

**Vehicle Data Queries:**
- "Give me the averages of the mobile speed"
- "What's the vehicle speed data?"
- "Show me the mobile speed statistics"
- "Analyze the speed performance"

**Unrelated Queries:**
- "What's the weather today?"
- "Tell me a joke"
- "How do I cook pasta?"

### Expected Responses

**For Vehicle Data:**
```
Here's the mobile speed data analysis:

📊 Statistics:
- Average Speed: 45.67 units
- Maximum Speed: 78.90 units
- Minimum Speed: 12.34 units
- Total Data Points: 150

📈 Speed Values:
1. 45.23
2. 47.89
3. 43.12
... and 147 more values
```

**For Unrelated Queries:**
```
Sorry, I can't help you with that. I can only assist with vehicle data queries.
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the frontend directory:

```env
# Optional: OpenRouter API key for AI classification
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### Backend Configuration

The backend can be configured using environment variables:

```bash
# Port (default: 8080)
export PORT=8080
```

## 🚀 Deployment

### Frontend Deployment
```bash
cd frontend
npm run build
# Deploy the 'dist' folder to your hosting service
```

### Backend Deployment
```bash
cd backend
go build -o chatbot-backend main.go
# Deploy the binary to your server
```

## 🧪 Development

### Running in Development Mode

1. Start the backend:
```bash
cd backend && go run main.go
```

2. Start the frontend (in a new terminal):
```bash
cd frontend && npm run dev
```

### Project Structure

```
Query/
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts (theme)
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript interfaces
│   │   └── ...
│   └── package.json
├── backend/
│   ├── main.go            # Go backend server
│   └── go.mod             # Go dependencies
└── README.md
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the browser console for errors
2. Verify the backend is running on port 8080
3. Ensure your OpenRouter API key is valid (if using AI features)
4. Check the network tab for failed API requests

For additional support, please open an issue in the repository.
