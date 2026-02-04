# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies first (cache optimization)
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY src ./src

# Expose the port your app runs on
EXPOSE 3000

# Start the app
CMD ["node", "src/app.js"]
