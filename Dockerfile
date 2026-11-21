FROM mcr.microsoft.com/playwright:v1.65.1-jammy

WORKDIR /app
# WORKDIR creates /app as root; --chown only covers copied files.
RUN chown pwuser:pwuser /app
COPY --chown=pwuser:pwuser . .

# Non-root keeps Chromium's sandbox available; root would need --no-sandbox.
USER pwuser
RUN npm ci && npm run db:generate && npm run build

ENV NODE_ENV=production
EXPOSE 3000
# Shell form so && works; Render's Docker Command field does not run a shell.
CMD npx prisma db push && node .output/server/index.mjs
