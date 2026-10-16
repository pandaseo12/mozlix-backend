FROM node:22-alpine
WORKDIR /app
COPY vendor/idlix-api/package*.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund
COPY vendor/idlix-api/ ./
COPY gateway/ /app/gateway/
USER node
EXPOSE 3130
CMD ["node", "gateway/server.mjs"]
