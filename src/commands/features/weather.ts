import { Command, weatherAPIObjectInterface } from '../../interfaces'
import axios from 'axios'
import database from '../../database/database'
import tzlookup from 'tz-lookup'
import moment, { Moment } from 'moment'
import { initModels, guild, weather, weatherCreationAttributes } from '../../database/models/init-models'
import * as dotenv from 'dotenv'
import { Message, MessageEmbed } from 'discord.js'
import { capitalize } from '../../utils/capitalize'
import { flag } from 'country-emoji'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { codeToName } from 'country-emoji/dist/lib'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { tz } from 'moment-timezone'
dotenv.config()

const openWeatherAPI = axios.create({
	baseURL: `https://api.openweathermap.org/data/2.5`,
})

export const command: Command = {
	name: `weather`,
	aliases: [],
	category: `features`,
	description: `Displays info about the weather at the city saved for the user, or at the specified city.\nIf it shows a city from another country than the one you expected, try to add a country code (e.g. US, GB, DE) beside the city (remember a comma after city), as shown below\nIf it does not show up either, it may not be included in the OpenWeather API.`,
	usage: `weather [save] <city>, [country code]`,
	website: `https://www.bentobot.xyz/commands#weather`,
	run: async (client, message, args): Promise<Message | undefined> => {
		try {
			if (args[0] === `save`) {
				return await saveWeather(message, args.slice(1).join(` `))
			}

			if (args[0]) {
				return await weatherFunction(message, args.slice(0).join(` `))
			}

			if (!args.length) {
				return await weatherFunction(message)
			}
		} catch (err) {
			console.log(`Error at weather.ts, server ${message.guild?.id}\n\n${err}`)
		}

		async function weatherFunction(message: Message, input?: string) {
			initModels(database)

			let userID: string | undefined
			let city: string | undefined

			if (input) {
				try {
					const mentionedUser = message.mentions.members?.has(client.user?.id as string)
						? message.mentions.members.size > 1
							? message.mentions.members.last()
							: message.member
						: message.mentions.members?.first() || (await message.guild?.members.fetch(input))
					if (mentionedUser?.user.bot === true) return message.channel.send(`Bots doesn't care about the weather.`)
					userID = mentionedUser?.id
					try {
						const weatherData = await weather.findOne({
							raw: true,
							where: { userID: userID },
						})
						city = weatherData?.city
					} catch {
						return message.channel.send(
							`${mentionedUser?.user.username}#${mentionedUser?.user.discriminator} hasn't saved a weather location.`,
						)
					}
				} catch {
					city = input
				}
			} else {
				try {
					userID = message.author.id
					const weatherData = await weather.findOne({
						raw: true,
						where: { userID: userID },
					})
					city = weatherData?.city
				} catch {
					const guildData = await guild.findOne({
						raw: true,
						where: { guildID: message.guild?.id },
					})
					return message.channel.send(
						`Your request was invalid. You haven't saved a city for the weather command.\nUse \`${guildData?.prefix}help weather\` for help with your request.`,
					)
				}
			}

			let response: weatherAPIObjectInterface
			try {
				const fetch = await openWeatherAPI.get(`/weather?`, {
					params: {
						q: city,
						units: `metric`,
						appid: process.env.WEATHERKEY,
						lang: `en`,
					},
				})
				response = fetch.data
			} catch {
				const guildData = await guild.findOne({
					raw: true,
					where: { guildID: message.guild?.id },
				})
				return message.channel.send(
					`No results found for the location \`${city}\`.\nIf you've saved the location you can change the location to something else by using \`${guildData?.prefix}weather save <city>\`.\nIf you tried to check the weather by ID and it failed, it's either because the user hasn't saved a city or the user isn't on this server.\nIf you searched for the location, perhaps add the country code for the location or you've misspelled.\nUse \`${guildData?.prefix}help weather\` to get help.`,
				)
			}

			const Embed = new MessageEmbed()
				.setColor(`#EB6E4B`)
				.setAuthor(
					userID
						? message.guild?.members.cache.get(userID)?.nickname
							? `${message.guild.members.cache.get(userID)?.nickname} (${
									message.guild?.members.cache.get(userID)?.user.username +
									`#` +
									message.guild?.members.cache.get(userID)?.user.discriminator
							  })`
							: message.guild?.members.cache.get(userID)?.user.username +
							  `#` +
							  message.guild?.members.cache.get(userID)?.user.discriminator
						: `OpenWeather`,
					userID
						? message.guild?.members.cache.get(userID)?.user.displayAvatarURL({ format: `png`, dynamic: true })
						: `https://pbs.twimg.com/profile_images/1173919481082580992/f95OeyEW_400x400.jpg`,
					userID ? `` : `https://openweathermap.org/`,
				)
				.setTitle(
					`${capitalize(response.weather[0].description)} ${await weatherEmote(response.weather[0].id)} in ${
						response.name
					}, ${codeToName(response.sys.country)} ${flag(response.sys.country)}`,
				)
				.setURL(`https://openweathermap.org/city/${response.id}`)
				.setThumbnail(`http://openweathermap.org/img/w/${response.weather[0].icon}.png`)
				.setFooter(
					`Last updated at ${await toTimeZone(
						moment.unix(response.dt),
						await location(response.coord.lat, response.coord.lon),
					)}`,
					userID ? `https://pbs.twimg.com/profile_images/1173919481082580992/f95OeyEW_400x400.jpg` : ``,
				)
				.setDescription(
					`🌡 ${Math.round(response.main.temp)}°C (${Math.round(
						(response.main.temp * 9) / 5 + 32,
					)}°F), feels like ${Math.round(response.main.feels_like)}°C (${Math.round(
						(response.main.feels_like * 9) / 5 + 32,
					)}°F)\n⚖️ Min. ${Math.round(response.main.temp_min)}°C (${Math.round(
						(response.main.temp_min * 9) / 5 + 32,
					)}°F), Max. ${Math.round(response.main.temp_max)}°C (${Math.round(
						(response.main.temp_max * 9) / 5 + 32,
					)}°F)\n☁️ ${response.clouds.all}% Cloudiness 🥵 ${response.main.humidity}% Humidity\n💨 ${
						response.wind.speed
					} m/s ${await windDirection(response.wind.deg)}\n\n🕒 ${await localTime(response.timezone)} ${flag(
						response.sys.country,
					)}\n🌅 ${await toTimeZone(
						moment.unix(response.sys.sunrise),
						await location(response.coord.lat, response.coord.lon),
					)}\n🌇 ${await toTimeZone(
						moment.unix(response.sys.sunset),
						await location(response.coord.lat, response.coord.lon),
					)}`,
				)
				.setTimestamp()
			return await message.channel.send(Embed)
		}

		async function saveWeather(message: Message, city: string) {
			initModels(database)

			const userID = message.author.id

			const weatherAttr: weatherCreationAttributes = {
				userID: BigInt(userID),
				city: city,
			}

			const createWeather = await weather.findOrCreate({
				raw: true,
				where: { userID: userID },
				defaults: weatherAttr,
			})

			if (createWeather[1] === false) {
				await weather.update({ city: city }, { where: { userID: userID } })
				return message.channel.send(`${message.author} your weather city was updated to \`${city}\`!\n`)
			} else {
				return message.channel.send(
					`${message.author} your weather city \`${city}\` was saved!\nYou can now use weather commands without mentioning cities, to check the weather in your saved city.`,
				)
			}
		}

		async function windDirection(degree: number) {
			if (degree === 90) {
				return `⬆️`
			} else if (degree === 270) {
				return `⬇️`
			} else if (degree === 180) {
				return `⬅️`
			} else if (degree === 360 || 0) {
				return `➡️`
			} else if (degree > 0 && degree < 90) {
				return `↗️`
			} else if (degree > 270 && degree < 360) {
				return `↘️`
			} else if (degree > 180 && degree < 270) {
				return `↙️`
			} else if (degree > 90 && degree < 180) {
				return `↖️`
			}
		}

		async function weatherEmote(weather: number) {
			if (weather >= 210 && weather <= 221) {
				return `⛈️`
			} else if (weather >= 200 && weather <= 202) {
				return `🌩️`
			} else if (weather >= 230 && weather <= 232) {
				return `⛈️`
			} else if (weather >= 300 && weather <= 321) {
				return `🌧️`
			} else if (weather >= 500 && weather <= 504) {
				return `🌦️`
			} else if (weather === 511) {
				return `🌨️`
			} else if (weather >= 520 && weather <= 531) {
				return `🌧️`
			} else if (weather >= 600 && weather <= 622) {
				return `❄️`
			} else if (weather >= 701 && weather <= 781) {
				return `🌫️`
			} else if (weather === 800) {
				return `☀️`
			} else if (weather === 801) {
				return `⛅`
			} else if (weather >= 802 && weather <= 804) {
				return `☁️`
			}
		}

		async function location(x: number, y: number) {
			const loc = tzlookup(x, y)
			return loc
		}

		async function toTimeZone(time: Moment, zone: string) {
			return moment(time, `LT`).tz(zone).format(`LT`)
		}

		async function localTime(x: number) {
			const d = new Date()
			const localTimeVar = d.getTime()
			const localOffset = d.getTimezoneOffset() * 60000
			const utc = localTimeVar + localOffset
			const time = utc + 1000 * x
			const nd = new Date(time)
			const ex = moment(nd).format(`lll`)
			return ex
		}
	},
}
