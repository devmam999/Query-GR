from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import pandas as pd
import json
import logging
from typing import Dict, Any
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="Vehicle Data Chatbot API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Request/Response models
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    success: bool
    message: str
    data: Dict[str, Any] = None
    error: str = None

class LogRequest(BaseModel):
    error: str
    timestamp: str
    userAgent: str
    url: str

# OpenRouter configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

# Vehicle data API configuration
VEHICLE_API_URL = "https://mapache.gauchoracing.com/api/query/signals"
VEHICLE_API_TOKEN = "01b3939d-678f-44ac-93ff-0d54e09ba3d6"
VEHICLE_ID = "gr24-main"
TRIP_ID = "4"

async def call_openrouter(prompt: str, model: str = "openai/gpt-3.5-turbo") -> str:
    """Call OpenRouter API to generate responses"""
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OpenRouter API key not configured")
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "Vehicle Data Chatbot"
    }
    
    data = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 1000
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{OPENROUTER_BASE_URL}/chat/completions",
                headers=headers,
                json=data,
                timeout=30.0
            )
            response.raise_for_status()
            result = response.json()
            return result["choices"][0]["message"]["content"]
        except Exception as e:
            logger.error(f"OpenRouter API error: {e}")
            raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

async def fetch_vehicle_data(signals: str = "mobile_speed") -> Dict[str, Any]:
    """Fetch vehicle data from the external API"""
    params = {
        "vehicle_id": VEHICLE_ID,
        "trip_id": TRIP_ID,
        "signals": signals,
        "token": VEHICLE_API_TOKEN
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(VEHICLE_API_URL, params=params, timeout=30.0)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Vehicle data API error: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch vehicle data: {str(e)}")

def is_vehicle_data_query(message: str) -> bool:
    """Simple keyword-based detection for vehicle data queries"""
    vehicle_keywords = [
        "speed", "mobile_speed", "average", "max", "min", "mean", "median",
        "vehicle", "data", "telemetry", "trip", "signal", "sensor",
        "acceleration", "brake", "throttle", "rpm", "fuel", "temperature"
    ]
    
    message_lower = message.lower()
    return any(keyword in message_lower for keyword in vehicle_keywords)

async def generate_pandas_script(query: str, data: Dict[str, Any]) -> str:
    """Generate a Pandas script to process the vehicle data"""
    data_str = json.dumps(data, indent=2)
    
    prompt = f"""
You are a data analysis expert. Given the following vehicle telemetry data and user query, generate a Python Pandas script that:

1. Loads the JSON data into a pandas DataFrame
2. Extracts the relevant signal data
3. Computes the requested metric (average, max, min, etc.)
4. Returns a clear, formatted result

Vehicle Data:
{data_str}

User Query: "{query}"

Generate ONLY the Python code that:
- Imports pandas as pd
- Loads the data from the JSON
- Processes the data according to the query
- Prints the result in a user-friendly format

Do not include any explanations or markdown formatting, just the Python code.
"""
    
    return await call_openrouter(prompt)

async def execute_pandas_script(script: str, data: Dict[str, Any]) -> str:
    """Execute the generated Pandas script safely"""
    try:
        # Create a safe execution environment
        safe_globals = {
            'pd': pd,
            'json': json,
            'data': data,
            'print': print
        }
        
        # Capture the output
        import io
        import sys
        from contextlib import redirect_stdout
        
        output = io.StringIO()
        with redirect_stdout(output):
            exec(script, safe_globals)
        
        result = output.getvalue().strip()
        return result if result else "No output generated"
        
    except Exception as e:
        logger.error(f"Pandas script execution error: {e}")
        raise HTTPException(status_code=500, detail=f"Script execution failed: {str(e)}")

@app.post("/query", response_model=ChatResponse)
async def handle_query(request: ChatRequest):
    """Handle user queries and process vehicle data"""
    try:
        message = request.message.strip()
        
        if not message:
            return ChatResponse(
                success=False,
                message="Please provide a valid query.",
                error="Empty message"
            )
        
        # Check if it's a vehicle data query
        if not is_vehicle_data_query(message):
            return ChatResponse(
                success=True,
                message="Sorry, I can't help you with that. I can only assist with vehicle data queries."
            )
        
        # Fetch vehicle data
        try:
            vehicle_data = await fetch_vehicle_data()
        except Exception as e:
            logger.error(f"Failed to fetch vehicle data: {e}")
            return ChatResponse(
                success=False,
                message="Sorry, I couldn't fetch the data.",
                error=str(e)
            )
        
        # Generate Pandas script
        try:
            pandas_script = await generate_pandas_script(message, vehicle_data)
        except Exception as e:
            logger.error(f"Failed to generate Pandas script: {e}")
            return ChatResponse(
                success=False,
                message="Sorry, I couldn't process your query.",
                error=str(e)
            )
        
        # Execute the script
        try:
            result = await execute_pandas_script(pandas_script, vehicle_data)
            return ChatResponse(
                success=True,
                message=result,
                data={"script": pandas_script}
            )
        except Exception as e:
            logger.error(f"Failed to execute Pandas script: {e}")
            return ChatResponse(
                success=False,
                message="Sorry, I couldn't process your query.",
                error=str(e)
            )
            
    except Exception as e:
        logger.error(f"Unexpected error in query handler: {e}")
        return ChatResponse(
            success=False,
            message="Sorry, an unexpected error occurred.",
            error=str(e)
        )

@app.post("/log")
async def log_error(request: LogRequest):
    """Log frontend errors"""
    try:
        logger.error(f"Frontend Error - {request.timestamp}: {request.error}")
        logger.error(f"User Agent: {request.userAgent}")
        logger.error(f"URL: {request.url}")
        return {"success": True, "message": "Error logged successfully"}
    except Exception as e:
        logger.error(f"Failed to log error: {e}")
        return {"success": False, "message": "Failed to log error"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Vehicle Data Chatbot API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
