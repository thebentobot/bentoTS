import { Command } from '../../interfaces'
import database from '../../database/database'
import { initModels, welcome, welcomeCreationAttributes, guild } from '../../database/models/init-models'
import { Message, TextChannel } from 'discord.js'

export const command: Command = {
	name: `welcome`,
	aliases: [],
	category: `admin`,
	description: `welcome message settings, for when a member joins.\nDisabled by default and only works by assigning <channel> and <content>.\n{user} or {usertag} - mention user\n{username} - mention username\n{discriminator} - mention the #0000 for the user\n{server} - mention server\n{memberCount} - the member count\n{space} - adds a new line\nUse reverse / (slash) in front of a channel e.g. for linking to a rules channel.`,
	usage: `welcome status\nwelcome channel <channelID>\nwelcome msg/message <content>\nwelcome delete`,
	website: `https://www.bentobot.xyz/commands#welcome`,
	run: async (client, message, args): Promise<Message | undefined> => {
		if (!message.member?.hasPermission(`MANAGE_MESSAGES`)) {
			return message.channel
				.send(`You do not have permission to use this command!`)
				.then((m) => m.delete({ timeout: 10000 }))
		}

		initModels(database)

		const guildData = await guild.findOne({
			raw: true,
			where: { guildID: message.guild?.id },
		})

		if (args.length < 1) {
			return message.channel.send(
				`You must specify what you want to do with welcome messages.\nUse \`${guildData?.prefix}help welcome\` to see how to use this command.`,
			)
		}

		if (args[0] === `status`) {
			const welcomeData = await welcome.findOne({
				raw: true,
				where: { guildID: message.guild?.id },
			})
			if (welcomeData !== null) {
				if (welcomeData.message && welcomeData.channel) {
					return message.channel.send(`
            welcome messages is currently \`enabled\` on this server.\nThe welcome message on this server is currently: \`${welcomeData.message}\`.\nThe welcome message channel on this server is currently in <#${welcomeData.channel}>.`)
				} else if (welcomeData.message) {
					return message.channel.send(`
            welcome messages is currently \`disabled\` on this server.\nThe welcome message on this server is currently: \`${welcomeData?.message}\`.\nThe welcome message channel on this server is currently not set.`)
				} else if (welcomeData.channel) {
					return message.channel.send(`
            welcome messages is currently \`disabled\` on this server.\nThe welcome message on this server is currently not set.\nThe welcome message channel on this server is currently in <#${welcomeData.channel}>.`)
				}
			} else {
				return message.channel.send(
					`This server doesn't have a welcome message for when people join.\nUse \`${guildData?.prefix}help welcome\` to see how to setup a welcome message for this server.`,
				)
			}
		}

		if (args[0] === `msg` || args[0] === `message`) {
			if (!args[1]) return message.channel.send(`Please write a welcome message`)
			const msg = args.slice(1).join(` `)

			const welcomeData = await welcome.findOne({
				raw: true,
				where: { guildID: message.guild?.id },
			})

			if (welcomeData === null) {
				const attr: welcomeCreationAttributes = {
					guildID: BigInt(message.guild?.id as string),
					message: msg,
				}
				const createwelcomeMessageData = await welcome.create(attr)
				return message.channel.send(
					`Your welcome message was created! It is: ${createwelcomeMessageData.message}. You need to specify a channel where your welcome message will appear\nAssign a channel by the following command: ${guildData?.prefix}welcome channel <channelID>`,
				)
			} else {
				await welcome.update({ message: msg }, { where: { guildID: message.guild?.id } })

				if (!welcomeData.channel) {
					return message.channel.send(
						`Your welcome message was updated! It is now: ${msg}. You need to specify a channel where your welcome message will appear\nAssign a channel by the following command: ${guildData?.prefix}welcome channel <channelID>`,
					)
				} else {
					return message.channel.send(
						`Your welcome message was updated! It is now: ${msg}.\nThe message will now appear in <#${welcomeData.channel}>`,
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

			const welcomeData = await welcome.findOne({
				raw: true,
				where: { guildID: message.guild?.id },
			})

			if (welcomeData === null) {
				const attr: welcomeCreationAttributes = {
					guildID: BigInt(message.guild?.id as string),
					channel: BigInt(channel),
				}
				const createwelcomeChannelData = await welcome.create(attr)

				return message.channel.send(
					`Your welcome channel was assigned! It is: <#${createwelcomeChannelData.channel}> You need to specify a message to be sent in the channel\nCreate a welcome message for when members join the server by the following command: ${guildData?.prefix}welcome message <welcome message>`,
				)
			} else {
				await welcome.update({ channel: BigInt(channel) }, { where: { guildID: message.guild?.id } })

				if (welcomeData.message === null) {
					return message.channel.send(
						`Your welcome channel was updated! It is now: <#${channel}> You need to specify a message to be sent in the channel\nCreate a welcome message for when members join the server by the following command: ${guildData?.prefix}welcome message <welcome message>`,
					)
				} else {
					return message.channel.send(
						`Your welcome channel was updated! It is now: <#${channel}>\nThe welcome message: "${welcomeData.message}" will now be sent in the newly assigned channel.`,
					)
				}
			}
		}

		if (args[0] === `delete`) {
			await welcome.destroy({ where: { channel: message.guild?.id } })
			return message.channel.send(
				`Your welcome configuration is now deleted in Bento's database and Bento will from now on not say welcome to users who join.\nPlease use ${guildData?.prefix}welcome to enable welcome again.`,
			)
		}
	},
}
