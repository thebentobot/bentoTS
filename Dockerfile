FROM node:15

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install packages
RUN npm install

# Copy the app code
COPY . .

EXPOSE 6969

# Run the application
CMD [ "npm", "run", "start" ]