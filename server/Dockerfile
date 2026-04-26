FROM node:24-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5557
CMD ["npm", "run", "dev"]
