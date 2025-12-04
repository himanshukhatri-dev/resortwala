FROM node:18-alpine

WORKDIR /app

# Install Expo CLI globally
RUN npm install -g @expo/cli

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose Expo ports
EXPOSE 19000 19001 19002

# Start Expo development server
CMD ["npx", "expo", "start", "--host", "0.0.0.0"] 