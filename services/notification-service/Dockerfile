# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files first — lets Docker cache the npm install layer
# so it doesn't re-run on every code change, only on dependency changes
COPY package*.json ./

RUN npm ci --omit=dev

# Copy source after installing deps
COPY src ./src

EXPOSE 8084

CMD ["node", "src/index.js"]