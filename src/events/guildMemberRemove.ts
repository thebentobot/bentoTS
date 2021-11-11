import { Event } from '../interfaces'
import database from '../database/database'
import {
	initModels,
	guildMember,
	user,
	bye,
	bento,
	horoscope,
	lastfm,
	weather,
	memberLog,
	ban,
	kick,
	mute,
	warning,
	reminder,
	notificationMessage,
	profile,
	rpsGame,
} from '../database/models/init-models'
import { GuildMember, Message, MessageEmbed, TextChannel } from 'discord.js'
import moment from 'moment'

export const event: Event = {
	name: `guildMemberRemove`,
	run: async (client, member: GuildMember): Promise<Message | void> => {
		initModels(database)

		const memberLogData = await memberLog.findOne({ raw: true, where: { guildID: member.guild.id } })
		if (memberLogData) {
			const banData = await ban.findAndCountAll({ raw: true, where: { userID: member.user.id } })
			const kickData = await kick.findAndCountAll({ raw: true, where: { userID: member.user.id } })
			const muteData = await mute.findAndCountAll({ raw: true, where: { userID: member.user.id } })
			const warningData = await warning.findAndCountAll({ raw: true, where: { userID: member.user.id } })

			const currentMuteData = await mute.findOne({
				raw: true,
				where: { userID: member.user.id, guildID: member.guild.id, MuteStatus: true },
			})

			const channel = member.guild.channels.cache.get(`${memberLogData.channel}`) as TextChannel
			const embed = new MessageEmbed()
				.setTitle(`${member.user.username}#${member.user.discriminator} left the server!`)
				.setThumbnail(`${member.user.avatarURL({ format: `png`, dynamic: true, size: 1024 })}`)
				.setColor(`#FF0000	`)
				.setFooter(`UserID: ${member.user.id}`)
				.setTimestamp()
				.setDescription(
					`${
						currentMuteData ? `The user was **muted** when the user left the server.\n` : ``
					}**Account created:** ${moment(member.user.createdAt).format(
						`D/M/YYYY HH:mm:ss Z`,
					)}\n**Bans on other servers:** \`${banData.count}\`.\n**Kicks from other servers:** \`${
						kickData.count
					}\`.\n**Mutes on other servers:** \`${muteData.count}\`.\n**Warnings on other servers:** \`${
						warningData.count
					}\`.`,
				)
			await channel.send(embed)
		}

		await guildMember.destroy({ where: { guildID: member.guild.id, userID: member.user.id } })

		const userData = await user.findOne({ where: { userID: member.user.id } })

		if (userData === null) {
			await bento.destroy({ where: { userID: member.user.id } })
			await rpsGame.destroy({ where: { userID: member.user.id } })
			await horoscope.destroy({ where: { userID: member.user.id } })
			await lastfm.destroy({ where: { userID: member.user.id } })
			await weather.destroy({ where: { userID: member.user.id } })
			await reminder.destroy({ where: { userID: member.user.id } })
			await notificationMessage.destroy({ where: { userID: member.user.id } })
			await profile.destroy({ where: { userID: member.user.id } })
			await user.destroy({ where: { userID: member.user.id } })
		}

		try {
			const byeData = await bye.findOne({ where: { guildID: member.guild.id } })

			if (byeData?.message && byeData?.channel) {
				const kickData = await kick.findOne({ where: { guildID: member.guild.id, userID: member.id } })
				const banData = await kick.findOne({ where: { guildID: member.guild.id, userID: member.id } })
				if (banData !== null || kickData !== null) return

				const channel = member.guild.channels.cache.get(`${byeData?.channel}`) as TextChannel
				const msg = byeData?.message
				const msgClean = msg as string
				msgClean
					.replace(`{user}`, `${member.user}`)
					.replace(`{username}`, member.user.username)
					.replace(`{discriminator}`, member.user.discriminator)
					.replace(`{usertag}`, member.user.username + `#` + member.user.discriminator)
					.replace(`{server}`, member.guild.name)
					.replace(`{memberCount}`, `${member.guild.memberCount}`)
					.replace(`{space}`, `\n`)
					.replace(`\\`, ``)
					.replace(`\\`, ``)
					.replace(`\\`, ``)
					.replace(`\\`, ``)
					.replace(`\\`, ``)
					.replace(`\\`, ``)

				await channel.send(msgClean)
			}
		} catch {
			return
		}
	},
}
