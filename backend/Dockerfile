# backend/Dockerfile.dev
FROM node:18-alpine

# Install nodemon for hot reload
RUN npm install -g nodemon

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm install

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 5000

# Start with nodemon for hot reload
CMD ["nodemon", "server.js"]