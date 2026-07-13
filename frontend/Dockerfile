FROM node:24-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all project files
COPY . .

# Expose Vite default port
EXPOSE 5173

# Run the dev server (disable host checking for container)
CMD ["npm", "run", "dev"]
