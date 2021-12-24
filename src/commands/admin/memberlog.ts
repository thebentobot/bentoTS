import { Command } from '../../interfaces'
import database from '../../database/database'
import { initModels, guild, memberLog, memberLogCreationAttributes } from '../../database/models/init-models'
import { Message, TextChannel } from 'discord.js'

export const command: Command = {
	name: `memberlog`,
	aliases: [],
	category: `admin`,
	description: `Get a member log in a specified channel, for logging changes, updates, and matters about the users of the server`,
	usage: `memberlog status\nmemberlog channel <channelID>\nmemberlog delete`,
	website: `https://www.bentobot.xyz/commands#memberlog`,
	run: async (client, message, args): Promise<Message | undefined> => {
		try {
			if (!message.member?.hasPermission(`MANAGE_CHANNELS`)) {
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
					`You must specify what you want to do with the member log settings.\nUse \`${guildData?.prefix}help memberlog\` to see how to use this command.`,
				)
			}

			if (args[0] === `status`) {
				const memberLogData = await memberLog.findOne({
					raw: true,
					where: { guildID: message.guild?.id },
				})
				if (memberLogData !== null) {
					return message.channel.send(`
            The member log is currently \`enabled\` on this server.\nThe member log channel on this server is currently in <#${memberLogData?.channel}>.`)
				} else {
					return message.channel.send(
						`This server doesn't have a member log.\nUse \`${guildData?.prefix}help memberlog\` to see how to setup a member log for this server.`,
					)
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
					return message.channel.send(`Your channel id \`${args[1]}\` was invalid.\nPlease use a valid channel id.`)
				}

				const memberLogData = await memberLog.findOne({
					raw: true,
					where: { guildID: message.guild?.id },
				})

				if (memberLogData === null) {
					const attr: memberLogCreationAttributes = {
						guildID: BigInt(message.guild?.id as string),
						channel: BigInt(channel),
					}
					const creatememberLogChannelData = await memberLog.create(attr)
					return message.channel.send(
						`Your member log channel was assigned! It is in <#${creatememberLogChannelData.channel}> `,
					)
				} else {
					await memberLog.update({ channel: BigInt(channel) }, { where: { guildID: message.guild?.id } })

					return message.channel.send(`Your member log channel was updated! It is now <#${channel}>`)
				}
			}

			if (args[0] === `delete`) {
				await memberLog.destroy({ where: { channel: message.guild?.id } })
				return message.channel.send(
					`Your member log channel is deleted in Bento's database and Bento will from now on not log changes, updates, and matters about the users of the server.\nPlease use \`${guildData?.prefix}memberlog channel <channelID>\` to enable it again.`,
				)
			}
		} catch (err) {
			console.log(`Error at memberlog.ts, server ${message.guild?.id}\n\n${err}`)
		}
	},
}
