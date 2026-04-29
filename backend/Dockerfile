FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev    # Changed: --only=production → --omit=dev

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]