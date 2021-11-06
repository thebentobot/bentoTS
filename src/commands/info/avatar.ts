import { Message, MessageEmbed, User } from 'discord.js'
import { Command } from '../../interfaces'
import { urlToColours } from '../../utils/urlToColours'

export const command: Command = {
	name: `avatar`,
	aliases: [`pfp`],
	category: `info`,
	description: `Shows user's avatars, or your own if you don't mention anyone. You can also check the server avatar and banner.`,
	usage: `avatar [userID or mention a user]\navatar server\navatar banner`,
	website: `https://www.bentobot.xyz/commands#avatar`,
	run: async (client, message, args): Promise<Message> => {
		if (!args.length) {
			const embed = new MessageEmbed()
				.setColor(`${await urlToColours(message.author.avatarURL({ format: `png` }) as string)}`)
				.setTitle(`${message.author.tag}'s avatar`)
				.setImage(message.author.avatarURL({ format: `png`, size: 1024, dynamic: true }) as string)
				.setTimestamp()
			return message.channel.send(embed)
		}

		if (args[0] === `server`) {
			if (message.guild?.iconURL() === null) return message.channel.send(`This server does not have an icon/avatar`)
			const embed = new MessageEmbed()
				.setColor(`${await urlToColours(message.guild?.iconURL({ format: `png` }) as string)}`)
				.setTitle(`${message.guild?.name}'s avatar`)
				.setImage(message.guild?.iconURL({ format: `png`, size: 1024, dynamic: true }) as string)
				.setTimestamp()
			return message.channel.send(embed)
		}

		if (args[0] === `banner`) {
			if (message.guild?.bannerURL() === null) return message.channel.send(`This server does not have a banner`)
			const embed = new MessageEmbed()
				.setColor(`${await urlToColours(message.guild?.bannerURL({ format: `png` }) as string)}`)
				.setTitle(`${message.guild?.name}'s banner`)
				.setImage(message.guild?.bannerURL({ format: `png`, size: 1024 }) as string)
				.setTimestamp()
			return message.channel.send(embed)
		}

		const userID = getUserFromMention(args[0])

		const user = (await client.users
			.fetch(`${userID}`)
			.catch(() => console.error(`fetch user error in avatar.ts line 44`))) as User

		try {
			const embed = new MessageEmbed()
				.setColor(`${await urlToColours(user.avatarURL({ format: `png` }) as string)}`)
				.setTitle(`${user.username + `#` + user.discriminator}'s avatar`)
				.setImage(user.avatarURL({ format: `png`, size: 1024, dynamic: true }) as string)
				.setTimestamp()
			return message.channel.send(embed)
		} catch {
			return message.channel.send(`Invalid user.`)
		}

		function getUserFromMention(mention: string) {
			if (!mention) return

			if (mention.startsWith(`<@`) && mention.endsWith(`>`)) {
				mention = mention.slice(2, -1)

				if (mention.startsWith(`!`)) {
					mention = mention.slice(1)
				}

				return client.users.cache.get(mention)?.id
			} else {
				return mention
			}
		}
	},
}
