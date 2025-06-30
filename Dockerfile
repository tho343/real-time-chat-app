# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy files
COPY package*.json ./
RUN npm install

#Install dependencies
RUN npm install -g nodemon

COPY . .

# Expose and run
EXPOSE 3000
CMD ["node", "run","dev"]