import { Message, MessageEmbed } from 'discord.js'
import { Command } from '../../interfaces'
import { urlToColours } from '../../utils'

export const command: Command = {
	name: `support`,
	aliases: [`patreon`, `kofi`, `topgg`],
	category: `info`,
	description: `How to support Bento 🍱`,
	usage: `support`,
	website: `https://www.bentobot.xyz/commands#support`,
	run: async (client, message): Promise<Message> => {
		console.log(`Reached ${command.name}.ts, guildID: ${message.guild?.id}`)

		const embed = new MessageEmbed()
			.setTitle(`Support Bento 🍱`)
			.setThumbnail(
				client.user?.avatarURL({
					dynamic: true,
					format: `png`,
					size: 1024,
				}) as string,
			)
			.setDescription(
				`Support to ensure a stellar performance and a top quality experience and joy for thousands of users when using **Bento** 🍱\nAnd that it is free for **everyone**.\nSupport on **Patreon** for extra benefits.\nGet a Bento 🍱 for each tip on **Ko-fi**.\nVote for **free** on top.gg for **5 Bento** 🍱`,
			)
			.setTimestamp()
			.setColor(`${await urlToColours(client.user?.avatarURL({ format: `png` }) as string)}`)
			.addField(`Patreon 🟠`, `https://www.patreon.com/bentobot`)
			.addField(`Ko-fi ❤️☕`, `https://ko-fi.com/bentobot`)
			.addField(`top.gg`, `https://top.gg/bot/787041583580184609`)
			.addField(`Read more about what you support`, `https://bentobot.xyz/support`)
		return message.channel.send(embed)
	},
}
