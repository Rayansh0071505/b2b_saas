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

# Include routers with /api prefix
app.include_router(sentiment_router, prefix="/api")

@app.get("/")
async def root():
    return {
        "message": "B2B Sentiment Analysis API",
        "version": "1.0",
        "endpoints": {
            "companies": "/api/companies",
            "reports": "/api/report/*",
            "reviews": "/api/reviews",
            "shopify": "/api/shopify_insights"
        }
    }

@app.get("/api")
async def api_root():
    return {
        "message": "B2B Sentiment Analysis API",
        "version": "1.0",
        "endpoints": {
            "companies": "/api/companies",
            "reports": "/api/report/*",
            "reviews": "/api/reviews",
            "shopify": "/api/shopify_insights"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)
