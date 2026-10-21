# Image de production pour @batione/web (Next.js, build "standalone"). Contexte de build =
# racine du monorepo (nécessaire pour résoudre le workspace @batione/shared-types).

FROM node:20-slim AS builder
WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/database/package.json packages/database/package.json
RUN npm ci

COPY packages/shared-types packages/shared-types
COPY apps/web apps/web
# next.config.js lit API_INTERNAL_HOST/API_PORT au chargement du module : "next build" les évalue
# et les figent dans le bundle "standalone" — les redéfinir seulement au "docker run" ne les
# changerait plus. D'où des ARG de build plutôt que des variables d'environnement runtime.
ARG API_INTERNAL_HOST=api
ARG API_PORT=4001
ENV API_INTERNAL_HOST=$API_INTERNAL_HOST
ENV API_PORT=$API_PORT
RUN npm run build -w @batione/shared-types \
 && npm run build -w @batione/web

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=4000

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 4000
CMD ["node", "apps/web/server.js"]
