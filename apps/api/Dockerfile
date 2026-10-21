# Image de production pour @batione/api (NestJS). Contexte de build = racine du monorepo
# (nécessaire pour résoudre les workspaces @batione/database et @batione/shared-types).

FROM node:20-slim AS builder
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/database/package.json packages/database/package.json
RUN npm ci

COPY packages/shared-types packages/shared-types
COPY packages/database packages/database
COPY apps/api apps/api
RUN npm run build -w @batione/shared-types \
 && npm run build -w @batione/database \
 && npm run build -w @batione/api

FROM node:20-slim AS runtime
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/packages/shared-types ./packages/shared-types
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/apps/api ./apps/api

EXPOSE 4001
CMD ["node", "apps/api/dist/main.js"]
