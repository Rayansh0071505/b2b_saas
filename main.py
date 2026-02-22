from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes import sentiment_router
from backend.bot_routes import bot_router

app = FastAPI(title="Saturnin AI Platform API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with /api prefix
app.include_router(sentiment_router, prefix="/api")
app.include_router(bot_router, prefix="/api")

@app.get("/")
async def root():
    return {
        "message": "Saturnin AI Platform API",
        "version": "2.0",
        "platform": "Saturnin",
        "endpoints": {
            "sentiment": "/api/companies, /api/report/*, /api/reviews",
            "bot_training": "/api/bot/knowledge-base, /api/bot/instructions",
            "bot_chat": "/api/bot/chat",
            "connectors": "/api/bot/connectors/*"
        }
    }

@app.get("/api")
async def api_root():
    return {
        "message": "Saturnin AI Platform API",
        "version": "2.0",
        "platform": "Saturnin",
        "endpoints": {
            "sentiment": "/api/companies, /api/report/*, /api/reviews",
            "bot_training": "/api/bot/knowledge-base, /api/bot/instructions",
            "bot_chat": "/api/bot/chat",
            "connectors": "/api/bot/connectors/*"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)
