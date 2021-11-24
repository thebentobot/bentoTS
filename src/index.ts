import Client from './client/index'

new Client({ partials: [`MESSAGE`, `CHANNEL`, `REACTION`, `USER`, `GUILD_MEMBER`] }).init()
