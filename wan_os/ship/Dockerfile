FROM node:20-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    libgtk-3-0 \
    libnotify-dev \
    libgconf-2-4 \
    libnss3 \
    libxss1 \
    libasound2 \
    libxtst6 \
    xauth \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Set environment variables for Electron
ENV DISPLAY=:99
ENV ELECTRON_DISABLE_GPU=1
ENV ELECTRON_NO_ATTACH_CONSOLE=1

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=development

# Start the application with Xvfb
CMD ["sh", "-c", "Xvfb :99 -screen 0 1024x768x16 & npm start"] 