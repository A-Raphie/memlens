FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# --host is required so the dev server is reachable outside the container
CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "3000"]
