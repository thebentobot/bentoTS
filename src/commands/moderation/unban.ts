import { Message, MessageEmbed, TextChannel, User } from 'discord.js'
import moment from 'moment'
import database from '../../database/database'
import { ban } from '../../database/models/ban'
import { initModels } from '../../database/models/init-models'
import { modLog } from '../../database/models/modLog'
import { Command } from '../../interfaces'
import { trim } from '../../utils'

export const command: Command = {
	name: `unban`,
	aliases: [],
	category: `moderation`,
	description: `Unbans the mentioned user from your server. The reason argument does not overwrite the reason for the ban but rather shows in the mod log as a reason for unban, if it was a manual unban.`,
	usage: `unban <user id or mention user> [reason]`,
	website: `https://www.bentobot.xyz/commands#unban`,
	run: async (client, message, args): Promise<Message | void> => {
		try {
			if (!message.member?.hasPermission(`BAN_MEMBERS`)) {
				return message.channel
					.send(`You do not have permission to use this command.\nYou are not a mod.`)
					.then((m) => m.delete({ timeout: 5000 }))
			}

			if (!message.guild?.me?.hasPermission(`BAN_MEMBERS`)) {
				return await message.channel.send(
					`**ERROR!** ${client.user} does not have permission to ban (and then unban) users on this server.`,
				)
			}

			if (!args[0]) {
				return message.channel.send(
					`You need to specify a user to unban.\nUse the help command with unban to check options when using the unban command.`,
				)
			}

			let unbannedUser: User
			let unbannedUserID: string

			try {
				unbannedUser = (await client.users
					.fetch(`${args[0]}`)
					.catch(() => console.error(`fetch user error in unban.ts line 28`))) as User
				unbannedUserID = unbannedUser.id
			} catch {
				return message.channel.send(
					`I cannot find the specified member. Please mention a valid member in this Discord server.`,
				)
			}

			let reason: string | undefined

			if (args.length > 1) {
				reason = args.slice(1).join(` `)
			}

			initModels(database)

			const banned = await ban.findOne({
				raw: true,
				where: { userID: unbannedUserID, guildID: message.guild?.id },
			})

			if (!banned) {
				return message.channel.send(
					`**${(await client.users.fetch(unbannedUserID)).username}#${
						(await client.users.fetch(unbannedUserID)).discriminator
					}** isn't banned on this server.`,
				)
			} else {
				try {
					const channel = await modLog.findOne({
						raw: true,
						where: { guildID: message.guild?.id },
					})
					const logChannel: TextChannel = client.channels.cache.get(`${channel?.channel}`) as TextChannel
					const embed = new MessageEmbed()
						.setColor(`#f5ec42`)
						.setAuthor(
							message.guild?.members.cache.get(message.author.id)?.nickname
								? `${message.guild.members.cache.get(message.author.id)?.nickname} (${
										message.guild?.members.cache.get(message.author.id)?.user.username
								  }#${message.guild?.members.cache.get(message.author.id)?.user.discriminator})`
								: `${message.guild?.members.cache.get(message.author.id)?.user.username}#${
										message.guild?.members.cache.get(message.author.id)?.user.discriminator
								  }`,
							message.author.avatarURL() as string,
						)
						.setThumbnail(unbannedUser.avatarURL() as string)
						.setTitle(`${unbannedUser.username}#${unbannedUser.discriminator}) was unbanned!`)
						.setDescription(
							`**Reason for unban**\n${reason ? trim(reason, 4096) : `No reason for the unban specified`}`,
						)
						.addField(`Username`, unbannedUser.username + `#` + unbannedUser.discriminator)
						.addField(`User ID`, unbannedUser.id)
						.addField(
							`Banned by`,
							message.guild?.members.cache.get(`${banned.actor}`)?.nickname
								? `${message.guild.members.cache.get(`${banned.actor}`)?.nickname} (${
										message.guild?.members.cache.get(`${banned.actor}`)?.user.username
								  }#${message.guild?.members.cache.get(`${banned.actor}`)?.user.discriminator})`
								: `${(await client.users.fetch(`${banned.actor}`)).username}#${
										(await client.users.fetch(`${banned.actor}`)).discriminator
								  }`,
						)
						.addField(`Ban date`, `<t:${moment(banned.date).format(`X`)}:F>`)
						.addField(`Reason for ban`, banned.reason !== null ? `No reason specified for ban` : banned.reason)
						.addField(
							`Unbanned by`,
							message.guild?.members.cache.get(message.author.id)?.nickname
								? `${message.guild.members.cache.get(message.author.id)?.nickname} (${
										message.guild?.members.cache.get(message.author.id)?.user.username
								  }#${message.guild?.members.cache.get(message.author.id)?.user.discriminator})`
								: `${message.guild?.members.cache.get(message.author.id)?.user.username}#${
										message.guild?.members.cache.get(message.author.id)?.user.discriminator
								  }`,
						)
						.addField(`Notes about the ban case`, banned.note ? banned.note : `No notes made for this ban case`)
						.setFooter(`Ban Case Number: ${banned.banCase}`)
						.setTimestamp()
					await logChannel.send(embed)
					try {
						;(await client.users.fetch(unbannedUserID))
							.send(
								`🙏You were \`unbanned\` from **${message.guild?.name}** \n**Reason**: ${
									reason ? reason : `No reason for the unban specified`
								}.`,
							)
							.catch((error) => {
								console.error(`Could not send unban DM`, error)
							})
						await message.guild?.members.unban(unbannedUserID, reason)
						await ban.destroy({
							where: {
								guildID: message.guild?.id,
								userID: unbannedUserID,
								actor: banned.actor,
							},
						})
						return await message.channel.send(
							`**${(await client.users.fetch(unbannedUserID)).username}#${
								(
									await client.users.fetch(unbannedUserID)
								).discriminator
							}** was successfully **unbanned** on this server.\n**Reason:** ${
								reason ? reason : `No reason for the unban specified`
							}.`,
						)
					} catch {
						await message.guild?.members.unban(unbannedUserID, reason)
						await ban.destroy({
							where: {
								guildID: message.guild?.id,
								userID: unbannedUserID,
								actor: banned.actor,
							},
						})
						return await message.channel.send(
							`**${(await client.users.fetch(unbannedUserID)).username}#${
								(
									await client.users.fetch(unbannedUserID)
								).discriminator
							}** was successfully **unbanned** on this server.\n**Reason:** ${
								reason ? reason : `No reason for the unban specified`
							}.`,
						)
					}
				} catch {
					try {
						;(await client.users.fetch(unbannedUserID))
							.send(
								`🙏You were \`unbanned\` from **${message.guild?.name}** \n**Reason**: ${
									reason ? reason : `No reason for the unban specified`
								}.`,
							)
							.catch((error) => {
								console.error(`Could not send unban DM`, error)
							})
						await message.guild?.members.unban(unbannedUserID, reason)
						await ban.destroy({
							where: {
								guildID: message.guild?.id,
								userID: unbannedUserID,
								actor: banned.actor,
							},
						})
						return await message.channel.send(
							`**${(await client.users.fetch(unbannedUserID)).username}#${
								(
									await client.users.fetch(unbannedUserID)
								).discriminator
							}** was successfully **unbanned** on this server.\n**Reason:** ${
								reason ? reason : `No reason for the unban specified`
							}.`,
						)
					} catch {
						await message.guild?.members.unban(unbannedUserID, reason)
						await ban.destroy({
							where: {
								guildID: message.guild?.id,
								userID: unbannedUserID,
								actor: banned.actor,
							},
						})
						return await message.channel.send(
							`**${(await client.users.fetch(unbannedUserID)).username}#${
								(
									await client.users.fetch(unbannedUserID)
								).discriminator
							}** was successfully **unbanned** on this server.\n**Reason:** ${
								reason ? reason : `No reason for the unban specified`
							}.`,
						)
					}
				}
			}
		} catch (err) {
			console.log(`Error at unban.ts, server ${message.guild?.id}\n\n${err}`)
		}
	},
}
