FROM node:12.18-alpine

WORKDIR /usr/

COPY . .

RUN npm i

CMD ["node", "--experimental-modules ./src/index.ts"]