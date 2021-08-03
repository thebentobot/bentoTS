# Bento 🍱

A Discord bot with server moderation tools and various entertaining commands.

Bento 🍱 is a [TypeScript](https://www.typescriptlang.org/) rewrite of [Bento](https://github.com/thebentobot/bento). Bento 🍱 uses the [Discord.js](https://discord.js.org/#/) node.js module, that interacts with the [Discord API](https://discord.com/developers/docs/reference), and stores data in a [PostgreSQL](https://www.postgresql.org/) database.

Bot will be available for public use very soon.

Want to give feedback or got any questions? Join the support server [here](https://discord.gg/dd68WwP).

## List of notable features

- TikTok embedding
- LastFM API features
- Advanced moderation tools that include a comprehensive case-based logging system.
- Database that saves server info such as feature settings and welcome message, and user data such as XP/Levels and command info
- Unlimited custom commands (for the server only) that saves name for recall and content
- Horoscope
- Weather and time at a specific city, provided by [OpenWeather](https://openweathermap.org/)
- Chat XP/levels and "bento" leaderboard
- Custom welcome and goodbye messages, customisable by server
- GIF and Google Image search
- Urban Dictionary search

## Getting Started

### Dependencies

* A [PostgreSQL](https://www.postgresql.org/) Database
* [Docker](https://www.docker.com/) if you want to deploy it with Docker
* [LastFM](https://www.last.fm/api), [Spotify](https://developer.spotify.com/documentation/web-api/), [Tenor](https://tenor.com/gifapi/documentation) and [OpenWeather](https://openweathermap.org/api) API keys.
* An Instagram sessionid and 5 proxy addresses if you are using it longterm.

### Installing the server side of Bento 🍱

* ```git clone https://github.com/thebentobot/bentoTS.git``` or download ZIP.
* Create a [dotenv](https://www.npmjs.com/package/dotenv) file with the environment variables as listed [here](https://github.com/thebentobot/bentoTS/blob/master/.env_example)
* ```npm install``` assuming you have installed [node.js](https://nodejs.org/en/)

### Installing the database side of Bento 🍱

* Either locally run/install [PostgreSQL](https://www.postgresql.org/) or get a PostgreSQL database elsewhere. Other SQL databases may be possible considering Bento uses [Sequelize](https://sequelize.org/), but is not tested and isn't recommended because the code may use PostgreSQL specific features, and it requires additional changes to the code.
* The creation of the database tabels. An SQL schema file will be provided in the future, but it is possible to recreate the tables by looking through the [Sequelize-auto](https://github.com/sequelize/sequelize-auto) generated models [here](https://github.com/thebentobot/bentoTS/tree/master/src/database/models) 

### Executing Bento 🍱 with Docker

* ```docker build -t [NAME] .```
* ```docker run [NAME]```

### Executing Bento 🍱 without Docker

* ```npm start```

## Development

The bot is mainly developed by [Christian](https://github.com/banner4422).

Pull requests are very welcome if the features/changes makes sense and are up to par in quality.

## License

This project is licensed under the [AGPL-3.0 License](https://github.com/thebentobot/bentoTS/blob/master/LICENSE)

The avatar illustration is done by [Freepik](http://www.freepik.com).
