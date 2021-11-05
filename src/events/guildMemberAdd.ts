import { Event } from '../interfaces'
import database from '../database/database'
import {
	initModels,
	welcome,
	autoRole,
	mute,
	muteRole,
	memberLog,
	ban,
	kick,
	warning,
} from '../database/models/init-models'
import { GuildMember, Message, MessageEmbed, Role, TextChannel } from 'discord.js'
import moment from 'moment'

export const event: Event = {
	name: `guildMemberAdd`,
	run: async (client, member: GuildMember): Promise<Message | void> => {
		initModels(database)

		const currentMute = await mute.findOne({
			raw: true,
			where: { userID: member.id, guildID: member.guild.id, MuteStatus: true },
		})

		if (currentMute) {
			const muteRoleData = await muteRole.findOne({ raw: true, where: { guildID: member.guild.id } })
			const role = member.guild.roles.cache.get(`${muteRoleData?.roleID}`)
			try {
				await member.roles.add(role as Role)
			} catch {
				console.log(`${member.guild.id} has deleted a mute role and can't mute the user`)
			}
		}
		/*
        const userAttr: userCreationAttributes = {
            userID: BigInt(member.id),
            discriminator: member.user.discriminator,
            xp: 0,
            level: 1,
            username: member.user.username,
            avatarURL: member.user.avatarURL()
        }

        await user.findOrCreate({where: { userID: member.id}, defaults: userAttr});

        const guildMemberAttr: guildMemberCreationAttributes = {
            userID: BigInt(member.id),
            guildID: BigInt(member.guild.id),
            xp: 0,
            level: 1,
            avatarURL: member.user.avatarURL()
        }

        await guildMember.create(guildMemberAttr);
        */
		const autoRoleData = await autoRole.findAll({ where: { guildID: member.guild.id } })
		if (autoRoleData) {
			const iterator = autoRoleData.values()

			for (const value of iterator) {
				member.roles.add(`${value.roleID}`) // there was an array around the string before, was that a mistake? Most likely
			}
		}

		const memberLogData = await memberLog.findOne({ raw: true, where: { guildID: member.guild.id } })
		if (memberLogData) {
			const banData = await ban.findAndCountAll({ raw: true, where: { userID: member.user.id } })
			const kickData = await kick.findAndCountAll({ raw: true, where: { userID: member.user.id } })
			const muteData = await mute.findAndCountAll({ raw: true, where: { userID: member.user.id } })
			const warningData = await warning.findAndCountAll({ raw: true, where: { userID: member.user.id } })

			const channel = member.guild.channels.cache.get(`${memberLogData.channel}`) as TextChannel
			const embed = new MessageEmbed()
				.setTitle(`${member.user.username}#${member.user.discriminator} joined the server!`)
				.setThumbnail(`${member.user.avatarURL({ format: `png`, dynamic: true, size: 1024 })}`)
				.setColor(`#00ff1a`)
				.setFooter(`UserID: ${member.user.id}`)
				.setTimestamp()
				.setDescription(
					`**Account created:** ${moment(member.user.createdAt).format(`D/M/YYYY HH:mm:ss Z`)}${
						new Date().getTime() - member.user.createdAt.getTime() < 3600000
							? `\n**WARNING** This user is created under an hour ago.`
							: ``
					}\n**Bans on other servers:** \`${banData.count}\`.\n**Kicks from other servers:** \`${
						kickData.count
					}\`.\n**Mutes on other servers:** \`${muteData.count}\`.\n**Warnings on other servers:** \`${
						warningData.count
					}\`.`,
				)
			await channel.send(embed)
		}

		try {
			const welcomeData = await welcome.findOne({ where: { guildID: member.guild.id } })

			const channel = member.guild.channels.cache.get(`${welcomeData?.channel}`) as TextChannel
			const msg = welcomeData?.message
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
		} catch {
			return
		}
	},
}
