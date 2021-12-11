import { Message, MessageEmbed } from 'discord.js'
import { Command } from '../../interfaces'
import { trim } from '../../utils'

export const command: Command = {
	name: `emotes`,
	aliases: [`emote`],
	category: `info`,
	description: `Shows list of emotes from the server.`,
	usage: `emotes\nemotes animated\nemotes static`,
	website: `https://www.bentobot.xyz/commands#emotes`,
	run: async (client, message, args): Promise<Message | undefined> => {
		console.log(`Reached ${command.name}.ts, guildID: ${message.guild?.id}`)

		try {
			if (!args.length) {
				try {
					const embed = new MessageEmbed()
						.setAuthor(message.guild?.name, message.guild?.iconURL({ format: `png` }) as string)
						.setTitle(`All Emotes in ${message.guild?.name}`)
						.setThumbnail(
							message.guild?.iconURL({
								format: `png`,
								size: 1024,
								dynamic: true,
							}) as string,
						)
						.setFooter(`Amount of emotes - ${message.guild?.emojis.cache.size}`)
						.setTimestamp()
						.setDescription(
							trim(
								message.guild?.emojis.cache
									.map((emote) => (emote.animated ? `<a:${emote.name}:${emote.id}>` : `<:${emote.name}:${emote.id}>`))
									.join(` `) as string,
								4096,
							),
						)
					return await message.channel.send(embed)
				} catch {
					return message.channel.send(`This server doesn't have any emotes.`)
				}
			}

			if (args[0] === `animated`) {
				try {
					const embed = new MessageEmbed()
						.setAuthor(message.guild?.name, message.guild?.iconURL({ format: `png` }) as string)
						.setTitle(`All Animated Emotes in ${message.guild?.name}`)
						.setThumbnail(
							message.guild?.iconURL({
								format: `png`,
								size: 1024,
								dynamic: true,
							}) as string,
						)
						.setFooter(
							`Amount of Animated Emotes - ${message.guild?.emojis.cache.array().filter((e) => e.animated).length}`,
						)
						.setTimestamp()
						.setDescription(
							trim(
								message.guild?.emojis.cache
									.array()
									.filter((e) => e.animated)
									.map((emote) => `<a:${emote.name}:${emote.id}>`)
									.join(` `) as string,
								4096,
							),
						)
					return await message.channel.send(embed)
				} catch {
					return message.channel.send(`This server doesn't have any animated emotes.`)
				}
			}

			if (args[0] === `static`) {
				try {
					const animatedEmotes = message.guild?.emojis.cache.array().filter((e) => e?.animated).length as number
					const embed = new MessageEmbed()
						.setAuthor(message.guild?.name, message.guild?.iconURL({ format: `png` }) as string)
						.setTitle(`All Static Emotes in ${message.guild?.name}`)
						.setThumbnail(
							message.guild?.iconURL({
								format: `png`,
								size: 1024,
								dynamic: true,
							}) as string,
						)
						.setFooter(`Amount of Static Emotes - ${(message.guild?.emojis.cache.size as number) - animatedEmotes}`)
						.setTimestamp()
						.setDescription(
							trim(
								message.guild?.emojis.cache
									.array()
									.filter((e) => e.animated === false)
									.map((emote) => `<:${emote.name}:${emote.id}>`)
									.join(` `) as string,
								4096,
							),
						)
					return await message.channel.send(embed)
				} catch {
					return message.channel.send(`This server doesn't have any static emotes`)
				}
			}
		} catch (err) {
			console.log(`Error at emotes.ts, server ${message.guild?.id}\n\n${err}`)
		}
	},
}
