FROM python:3.11-slim

WORKDIR /app

# Install system & Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source repository
COPY . .

EXPOSE 8000

# Execute FastAPI uvicorn production server
CMD ["python", "backend/server.py"]
