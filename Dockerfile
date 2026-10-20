# Production image: builds the React app, then serves it + the API from Express
FROM node:22-alpine AS client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY server/package*.json ./server/
RUN npm install --omit=dev --prefix server
COPY server/ ./server/
COPY --from=client /app/client/dist ./client/dist
ENV NODE_ENV=production
EXPOSE 5050
CMD ["node", "server/src/index.js"]
