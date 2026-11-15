# ---------- Étape 1 : build (dépendances de production) ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src

# ---------- Étape de test (utilisée par Jenkins : --target test) ----------
FROM node:22-alpine AS test
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY src ./src
COPY tests ./tests
RUN npm test

# ---------- Étape 2 : image finale légère ----------
FROM alpine:3.22
RUN apk add --no-cache nodejs \
 && addgroup -S app && adduser -S app -G app
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/src ./src
USER app
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:$PORT/health || exit 1
CMD ["node", "src/server.js"]
