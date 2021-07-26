FROM node:15

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install packages
RUN npm install
RUN npm install -g pm2
RUN ./node_modules/.bin/pm2 install typescript ts-node

# Copy the app code
COPY . .

# Run the application
CMD [ "npm", "run", "start:pm2" ]