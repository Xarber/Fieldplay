FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY . .
RUN npm ci --ignore-scripts
ARG BUILD_COMMIT=development
ENV BUILD_COMMIT=$BUILD_COMMIT
RUN npm run web:build
RUN npx esbuild services/server/src/index.ts --bundle --platform=node --format=esm --banner:js="import {createRequire} from 'node:module';const require=createRequire(import.meta.url);" --external:bufferutil --external:utf-8-validate --outfile=/build/server.mjs
RUN tar --exclude=./node_modules --exclude=./apps/mobile/dist --exclude=./.expo --exclude=./.git --exclude=./runtime --exclude=./docs/IDEAS.json -czf /build/source.tar.gz .
FROM node:24-bookworm-slim
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8787 WEB_ROOT=/srv/fieldplay
ARG BUILD_COMMIT=development
ENV BUILD_COMMIT=$BUILD_COMMIT
WORKDIR /opt/fieldplay
COPY --from=build /build/server.mjs ./server.mjs
COPY --from=build /app/apps/mobile/dist /srv/fieldplay
COPY --from=build /build/source.tar.gz /srv/fieldplay/source.tar.gz
COPY LICENSE ./LICENSE
USER node
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:8787/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node","server.mjs"]
