# Start FastAPI Backend Server
Write-Host "Starting FastAPI backend server..." -ForegroundColor Green
cd backend
.\.venv\Scripts\uvicorn.exe app.main:app --reload --host 127.0.0.1 --port 8000
