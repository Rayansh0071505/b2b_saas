from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes import sentiment_router

app = FastAPI(title="B2B Sentiment Analysis API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(sentiment_router)

@app.get("/")
async def root():
    return {
        "message": "B2B Sentiment Analysis API",
        "version": "1.0",
        "endpoints": {
            "companies": "/companies",
            "reports": "/report/*",
            "reviews": "/reviews",
            "shopify": "/shopify_insights"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)
