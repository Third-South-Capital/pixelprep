from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .optimize import router as optimize_router

app = FastAPI(
    title="PixelPrep API",
    description="Image optimization API for artists",
    version="0.1.0"
)

# Add CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include optimization endpoints
app.include_router(optimize_router)

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "PixelPrep API", "version": "0.1.0"}

@app.get("/presets")
async def get_presets():
    """Get available image optimization presets."""
    from ..processors.instagram import InstagramSquareProcessor
    from ..processors.jury import JurySubmissionProcessor
    from ..processors.web import WebDisplayProcessor
    from ..processors.email import EmailNewsletterProcessor
    from ..processors.compress import QuickCompressProcessor
    
    # Initialize available processors
    processors = {
        "instagram_square": InstagramSquareProcessor(),
        "jury_submission": JurySubmissionProcessor(),
        "web_display": WebDisplayProcessor(),
        "email_newsletter": EmailNewsletterProcessor(),
        "quick_compress": QuickCompressProcessor()
    }
    
    presets = {}
    for preset_id, processor in processors.items():
        presets[preset_id] = processor.get_preset_config()
    
    return {
        "presets": presets,
        "total_count": len(presets)
    }

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "status_code": exc.status_code}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """General exception handler for unhandled errors."""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error occurred during image processing",
            "status_code": 500
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)