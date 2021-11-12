/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { Message, MessageEmbed } from 'discord.js'
import { Command } from '../../interfaces'
import database from '../../database/database'
import { initModels, guild } from '../../database/models/init-models'
import { stripIndents } from 'common-tags'
import { trim, urlToColours } from '../../utils/index'

export const command: Command = {
	name: `commands`,
	aliases: [],
	category: `info`,
	description: `Displays a full list of bot commands categorised`,
	usage: `commands\ncommands web`,
	website: `https://www.bentobot.xyz/commands#commands`,
	run: async (client, message, args): Promise<Message> => {
		if (args[0] === `web`) {
			return message.channel.send(`https://www.bentobot.xyz/commands`)
		}
		initModels(database)
		const guildDB = await guild.findOne({
			raw: true,
			where: { guildID: message.guild?.id },
		})

		const embed = new MessageEmbed()
			.setColor(`${await urlToColours(client.user?.avatarURL({ format: `png` }) as string)}`)
			.setTitle(`Command List`)
			.setThumbnail(client.user?.avatarURL() as string)

		const commands = (category: string) => {
			return client.commands
				.filter((cmd) => cmd.category === category)
				.map((cmd) => `- \`${guildDB?.prefix + cmd.name}\``)
				.join(`\n`)
		}

		const info = client.categories
			.map((cat) => stripIndents`**${cat[0].toLowerCase() + cat.slice(1)}** \n${commands(cat)}`)
			.reduce((string, category) => `${string}\n${category}`)

		const desc = trim(
			`Use \`` +
				`${guildDB?.prefix}help <commandName>\` without the \`<>\` to see more information about a specific command.\n\n${info}`,
			2048,
		)

		return message.channel.send(embed.setDescription(desc))
	},
}
