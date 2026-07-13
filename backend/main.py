import os
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI
from pydantic import BaseModel
from typing import List
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="ChatGPT Proxy Backend")

# Allow CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the OpenAI async client
# Make sure OPENAI_API_KEY is set in your .env file
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    model: str = "gpt-4o" # or gpt-3.5-turbo
    messages: List[Message]
    stream: bool = True

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not found in backend environment variables.")

    async def generate():
        try:
            stream = await client.chat.completions.create(
                model=req.model,
                messages=[m.model_dump() for m in req.messages],
                stream=True
            )
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content is not None:
                    # Format as Server-Sent Events (SSE)
                    yield f"data: {chunk.model_dump_json()}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            # Basic error handling for the stream
            yield f"data: {{\"error\": \"{str(e)}\"}}\n\n"
            
    return StreamingResponse(generate(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
