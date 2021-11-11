import { Command } from '../../interfaces'
import { Message, MessageEmbed } from 'discord.js'
import database from '../../database/database'
import { urlToColours } from '../../utils/urlToColours'

export const command: Command = {
	name: `ping`,
	aliases: [],
	category: `info`,
	description: `Shows the latency for Bento Bot, the Discord API and the bot's database in PostgreSQL`,
	usage: `ping`,
	website: `https://www.bentobot.xyz/commands#ping`,
	run: async (client, message): Promise<Message> => {
		const msgTimeStart = new Date().getTime()
		await message.channel.send(`🏓 Pinging...`)
		const msgTimeEnd = new Date().getTime()

		try {
			const dbTimeStart = new Date().getTime()
			await database.query(`select 1 + 1`)
			const dbTimeEnd = new Date().getTime()
			const dbTime = dbTimeEnd - dbTimeStart

			const embed = new MessageEmbed()
				.setColor(`${await urlToColours(client.user?.avatarURL({ format: `png` }) as string)}`)
				.setTitle(`🏓 Pong!`)
				.setDescription(
					`Bot Latency is **${Math.floor(msgTimeEnd - msgTimeStart)} ms** \nAPI Latency is **${Math.round(
						client.ws.ping,
					)} ms**\nPostgreSQL Latency is **${dbTime} ms**`,
				)

			return message.channel.send(embed)
		} catch (error) {
			const embed = new MessageEmbed()
				.setColor(`${await urlToColours(client.user?.avatarURL({ format: `png` }) as string)}`)
				.setTitle(`🏓 Pong!`)
				.setDescription(
					`Bot Latency is **${Math.floor(msgTimeEnd - msgTimeStart)} ms** \nAPI Latency is **${Math.round(
						client.ws.ping,
					)} ms**\nPostgreSQL connection was not established, error: ${error}`,
				)

			return message.channel.send(embed)
		}
	},
}
