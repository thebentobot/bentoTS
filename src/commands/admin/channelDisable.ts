import { Command } from '../../interfaces'
import database from '../../database/database'
import { initModels, guild, channelDisable, channelDisableCreationAttributes } from '../../database/models/init-models'
import { Message, MessageEmbed, TextChannel } from 'discord.js'
import { trim } from '../../utils'

export const command: Command = {
	name: `channeldisable`,
	aliases: [`chd`],
	category: `admin`,
	description: `Disable Bento commands for multiple channels (unless it's a user who has permission to manage messages)`,
	usage: `channeldisable <status>\nchanneldisable set <channelID or channel mention>\nchanneldisable delete <channelID or channel mention>\nchanneldisable list`,
	website: `https://www.bentobot.xyz/commands#channeldisable`,
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
					`You must specify what you want to do with the channel disable settings.\nUse \`${guildData?.prefix}help channelDisable\` to see how to use this command.`,
				)
			}

			if (args[0] === `status`) {
				const channelDisableData = await channelDisable.findOne({
					raw: true,
					where: { guildID: message.guild?.id },
				})
				if (channelDisableData !== null) {
					return message.channel.send(
						`This server has ${client.user} disabled in one of the text channels.\nUse \`${guildData?.prefix}channelDisable list\` to check which channels has ${client.user} disabled.`,
					)
				} else {
					return message.channel.send(
						`This server hasn't disabled ${client.user} in one of their channels.\nUse \`${guildData?.prefix}help channelDisable\` to see how to disable ${client.user} in one of the channels on this server.`,
					)
				}
			}

			if (args[0] === `set`) {
				if (!args[1]) return message.channel.send(`Please assign a channel id as the second argument`)
				let channel: string
				try {
					const channelID =
						message.mentions.channels.first() || (message.guild?.channels.cache.get(args[1]) as TextChannel)
					channel = channelID.id
				} catch {
					return message.channel.send(`Your channel id \`${args[1]}\` was invalid.\nPlease use a valid channel id.`)
				}

				const channelDisableData = await channelDisable.findOne({
					raw: true,
					where: { guildID: message.guild?.id, channelID: channel },
				})

				if (channelDisableData === null) {
					const attr: channelDisableCreationAttributes = {
						guildID: BigInt(message.guild?.id as string),
						channelID: BigInt(channel),
					}
					const creatememberLogChannelData = await channelDisable.create(attr)
					return message.channel.send(
						`<#${creatememberLogChannelData.channelID}> is now disabled from any ${client.user} commands, unless you got mod rights.`,
					)
				} else {
					return message.channel.send(`<#${channelDisableData.channelID}> is already a disabled channel.`)
				}
			}

			if (args[0] === `delete`) {
				if (!args[1]) return message.channel.send(`Please assign a channel id as the second argument`)
				let channel: string
				try {
					const channelID =
						message.mentions.channels.first() || (message.guild?.channels.cache.get(args[1]) as TextChannel)
					channel = channelID.id
				} catch {
					return message.channel.send(`Your channel id \`${args[1]}\` was invalid.\nPlease use a valid channel id.`)
				}

				const channelDisableData = await channelDisable.destroy({
					where: { guildID: message.guild?.id, channelID: channel },
				})

				if (channelDisableData > 0) {
					return message.channel.send(
						`Your channel id <#${channel}> was deleted from the disable list.\nIt is now possible to use ${client.user} commands again in <#${channel}>`,
					)
				} else {
					return message.channel.send(`Your channel id <#${channel}> was not disabled.`)
				}
			}

			if (args[0] === `list`) {
				const channels = await channelDisable.findAll({
					where: { guildID: message.guild?.id },
				})
				if (!channels.length) return message.channel.send(`You don't have any channels disabled for ${client.user}.`)

				const embed = new MessageEmbed()
					.setAuthor(message.guild?.name, message.guild?.iconURL({ format: `png`, dynamic: true }) as string)
					.setTitle(`All channels in ${message.guild?.name} where ${client.user?.username} is disabled`)
					.setThumbnail(
						message.guild?.iconURL({
							format: `png`,
							size: 1024,
							dynamic: true,
						}) as string,
					)
					.setFooter(`Amount of channels - ${channels.length}`)
					.setTimestamp()
					.setDescription(trim(channels.map((channel) => `<#${channel.channelID}>`).join(` `) as string, 4096))
				return await message.channel.send(embed)
			}
		} catch (err) {
			console.log(`Error at channeldisable.ts, server ${message.guild?.id}\n\n${err}`)
		}
	},
}
