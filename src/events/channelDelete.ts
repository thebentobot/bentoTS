import { Event } from '../interfaces'
import database from '../database/database'
import {
	initModels,
	modLog,
	messageLog,
	welcome,
	bye,
	guild,
	memberLog,
	roleChannel,
	announcementTime,
	channelDisable,
	announcementSchedule,
} from '../database/models/init-models'
import { TextChannel, GuildChannel, Message } from 'discord.js'

export const event: Event = {
	name: `channelDelete`,
	run: async (client, channel: GuildChannel): Promise<Message | void> => {
		initModels(database)

		const guildData = await guild.findOne({
			where: { guildID: channel.guild.id },
		})
		const messageLogData = await messageLog.findOne({
			where: { channel: channel.id },
		})
		const memberLogData = await memberLog.findOne({
			where: { channel: channel.id },
		})
		const modLogData = await modLog.findOne({ where: { channel: channel.id } })
		const welcomeData = await welcome.findOne({
			where: { channel: channel.id },
		})
		const byeData = await bye.findOne({ where: { channel: channel.id } })
		const roleData = await roleChannel.findOne({
			where: { channelID: channel.id },
		})

		const announcementTimedData = await announcementTime.findAll({
			where: { channelID: channel.id },
		})

		const announcementScheduledData = await announcementSchedule.findAll({
			where: { channelID: channel.id },
		})

		await channelDisable.destroy({ where: { channelID: channel.id } })

		try {
			if (announcementTimedData && modLogData) {
				await announcementTime.destroy({ where: { channelID: channel.id } })
				const modLogChannel: TextChannel = client.channels.cache.get(`${modLogData?.channel}`) as TextChannel
				await modLogChannel.send(
					`The deleted channel called **${channel.name}** had reoccurring **announcements** and they have been deleted from Bento's database.\nIf you want announcements somewhere else, please use ${guildData?.prefix}announcement again.`,
				)
			}

			if (announcementScheduledData && modLogData) {
				await announcementTime.destroy({ where: { channelID: channel.id } })
				const modLogChannel: TextChannel = client.channels.cache.get(`${modLogData?.channel}`) as TextChannel
				await modLogChannel.send(
					`The deleted channel called **${channel.name}** had scheduled **announcements** and they have been deleted from Bento's database.\nIf you want announcements somewhere else, please use ${guildData?.prefix}announcement again.`,
				)
			}

			if (messageLogData && modLogData) {
				await messageLog.destroy({ where: { channel: channel.id } })
				const modLogChannel: TextChannel = client.channels.cache.get(`${modLogData?.channel}`) as TextChannel
				await modLogChannel.send(
					`The deleted channel called **${channel.name}** was a **message log channel** and has been deleted from Bento's database.\nIf you want a new message log channel, please use ${guildData?.prefix}messageLog again.`,
				)
			}

			if (welcomeData && modLogData) {
				await welcome.destroy({ where: { channel: channel.id } })
				const modLogChannel: TextChannel = client.channels.cache.get(`${modLogData?.channel}`) as TextChannel
				await modLogChannel.send(
					`The deleted channel called **${channel.name}** was a **welcome channel** and has been deleted from Bento's database.\nIf you want a new welcome channel and welcome message, please use ${guildData?.prefix}welcome again.`,
				)
			}

			if (byeData && modLogData) {
				await bye.destroy({ where: { channel: channel.id } })
				const modLogChannel: TextChannel = client.channels.cache.get(`${modLogData?.channel}`) as TextChannel
				await modLogChannel.send(
					`The deleted channel called **${channel.name}** was a **bye channel** and has been deleted from Bento's database.\nIf you want a new bye channel and bye message, please use ${guildData?.prefix}bye again.`,
				)
			}

			if (memberLogData && modLogData) {
				await memberLog.destroy({ where: { channel: channel.id } })
				const modLogChannel: TextChannel = client.channels.cache.get(`${modLogData?.channel}`) as TextChannel
				await modLogChannel.send(
					`The deleted channel called **${channel.name}** was a **member log channel** and has been deleted from Bento's database.\nIf you want a new member log channel, please use ${guildData?.prefix}memberlog again.`,
				)
			}

			if (roleData && modLogData) {
				await roleChannel.destroy({ where: { channelID: channel.id } })
				const modLogChannel: TextChannel = client.channels.cache.get(`${modLogData?.channel}`) as TextChannel
				await modLogChannel.send(
					`The deleted channel called **${channel.name}** was a **role channel** and has been deleted from Bento's database.\nIf you want a new role channel and role functionality, please use ${guildData?.prefix}role again.`,
				)
			}

			if (modLogData) {
				const modLogChannel: TextChannel = client.channels.cache.get(`${modLogData?.channel}`) as TextChannel
				return await modLogChannel.send(
					`A channel called **${channel.name}** under the category **${channel.parent}** was deleted.\nGet more info in the audit log.`,
				)
			}
		} catch (err) {
			console.log(`Error at channeldelete.ts, server ${channel.guild.id}\n\n${err}`)
		}
	},
}

/*
Explanation for the specification and import of TextChannel can be found here: https://github.com/discordjs/discord/issues/3622
*/
