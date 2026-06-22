FROM python:3.12-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p data/fareyfs data/cache logs

# Expose ports
EXPOSE 8000 3000

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV NODE_ENV=production

# Start script
COPY start_local.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"] 