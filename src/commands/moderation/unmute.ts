import { ClientUser, GuildMember, Message, MessageEmbed, Role, TextChannel, User } from 'discord.js'
import moment from 'moment'
import database from '../../database/database'
import { initModels, modLog, mute, muteRole } from '../../database/models/init-models'
import { Command } from '../../interfaces'

export const command: Command = {
	name: `unmute`,
	aliases: [],
	category: `moderation`,
	description: `Unmutes a user. The reason argument does not overwrite the reason for the mute but rather shows in the mod log as a reason for unmute, if it was a manual unmute.`,
	usage: `unmute <user id or mention user> [reason]`,
	website: `https://www.bentobot.xyz/commands#unmute`,
	run: async (client, message, args): Promise<Message | void> => {
		console.log(`Reached ${command.name}.ts, guildID: ${message.guild?.id}`)

		try {
			if (!message.member?.hasPermission(`BAN_MEMBERS`)) {
				return message.channel
					.send(`You do not have permission to use this command.\nYou are not a mod.`)
					.then((m) => m.delete({ timeout: 5000 }))
			}

			if (!message.guild?.me?.hasPermission(`MANAGE_ROLES`)) {
				return await message.channel.send(
					`**ERROR!** ${client.user} does not have permission to manage roles (and then unmute users) on this server.`,
				)
			}

			if (!args[0]) {
				return message.channel.send(
					`You need to specify a user to unmute.\nUse the help command with unmute to check options when using the unban command.`,
				)
			}

			const muteRoleData = await muteRole.findOne({
				raw: true,
				where: { guildID: message.guild?.id },
			})

			if (muteRoleData === null) {
				return message.channel.send(
					`You haven't set a mute role.\nPlease use the muterole command.\nIf you need help, use the help command with muterole.`,
				)
			}

			const rolePosition = message.guild?.roles.cache.get(`${muteRoleData.roleID}`)?.position as number
			const role = message.guild?.roles.cache.get(`${muteRoleData.roleID}`)

			if (
				(message.guild?.members?.resolve(client?.user as ClientUser)?.roles?.highest?.position as number) < rolePosition
			) {
				return message.channel.send(
					`Your mute role is positioned hieracally higher than Bento Bot.\nPlease positon Bento Bot's role higher than the mute role.\nIf not, you are not able to mute.`,
				)
			}

			let unmutedUser: GuildMember | undefined
			let unmutedUserID: string | undefined

			try {
				unmutedUser = message.mentions?.members?.has(client?.user?.id as string)
					? message.mentions.members.size > 1
						? message.mentions.members.last()
						: message.member
					: message.mentions?.members?.first() || (await message.guild?.members.fetch(args[0]))
				unmutedUserID = unmutedUser?.id
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

			const muted = await mute.findOne({
				raw: true,
				where: {
					userID: unmutedUserID,
					guildID: message.guild?.id,
					MuteStatus: true,
				},
			})

			const unmutedUserObject = (await client.users
				.fetch(`${unmutedUserID}`)
				.catch(() => console.error(`fetch user error in unban.ts line 28`))) as User

			if (!muted) {
				try {
					return message.channel.send(
						`${unmutedUserObject.username + `#` + unmutedUserObject.discriminator} isn't muted on this server.`,
					)
				} catch {
					return message.channel.send(`${unmutedUserID} is an invalid ID.`)
				}
			} else {
				try {
					const channel = await modLog.findOne({
						raw: true,
						where: { guildID: message.guild?.id },
					})
					const logChannel: TextChannel = client.channels.cache.get(`${channel?.channel}`) as TextChannel
					const embed = new MessageEmbed()
						.setColor(`#00ff4a`)
						.setAuthor(
							message.guild?.members.cache.get(message.author.id)?.nickname
								? `${message.guild?.members.cache.get(message.author.id)?.nickname} (${
										message.guild?.members.cache.get(message.author.id)?.user.username
								  }#${message.guild?.members.cache.get(message.author.id)?.user.discriminator})`
								: `${message.guild?.members.cache.get(message.author.id)?.user.username}#${
										message.guild?.members.cache.get(message.author.id)?.user.discriminator
								  }`,
							message.author.avatarURL() as string,
						)
						.setThumbnail(unmutedUser?.user.avatarURL() as string)
						.setTitle(
							`${
								unmutedUser?.nickname
									? `${unmutedUser?.nickname} (${unmutedUser.user.username}#${unmutedUser.user.discriminator})`
									: `${unmutedUserObject.username}#${unmutedUserObject.discriminator}`
							} was unmuted!`,
						)
						.setDescription(`**Reason for unmute**\n${reason ? reason : `No reason for the unmute specified`}`)
						.addField(`Username`, unmutedUserObject.username + `#` + unmutedUserObject.discriminator)
						.addField(`User ID`, unmutedUser?.id)
						.addField(
							`Muted by`,
							message.guild?.members.cache.get(`${muted.actor}`)?.nickname
								? `${message.guild.members.cache.get(`${muted.actor}`)?.nickname} (${
										message.guild?.members.cache.get(`${muted.actor}`)?.user.username
								  }#${message.guild?.members.cache.get(`${muted.actor}`)?.user.discriminator})`
								: `${(await client.users.fetch(`${muted.actor}`)).username}#${
										(await client.users.fetch(`${muted.actor}`)).discriminator
								  }`,
						)
						.addField(`Mute date`, `<t:${moment(muted.date).format(`X`)}:F>`)
						.addField(
							`Original mute end date`,
							muted.muteEnd !== null ? `<t:${moment(muted.muteEnd).format(`X`)}:F>` : `The mute was on indefinite time`,
						)
						.addField(`Reason for mute`, muted.reason !== null ? `No reason specified for mute` : muted.reason)
						.addField(
							`Unmuted by`,
							message.guild?.members.cache.get(message.author.id)?.nickname
								? `${message.guild.members.cache.get(message.author.id)?.nickname} (${
										message.guild?.members.cache.get(message.author.id)?.user.username
								  }#${message.guild?.members.cache.get(message.author.id)?.user.discriminator})`
								: `${message.guild?.members.cache.get(message.author.id)?.user.username}#${
										message.guild?.members.cache.get(message.author.id)?.user.discriminator
								  }`,
						)
						.addField(`Notes about the mute case`, muted.note ? muted.note : `No notes made for this mute case`)
						.setFooter(`Mute Case Number: ${muted.muteCase}`)
						.setTimestamp()
					await logChannel.send(embed)
					try {
						;(await client.users.fetch(unmutedUserID as string))
							.send(
								`🙏You were \`unmuted\` from **${message.guild?.name}** \n**Reason**: ${
									reason ? reason : `No reason for the unmute specified`
								}.`,
							)
							.catch(() => console.error(`Could not send unmute DM`))
						await unmutedUser?.roles.remove(role as Role)
						await mute.update(
							{ MuteStatus: false },
							{
								where: {
									userID: unmutedUserID,
									guildID: message.guild?.id,
									MuteStatus: true,
								},
							},
						)
						return await message.channel.send(
							`**${
								unmutedUser?.nickname
									? `${unmutedUser?.nickname} (${unmutedUser.user.username}#${unmutedUser.user.discriminator})`
									: `${unmutedUserObject.username}#${unmutedUserObject.discriminator}`
							}** was successfully **unmuted** on this server.\n**Reason:** ${
								reason ? reason : `No reason for the unmuted specified`
							}.`,
						)
					} catch {
						await unmutedUser?.roles.remove(role as Role)
						await mute.update(
							{ MuteStatus: false },
							{
								where: {
									userID: unmutedUserID,
									guildID: message.guild?.id,
									MuteStatus: true,
								},
							},
						)
						return await message.channel.send(
							`**${
								unmutedUser?.nickname
									? `${unmutedUser?.nickname} (${unmutedUser.user.username}#${unmutedUser.user.discriminator})`
									: `${unmutedUserObject.username}#${unmutedUserObject.discriminator}`
							}** was successfully **unmuted** on this server.\n**Reason:** ${
								reason ? reason : `No reason for the unmuted specified`
							}.`,
						)
					}
				} catch {
					try {
						;(await client.users.fetch(unmutedUserID as string))
							.send(
								`🙏You were \`unmuted\` from **${message.guild?.name}** \n**Reason**: ${
									reason ? reason : `No reason for the unmute specified`
								}.`,
							)
							.catch(() => console.error(`Could not send unmute DM`))
						await unmutedUser?.roles.remove(role as Role)
						await mute.update(
							{ MuteStatus: false },
							{
								where: {
									userID: unmutedUserID,
									guildID: message.guild?.id,
									MuteStatus: true,
								},
							},
						)
						return await message.channel.send(
							`**${
								unmutedUser?.nickname
									? `${unmutedUser?.nickname} (${unmutedUser.user.username}#${unmutedUser.user.discriminator})`
									: `${unmutedUserObject.username}#${unmutedUserObject.discriminator}`
							}** was successfully **unmuted** on this server.\n**Reason:** ${
								reason ? reason : `No reason for the unmuted specified`
							}.`,
						)
					} catch {
						await unmutedUser?.roles.remove(role as Role)
						await mute.update(
							{ MuteStatus: false },
							{
								where: {
									userID: unmutedUserID,
									guildID: message.guild?.id,
									MuteStatus: true,
								},
							},
						)
						return await message.channel.send(
							`**${
								unmutedUser?.nickname
									? `${unmutedUser?.nickname} (${unmutedUser.user.username}#${unmutedUser.user.discriminator})`
									: `${unmutedUserObject.username}#${unmutedUserObject.discriminator}`
							}** was successfully **unmuted** on this server.\n**Reason:** ${
								reason ? reason : `No reason for the unmuted specified`
							}.`,
						)
					}
				}
			}
		} catch (err) {
			console.log(`Error at unmute.ts, server ${message.guild?.id}\n\n${err}`)
		}
	},
}
