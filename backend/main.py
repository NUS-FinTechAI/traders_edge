import uvicorn

from app import app

if __name__ == "__main__":
    uvicorn.run(
        "main:app",  # module:app
        host="0.0.0.0",  # accessible externally
        port=8000,  # default FastAPI port
        reload=True,  # auto-reload on code changes (dev only)
    )
