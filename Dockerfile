# ── Stage 1: build frontend ──────────────────────────────────────────────────
FROM oven/bun AS frontend-build

WORKDIR /frontend

COPY Frontend/package.json package.json
COPY Frontend/bun.lock bun.lock

RUN bun install

COPY Frontend/ .

RUN bun run build

# ── Stage 2: build backend binary ────────────────────────────────────────────
FROM oven/bun AS backend-build

WORKDIR /backend

COPY Backend/package.json package.json
COPY Backend/bun.lock bun.lock

RUN bun install

COPY Backend/ .

# Frontend build goes into public/ so the static plugin can serve it
COPY --from=frontend-build /frontend/build ./public

ENV NODE_ENV=production

RUN bun build \
	--compile \
	--minify-whitespace \
	--minify-syntax \
	--outfile server \
	src/index.ts

# ── Stage 3: imagen final ─────────────────────────────────────────────────────
FROM gcr.io/distroless/base

WORKDIR /app

COPY --from=backend-build /backend/server server
COPY --from=backend-build /backend/public ./public

ENV NODE_ENV=production

EXPOSE 8000

CMD ["./server"]
