# Prebuilt source-identified runtime for the existing X-Center Docker host.
FROM node:24-bookworm-slim
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8787 WEB_ROOT=/srv/fieldplay
ARG BUILD_COMMIT
ENV BUILD_COMMIT=$BUILD_COMMIT
WORKDIR /opt/fieldplay
COPY server.mjs ./server.mjs
COPY web /srv/fieldplay
COPY source.tar.gz /srv/fieldplay/source.tar.gz
COPY LICENSE ./LICENSE
USER node
EXPOSE 8787
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s CMD node -e "fetch('http://127.0.0.1:8787/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node","server.mjs"]
