import { Command } from '../../interfaces'
import axios from 'axios'
import { flag } from 'country-emoji'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { codeToName } from 'country-emoji/dist/lib'
import moment from 'moment'
import { Message } from 'discord.js'

const openWeatherAPI = axios.create({
	baseURL: `https://api.openweathermap.org/data/2.5`,
})

export const command: Command = {
	name: `time`,
	aliases: [],
	category: `features`,
	description: `Displays the local time for a specifc city. \n If it shows a city from another country than the one you expected, try to add a country code (e.g. US, GB, DE) beside the city (remember a comma after city), as shown below \n if it does not show up either, it may not be included in the time API.`,
	usage: `time <city>, [country code]`,
	website: `https://www.bentobot.xyz/commands#time`,
	run: async (client, message, args): Promise<Message | undefined> => {
		console.log(`Reached ${command.name}.ts, guildID: ${message.guild?.id}`)

		try {
			if (!args[0]) {
				return message.channel
					.send(`You did not specify a city to check the time in!`)
					.then((m) => m.delete({ timeout: 5000 }))
			} else {
				const city: string = args.join(` `)

				try {
					const response = await openWeatherAPI.get(`/weather?`, {
						params: {
							q: city,
							units: `metric`,
							appid: process.env.WEATHERKEY,
							lang: `en`,
						},
					})
					const time = await localTime(response.data.timezone)
					return message.channel.send(
						`It's ${time} in ${response.data.name}, ${codeToName(response.data.sys.country)} ${flag(
							response.data.sys.country,
						)}`,
					)
				} catch {
					return message.channel.send(`No results found for the city \`${city}\`.`)
				}
			}
		} catch (err) {
			console.log(`Error at time.ts, server ${message.guild?.id}\n\n${err}`)
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
