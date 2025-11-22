FROM node:18-alpine

# Install security updates
RUN apk update && apk upgrade

# Create app directory
WORKDIR /usr/src/app

# Copy package files FIRST (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeapp -u 1001 && \
    chown -R nodeapp:nodejs /usr/src/app

USER nodeapp

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD [ "node", "server.js" ]