FROM node:26-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

RUN mkdir -p uploads

EXPOSE 4000

CMD ["node", "src/server.js"]