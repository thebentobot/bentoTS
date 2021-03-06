[![Docker Image CI](https://github.com/thebentobot/bentoTS/actions/workflows/docker-image.yml/badge.svg?branch=master)](https://github.com/thebentobot/bentoTS/actions/workflows/docker-image.yml)
[![Discord Bots](https://top.gg/api/widget/servers/787041583580184609.svg)](https://top.gg/bot/787041583580184609)

# [Invite Bento 🍱 to your own server here!](https://discord.com/api/oauth2/authorize?client_id=787041583580184609&permissions=261926943991&scope=bot%20applications.commands)

# Bento 🍱

A Discord bot with server moderation tools and various entertaining commands.

Bento 🍱 is a [TypeScript](https://www.typescriptlang.org/) rewrite of [Bento](https://github.com/thebentobot/bento). Bento 🍱 uses the [Discord.js](https://discord.js.org/#/) node.js module, that interacts with the [Discord API](https://discord.com/developers/docs/reference), and stores data in a [PostgreSQL](https://www.postgresql.org/) database.

Want to give feedback or got any questions? Join the support server [here](https://discord.gg/dd68WwP).

## List of notable features

- Gfycat API features such as create, check user feeds etc.
- LastFM API features
- Make scheduled and repeating announcements in a specific channel
- Advanced moderation tools that include a comprehensive case-based logging system.
- Custom user profiles
- Create Streamables
- Fun features such as rock paper scissors, 8ball, roll a number or pick an option
- Database that saves server info such as feature settings and welcome message, and user data such as XP/Levels and command info
- Unlimited custom commands (for the server only) that saves name for recall and content
- Horoscope
- Weather and time at a specific city, provided by [OpenWeather](https://openweathermap.org/)
- Chat XP/levels and "bento" leaderboard
- Custom welcome and goodbye messages, customisable by server
- Urban Dictionary search

## Getting Started

### Dependencies

- A [PostgreSQL](https://www.postgresql.org/) Database
- [Docker](https://www.docker.com/) if you want to deploy it with Docker
- [LastFM](https://www.last.fm/api), [Spotify](https://developer.spotify.com/documentation/web-api/), [Tenor](https://tenor.com/gifapi/documentation) and [OpenWeather](https://openweathermap.org/api) API keys.

### Installing the server side of Bento 🍱

- `git clone https://github.com/thebentobot/bentoTS.git` or download ZIP.
- Create a [dotenv](https://www.npmjs.com/package/dotenv) file with the environment variables as listed [here](https://github.com/thebentobot/bentoTS/blob/master/.env_example)
- `npm install` assuming you have installed [node.js](https://nodejs.org/en/)

### Installing the database side of Bento 🍱

- Either locally run/install [PostgreSQL](https://www.postgresql.org/) or get a PostgreSQL database elsewhere. Other SQL databases may be possible considering Bento uses [Sequelize](https://sequelize.org/), but is not tested and isn't recommended because the code may use PostgreSQL specific features, and it requires additional changes to the code.
- The creation of the database tables. An SQL DDL schema file can be found [here](https://github.com/thebentobot/bentoTS/blob/master/src/database/DDL.sql)

### Executing Bento 🍱 with Docker locally

- `docker build -t [NAME] .`
- `docker run [NAME or ghcr.io/thebentobot/bentots:master]`

#### Executing Bento 🍱 with Docker Compose (to support rank/profile, gfycat, and lastfm collages)

```
version: '3.8'

services:
  bot:
    image: ghcr.io/thebentobot/bentots:master
    container_name: bento
    restart: unless-stopped
    env_file:
      - .env
    ports:
      - '6969:6969'
    networks:
      - bento_net
      - web
  sushii-image-server:
    image: ghcr.io/sushiibot/sushii-image-server:latest
    container_name: sushii-image-server
    restart: unless-stopped
    init: true
    cap_add:
        - SYS_ADMIN
    expose:
        - "3000"
    networks:
        - bento_net

networks:
  web:
    internal: false
  bento_net:
    external: false
```

### Executing Bento 🍱 without Docker

- `npm start`

## Development

The bot is mainly developed by [Christian](https://github.com/banner4422).

Pull requests are very welcome if the features/changes makes sense and are up to par in quality.

## License

This project is licensed under the [AGPL-3.0 License](https://github.com/thebentobot/bentoTS/blob/master/LICENSE)

The avatar illustration is done by [Freepik](http://www.freepik.com).
