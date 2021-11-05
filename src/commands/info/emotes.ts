import { MessageEmbed } from 'discord.js'
import { Command } from '../../interfaces'
import { trim } from '../../utils'

export const command: Command = {
	name: `emotes`,
	aliases: [`emote`],
	category: `info`,
	description: `Shows list of emotes from the server.`,
	usage: `emotes\nemotes animated\nemotes static`,
	website: `https://www.bentobot.xyz/commands#emotes`,
	run: async (client, message, args): Promise<any> => {
		if (!args.length) {
			const embed = new MessageEmbed()
				.setAuthor(message.guild.name, message.guild.iconURL({ format: `png` }))
				.setTitle(`All Emotes in ${message.guild.name}`)
				.setThumbnail(message.guild.iconURL({ format: `png`, size: 1024, dynamic: true }))
				.setFooter(`Amount of emotes - ${message.guild.emojis.cache.size}`)
				.setTimestamp()
				.setDescription(
					trim(
						message.guild.emojis.cache
							.map((emote) => (emote.animated ? `<a:${emote.name}:${emote.id}>` : `<:${emote.name}:${emote.id}>`))
							.join(` `),
						4096,
					),
				)
			return await message.channel.send(embed)
		}

		if (args[0] === `animated`) {
			const embed = new MessageEmbed()
				.setAuthor(message.guild.name, message.guild.iconURL({ format: `png` }))
				.setTitle(`All Animated Emotes in ${message.guild.name}`)
				.setThumbnail(message.guild.iconURL({ format: `png`, size: 1024, dynamic: true }))
				.setFooter(`Amount of Animated Emotes - ${message.guild.emojis.cache.array().filter((e) => e.animated).length}`)
				.setTimestamp()
				.setDescription(
					trim(
						message.guild.emojis.cache
							.array()
							.filter((e) => e.animated)
							.map((emote) => `<a:${emote.name}:${emote.id}>`)
							.join(` `),
						4096,
					),
				)
			return await message.channel.send(embed)
		}

		if (args[0] === `static`) {
			const embed = new MessageEmbed()
				.setAuthor(message.guild.name, message.guild.iconURL({ format: `png` }))
				.setTitle(`All Static Emotes in ${message.guild.name}`)
				.setThumbnail(message.guild.iconURL({ format: `png`, size: 1024, dynamic: true }))
				.setFooter(
					`Amount of Static Emotes - ${
						message.guild.emojis.cache.size - message.guild.emojis.cache.array().filter((e) => e.animated).length
					}`,
				)
				.setTimestamp()
				.setDescription(
					trim(
						message.guild.emojis.cache
							.array()
							.filter((e) => e.animated === false)
							.map((emote) => `<:${emote.name}:${emote.id}>`)
							.join(` `),
						4096,
					),
				)
			return await message.channel.send(embed)
		}
	},
}
