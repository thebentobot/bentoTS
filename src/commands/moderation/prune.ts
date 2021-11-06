import { Message, TextChannel } from 'discord.js'
import { Command } from '../../interfaces'

export const command: Command = {
	name: `prune`,
	aliases: [],
	category: `moderation`,
	description: `Removes messages`,
	usage: `prune <1-100> [mention a user or a user id] [all channels or mention a channel or a channel id]`,
	website: `https://www.bentobot.xyz/commands#prune`,
	run: async (client, message, args): Promise<Message | undefined> => {
		if (!message.member?.hasPermission(`MANAGE_MESSAGES`))
			return message.channel
				.send(`You do not have permission to use this command.`)
				.then((m) => m.delete({ timeout: 5000 }))

		message.delete()

		const amount: number = parseInt(args[0]) // Amount of messages which should be deleted

		if (!amount)
			return message.channel
				.send(`You haven't given an amount of messages which should be deleted!`)
				.then((m) => m.delete({ timeout: 5000 })) // Checks if the `amount` parameter is given
		if (isNaN(amount))
			return message.channel.send(`The amount parameter isn\`t a number!`).then((m) => m.delete({ timeout: 5000 })) // Checks if the `amount` parameter is a number. If not, the command throws an error

		if (amount > 100)
			return message.channel
				.send(`You can\`t delete more than 100 messages at once!`)
				.then((m) => m.delete({ timeout: 5000 })) // Checks if the `amount` integer is bigger than 100
		if (amount < 1)
			return message.channel.send(`You have to delete at least 1 message!`).then((m) => m.delete({ timeout: 5000 })) // Checks if the `amount` integer is smaller than 1

		const currentchannel: TextChannel = client.channels.cache.get(message.channel.id) as TextChannel

		// deletes the messages in the same channel as where it's casted
		if (!args[1]) {
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

			if (args[2] === `all`) {
				// function below deletes all messages for a user in every existing channel, though only the one where he's in the 100 last messages
				client.guilds.cache.get(message.guild?.id as string)?.channels.cache.forEach((ch) => {
					if (ch.type === `text`) {
						const deleteMessages: Message[] = []
						const channel: TextChannel = client.channels.cache.get(ch.id) as TextChannel
						channel.messages.fetch({ limit: amount }).then((messages) => {
							messages.filter((m) => m.author.id === userID).forEach((msg) => deleteMessages.push(msg))
						})
						channel.bulkDelete(deleteMessages).catch(() => console.error(`bulkdelete past 14 days error`))
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
					const deleteMessages: Message[] = []
					const channel: TextChannel = message.guild?.channels.cache.get(channelID?.id as string) as TextChannel
					channel.messages.fetch({ limit: amount }).then((messages) => {
						messages.filter((m) => m.author.id === userID).forEach((msg) => deleteMessages.push(msg))
					})
					channel.bulkDelete(deleteMessages).catch(() => console.error(`bulkdelete past 14 days error`))
					return message.channel.send(
						`The messages for ${(await message.guild?.members.fetch(userID as string))?.user.username}#${
							(await message.guild?.members.fetch(userID as string))?.user.discriminator
						} was deleted`,
					)
				} catch {
					return message.channel.send(`Specify a valid channel please.`)
				}
			} else {
				const pruneMessages: Message[] = []
				await message.channel.messages.fetch({ limit: amount }).then((messages) => {
					messages.filter((m) => m.author.id === userID).forEach((msg) => pruneMessages.push(msg))
					currentchannel.bulkDelete(pruneMessages).catch(() => console.error(`bulkdelete past 14 days error`)) // Bulk deletes all messages that have been fetched and are not older than 14 days (due to the Discord API)
				})
				return message.channel.send(
					`The messages for ${(await message.guild?.members.fetch(userID as string))?.user.username}#${
						(await message.guild?.members.fetch(userID as string))?.user.discriminator
					} was deleted`,
				)
			}
		}
	},
}
