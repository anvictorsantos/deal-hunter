FROM mcr.microsoft.com/playwright:v1.65.1-jammy

WORKDIR /app
COPY --chown=pwuser:pwuser . .

# Non-root keeps Chromium's sandbox available; root would need --no-sandbox.
USER pwuser
RUN npm ci && npm run db:generate && npm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
