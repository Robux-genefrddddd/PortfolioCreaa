# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.14.0

# Copy package files
COPY pnpm-lock.yaml package.json ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the client
RUN pnpm run build:client

# Production stage - serve with Node.js
FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.14.0

# Copy package files for production dependencies
COPY pnpm-lock.yaml package.json ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy built SPA from builder
COPY --from=builder /app/dist/spa ./dist/spa

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start the server
CMD ["node", "-e", "const express = require('express'); const path = require('path'); const app = express(); app.use(express.static(path.join(__dirname, 'dist/spa'))); app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist/spa/index.html'))); app.listen(8080, () => console.log('Server running on port 8080'))"]
