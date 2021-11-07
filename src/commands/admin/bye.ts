import { Command } from '../../interfaces'
import database from '../../database/database'
import { initModels, bye, byeCreationAttributes, guild } from '../../database/models/init-models'
import { Message, TextChannel } from 'discord.js'

export const command: Command = {
	name: `bye`,
	aliases: [],
	category: `admin`,
	description: `Bye message settings, for when a member leaves.\nDisabled by default and only works by assigning <channel> and <content>.\n{user} or {usertag} - mention user\n{username} - mention username\n{discriminator} - mention the #0000 for the user\n{server} - mention server\n{memberCount} - the member count\n{space} - adds a new line\nUse reverse / (slash) in front of a channel e.g. for linking to a rules channel.`,
	usage: ` is the prefix\nbye <status>\nbye <channel> <channelID>\nbye <message> <content>\nbye <delete>`,
	website: `https://www.bentobot.xyz/commands#bye`,
	run: async (client, message, args): Promise<Message | undefined> => {
		if (!message.member?.hasPermission(`MANAGE_MESSAGES`)) {
			return message.channel
				.send(`You do not have permission to use this command!`)
				.then((m) => m.delete({ timeout: 10000 }))
		}

		initModels(database)

		const guildData = await guild.findOne({ raw: true, where: { guildID: message.guild?.id } })

		if (args.length < 1) {
			return message.channel.send(
				`You must specify what you want to do with bye messages.\nUse \`${guildData?.prefix}help bye\` to see how to use this command.`,
			)
		}

		if (args[0] === `status`) {
			try {
				const byeData = await bye.findOne({ raw: true, where: { guildID: message.guild?.id } })
				return message.channel.send(
					`Bye messages is currently \`enabled\` on this server.\nThe Bye message on this server is currently: \`${byeData?.message}\`.\nThe Bye message channel on this server is currently in <#${byeData?.channel}>.`,
				)
			} catch {
				return message.channel.send(
					`This server doesn't have a bye message for when people leave.\nUse \`${guildData?.prefix}help bye\` to see how to setup a bye message for this server.`,
				)
			}
		}

		if (args[0] === `message`) {
			if (!args[1]) return message.channel.send(`Please write a bye message`)
			const msg = args.slice(1).join(` `)

			const byeData = await bye.findOne({ raw: true, where: { guildID: message.guild?.id } })

			if (byeData === null) {
				const attr: byeCreationAttributes = {
					guildID: BigInt(message.guild?.id as string),
					message: msg,
				}
				const createByeMessageData = await bye.create(attr)

				return message.channel.send(
					`Your bye message was created! It is: ${createByeMessageData.message}. You need to specify a channel where your bye message will appear\nAssign a channel by the following command: ${guildData?.prefix}bye channel <channelID>`,
				)
			} else {
				await bye.update({ message: msg }, { where: { guildID: message.guild?.id } })

				if (byeData.channel === null) {
					return message.channel.send(
						`Your bye message was updated! It is now: ${msg}. You need to specify a channel where your bye message will appear\nAssign a channel by the following command: ${guildData?.prefix}bye channel <channelID>`,
					)
				} else {
					return message.channel.send(
						`Your bye message was updated! It is now: ${msg}.\nThe message will now appear in <#${byeData.channel}>`,
					)
				}
			}
		}

		if (args[0] === `channel`) {
			if (!args[1]) return message.channel.send(`Please assign a channel id as the second argument`)
			let channel: string
			try {
				const channelID =
					message.mentions.channels.first() || (message.guild?.channels.cache.get(args[1]) as TextChannel)
				channel = channelID.id
			} catch {
				return message.channel.send(`Your channel id ${args[1]} was invalid.\nPlease use a valid channel id.`)
			}

			const byeData = await bye.findOne({ raw: true, where: { guildID: message.guild?.id } })

			if (byeData === null) {
				const attr: byeCreationAttributes = {
					guildID: BigInt(message.guild?.id as string),
					channel: BigInt(channel),
				}
				const createByeChannelData = await bye.create(attr)

				return message.channel.send(
					`Your bye channel was assigned! It is: <#${createByeChannelData.channel}> You need to specify a message to be sent in the channel\nCreate a bye message for when members leave the server by the following command: ${guildData?.prefix}bye message <bye message>`,
				)
			} else {
				await bye.update({ channel: BigInt(channel) }, { where: { guildID: message.guild?.id } })

				if (byeData.message === null) {
					return message.channel.send(
						`Your bye channel was updated! It is now: <#${channel}> You need to specify a message to be sent in the channel\nCreate a bye message for when members leave the server by the following command: ${guildData?.prefix}bye message <bye message>`,
					)
				} else {
					return message.channel.send(
						`Your bye channel was updated! It is now: <#${channel}>\nThe bye message: "${byeData.message}" will now be sent in the newly assigned channel.`,
					)
				}
			}
		}

		if (args[0] === `delete`) {
			try {
				await bye.destroy({ where: { channel: message.guild?.id } })
				return message.channel.send(
					`Your bye configuration is now deleted in Bento's database and Bento will from now on not say bye to users who leave.\nPlease use ${guildData?.prefix}bye to enable bye again.`,
				)
			} catch {
				return message.channel.send(`You don't have a bye message enabled.`)
			}
		}
	},
}
