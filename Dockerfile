# Lavanet: frontend build + API Express (sirve /frontend/build en production)
FROM node:22-bookworm-slim AS frontend-build

WORKDIR /app/frontend
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install --frozen-lockfile --network-timeout 600000

COPY frontend/ ./
ARG REACT_APP_BACKEND_URL=https://lavanet.ebyzom.com
ARG REACT_APP_SHOW_DEMOS=false
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL \
    REACT_APP_SHOW_DEMOS=$REACT_APP_SHOW_DEMOS \
    NODE_OPTIONS=--max-old-space-size=768 \
    CI=true
RUN yarn build

FROM node:22-bookworm-slim

WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

COPY backend/ ./
COPY --from=frontend-build /app/frontend/build /app/frontend/build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

USER node
CMD ["node", "server.js"]
