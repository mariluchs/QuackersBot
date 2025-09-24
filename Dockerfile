# Use stable Node.js 20 runtime
FROM cgr.dev/chainguard/node:20

# Set working directory inside container
WORKDIR /app

# Copy only package files first (for caching)
COPY package.json package-lock.json* ./

# Install dependencies (production only, no dev dependencies)
RUN npm install --omit=dev

# Copy the rest of the code
COPY . .

# Environment
ENV NODE_ENV=production

# Start the bot
CMD ["node", "src/index.js"]
