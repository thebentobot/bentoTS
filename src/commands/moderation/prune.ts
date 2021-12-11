import { Message, TextChannel } from 'discord.js'
import { Command } from '../../interfaces'

export const command: Command = {
	name: `prune`,
	aliases: [],
	category: `moderation`,
	description: `Removes messages. If no user is mentioned it deletes messages in the current channel. If a user is mentioned, but no channel, it deletes the specified amount of messages sent by the user in all channels on the server.`,
	usage: `prune <1-100> [mention a user or a user id] [all, or mention a channel or a channel id]`,
	website: `https://www.bentobot.xyz/commands#prune`,
	run: async (client, message, args): Promise<Message | undefined> => {
		console.log(`Reached ${command.name}.ts, guildID: ${message.guild?.id}`)

		try {
			if (!message.guild?.me?.hasPermission(`MANAGE_MESSAGES`)) {
				return await message.channel.send(
					`**ERROR!** ${client.user} does not have permission to delete messages on this server.`,
				)
			}

			if (!message.member?.hasPermission(`MANAGE_MESSAGES`)) {
				message.delete()
				return message.channel
					.send(`${message.author} You do not have permission to use this command.`)
					.then((m) => m.delete({ timeout: 5000 }))
			}

			const amount: number = parseInt(args[0]) // Amount of messages which should be deleted

			if (isNaN(amount)) {
				message.delete()
				return message.channel
					.send(`${message.author} The amount parameter isn't a number!`)
					.then((m) => m.delete({ timeout: 5000 }))
			}

			if (!amount) {
				message.delete()
				return message.channel
					.send(`${message.author} You haven't given an amount of messages which should be deleted!`)
					.then((m) => m.delete({ timeout: 5000 }))
			}

			if (amount > 100) {
				message.delete()
				return message.channel
					.send(` ${message.author}You can't delete more than 100 messages at once!`)
					.then((m) => m.delete({ timeout: 5000 }))
			}

			if (amount < 1) {
				message.delete()
				return message.channel
					.send(`${message.author} You have to delete at least 1 message!`)
					.then((m) => m.delete({ timeout: 5000 }))
			}

			const currentchannel: TextChannel = client.channels.cache.get(message.channel.id) as TextChannel

			// deletes the messages in the same channel as where it's casted
			if (!args[1]) {
				message.delete()
				await message.channel.messages.fetch({ limit: amount }).then((messages) => {
					// Fetches the messages
					currentchannel.bulkDelete(messages).catch(() => console.error(`bulkdelete past 14 days error`)) // Bulk deletes all messages that have been fetched and are not older than 14 days (due to the Discord API)
				})
			}

			if (args[1]) {
				let userID: string | undefined
				try {
					const theUser = message.mentions?.members?.has(client.user?.id as string)
						? message.mentions.members.size > 1
							? message.mentions.members.last()
							: message.member
						: message.mentions?.members?.first() || (await message.guild?.members.fetch(args[1]))
					userID = theUser?.id
				} catch {
					return message.channel.send(`Specify a valid user please.`)
				}

				if (!args[2] || args[2] === `all`) {
					// function below deletes all messages for a user in every existing channel, though only the one where he's in the 100 last messages
					client.guilds.cache.get(message.guild?.id as string)?.channels.cache.forEach((ch) => {
						if (ch.type === `text`) {
							const channel: TextChannel = client.channels.cache.get(ch.id) as TextChannel
							channel.messages.fetch({ limit: amount }).then((messages) => {
								messages.filter((m) => m.author.id === userID).forEach((msg) => msg.delete())
							})
						}
					})
					return message.channel.send(
						`The messages for ${(await message.guild?.members.fetch(userID as string))?.user.username}#${
							(await message.guild?.members.fetch(userID as string))?.user.discriminator
						} was deleted`,
					)
				}

				if (args[2]) {
					try {
						const channelID =
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							message.mentions.channels.first() || message.guild?.channels.cache.get(args[2].match(/<#(\d+)>/)![1])
						const channel: TextChannel = message.guild?.channels.cache.get(channelID?.id as string) as TextChannel
						channel.messages.fetch({ limit: amount }).then((messages) => {
							messages.filter((m) => m.author.id === userID).forEach((msg) => msg.delete())
						})
						return message.channel.send(
							`The messages for ${(await message.guild?.members.fetch(userID as string))?.user.username}#${
								(await message.guild?.members.fetch(userID as string))?.user.discriminator
							} was deleted`,
						)
					} catch {
						return message.channel.send(`Specify a valid channel please.`)
					}
				}
			}
		} catch (err) {
			console.log(`Error at prune.ts, server ${message.guild?.id}\n\n${err}`)
		}
	},
}
