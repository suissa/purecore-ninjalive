FROM mcr.microsoft.com/playwright:v1.50.1-jammy
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5558
CMD ["npm", "run", "dev"]
