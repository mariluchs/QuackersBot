# Node.js 20 on Red Hat UBI (public registry, no Docker Hub)
FROM registry.access.redhat.com/ubi9/nodejs-20

WORKDIR /app

# Copy package files first to leverage caching
COPY package.json package-lock.json* ./

# Install production dependencies
RUN npm install --omit=dev

# Copy the rest of the app
COPY . .

ENV NODE_ENV=production

# Start your bot
CMD ["node", "src/index.js"]
