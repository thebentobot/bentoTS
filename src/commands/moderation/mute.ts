import { ClientUser, GuildMember, Message, MessageEmbed, Role, TextChannel } from 'discord.js'
import { mute, muteCreationAttributes } from '../../database/models/mute'
import { Command } from '../../interfaces'
import database from '../../database/database'
import { initModels, modLog, muteRole, userCreationAttributes, user as userDB } from '../../database/models/init-models'
import moment from 'moment'

const momentTimeUnitBases = [
	`year`,
	`years`,
	`y`,
	`month`,
	`months`,
	`M`,
	`week`,
	`weeks`,
	`w`,
	`day`,
	`days`,
	`d`,
	`hour`,
	`hours`,
	`h`,
	`minute`,
	`minutes`,
	`m`,
	`second`,
	`seconds`,
	`s`,
	`millisecond`,
	`milliseconds`,
	`ms`,
]

export const command: Command = {
	name: `mute`,
	aliases: [],
	category: `moderation`,
	description: `Mutes a user until unmute or for a specific time.\nPossible timeframes: millisecond/milliseconds/ms, second/seconds/s, minute/minutes/m, hour/hours/h, day/days/d, month/months/M, year/years/y.`,
	usage: `mute <user id or mention user> [reason]\nmute time <amount of time> <timeframe> <user id or mention user> [reason]`,
	website: `https://www.bentobot.xyz/commands#mute`,
	run: async (client, message, args): Promise<Message | GuildMember | undefined> => {
		try {
			if (args[0] === `time`) {
				return timedMute(message, args[1], args[2], args[3], args.slice(4).join(` `))
			} else {
				return regularMute(message, args[0], args.slice(1).join(` `))
			}
		} catch (err) {
			console.log(`Error at mute.ts, server ${message.guild?.id}\n\n${err}`)
		}

		async function timedMute(message: Message, amountOfTime: string, timeframe: string, user: string, reason?: string) {
			if (!message.member?.hasPermission(`BAN_MEMBERS`)) {
				return message.channel
					.send(`You do not have permission to use this command.\nYou are not a mod.`)
					.then((m) => m.delete({ timeout: 5000 }))
			}

			if (!message.guild?.me?.hasPermission(`MANAGE_ROLES`)) {
				return await message.channel.send(
					`**ERROR!** ${client.user} does not have permission to manage roles (add mute role) on this server.`,
				)
			}

			if (!amountOfTime) {
				return message.channel.send(
					`You need to specify an amount of time, timeframe and a user to mute.\nUse the help command with mute to check options when using the mute command.`,
				)
			}

			const reg = new RegExp(/^\d+$/)

			if (reg.test(amountOfTime) === false) {
				return message.channel.send(
					`Your amiunt of time is invalid because it is not a number.\nUse the help command with mute to check options when using the mute command.`,
				)
			}

			if (!timeframe) {
				return message.channel.send(
					`You need to specify a timeframe and a user to mute.\nUse the help command with mute to check options when using the mute command.`,
				)
			}

			if (!momentTimeUnitBases.includes(timeframe)) {
				return message.channel.send(
					`Your specified timeframe \`${timeframe}\` is invalid.\nUse the help command with mute to check options when using the mute command.`,
				)
			}

			if (!user) {
				return message.channel.send(
					`You need to specify a user to mute for ${amountOfTime} ${timeframe}.\nUse the help command with mute to check options when using the mute command.`,
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

			let mutedUser: GuildMember | undefined
			let mutedUserID: string | undefined

			try {
				mutedUser = message.mentions?.members?.has(client?.user?.id as string)
					? message.mentions.members.size > 1
						? message.mentions.members.last()
						: message.member
					: message.mentions?.members?.first() || (await message.guild?.members.fetch(user))
				mutedUserID = mutedUser?.id
			} catch {
				return message.channel.send(
					`I cannot find the specified member. Please mention a valid member in this Discord server.`,
				)
			}

			const mutedUserRolePosition = mutedUser?.roles.highest.position as number

			if (message.member.roles.highest.position <= mutedUserRolePosition) {
				return message.channel.send(`You cannot mute someone with a higher role than you.`)
			}

			const muteAttr: muteCreationAttributes = {
				userID: BigInt(mutedUserID as string),
				guildID: BigInt(message.guild?.id as string),
				date: new Date(),
				muteEnd: moment(new Date())
					.add(amountOfTime, timeframe as moment.unitOfTime.DurationConstructor)
					.toDate(), //https://stackoverflow.com/questions/41768864/moment-add-only-works-with-literal-values
				actor: BigInt(message.author.id),
				reason: reason,
				MuteStatus: true,
			}

			initModels(database)

			const userAttr: userCreationAttributes = {
				userID: BigInt(mutedUserID as string),
				discriminator: mutedUser?.user.discriminator as string,
				username: mutedUser?.user.username as string,
				xp: 0,
				level: 1,
				avatarURL: mutedUser?.user.avatarURL({
					format: `png`,
					dynamic: true,
					size: 1024,
				}) as string,
			}

			await userDB.findOrCreate({
				where: { userID: mutedUserID as string },
				defaults: userAttr,
			})

			const muted = (await mute
				.findOrCreate({
					raw: true,
					where: {
						userID: mutedUserID,
						guildID: message.guild?.id,
						MuteStatus: true,
					},
					defaults: muteAttr,
				})
				.catch(console.error)) as [mute, boolean]

			if (muted[1] === false) {
				return message.channel.send(
					`${
						message.guild?.members.cache.get(`${mutedUserID}`)?.nickname
							? `${message.guild.members.cache.get(`${mutedUserID}`)?.nickname} (${
									message.guild?.members.cache.get(`${mutedUserID}`)?.user.username +
									`#` +
									message.guild?.members.cache.get(`${mutedUserID}`)?.user.discriminator
							  })`
							: `${
									message.guild?.members.cache.get(`${mutedUserID}`)?.user.username +
									`#` +
									message.guild?.members.cache.get(`${mutedUserID}`)?.user.discriminator
							  }`
					} is already muted on this server.\nThe case number for this mute is: \`${
						muted[0].muteCase
					}\` if you want to look up details for this mute use the case check command.`,
				)
			}

			const muteCount = await mute.findAndCountAll({
				where: { guildID: message.guild?.id, userID: mutedUserID },
			})
			try {
				const channel = await modLog.findOne({
					raw: true,
					where: { guildID: message.guild?.id },
				})
				const logChannel: TextChannel = client.channels.cache.get(`${channel?.channel as bigint}`) as TextChannel
				const embed = new MessageEmbed()
					.setColor(`#000000`)
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
					.setThumbnail(
						mutedUser?.user.avatarURL({
							format: `png`,
							size: 1024,
							dynamic: true,
						}) as string,
					)
					.setTitle(
						`${
							mutedUser?.nickname
								? `${mutedUser?.nickname} (${mutedUser.user.username}#${mutedUser.user.discriminator})`
								: `${mutedUser?.user.username}#${mutedUser?.user.discriminator}`
						} was muted for ${amountOfTime} ${timeframe}!`,
					)
					.setDescription(
						`This user has been muted **${
							muteCount.count > 1 ? `${muteCount.count} times` : `once`
						}** on this server\n**Reason**\n${reason ? reason : `Reason not listed`}`,
					)
					.addField(`Username`, mutedUser?.user.username + `#` + mutedUser?.user.discriminator)
					.addField(`User ID`, mutedUser?.id)
					.addField(
						`Muted by`,
						message.guild?.members.cache.get(message.author.id)?.nickname
							? `${message.guild.members.cache.get(message.author.id)?.nickname} (${
									message.guild?.members.cache.get(message.author.id)?.user.username
							  }#${message.guild?.members.cache.get(message.author.id)?.user.discriminator})`
							: `${message.guild?.members.cache.get(message.author.id)?.user.username}#${
									message.guild?.members.cache.get(message.author.id)?.user.discriminator
							  }`,
					)
					.setFooter(`Mute Case Number: ${muted[0].muteCase}`)
					.setTimestamp()
				const logChannelMessage = await logChannel.send(embed)
				try {
					if (message.guild?.me?.hasPermission(`MANAGE_ROLES`)) {
						;(await client.users.fetch(mutedUserID as string))
							.send(
								`😶 You have been \`muted\` for ${amountOfTime} ${timeframe} from **${
									message.guild?.name
								}** 😶 \n**Reason**: ${reason}.\nThis is mute number ${
									muteCount.count
								} that you have received from this server.\nYou will be unmuted at approx. <t:${moment(
									muted[0].muteEnd,
								).format(`X`)}:F>.`,
							)
							.catch(() => console.error(`Could not send mute DM`))
						await mutedUser?.roles.add(role as Role)
						return await message.channel.send(
							`**${
								message.guild?.members.cache.get(`${mutedUserID}`)?.nickname
									? `${message.guild.members.cache.get(`${mutedUserID}`)?.nickname} (${
											message.guild?.members.cache.get(`${mutedUserID}`)?.user.username +
											`#` +
											message.guild?.members.cache.get(`${mutedUserID}`)?.user.discriminator
									  })`
									: `${
											message.guild?.members.cache.get(`${mutedUserID}`)?.user.username +
											`#` +
											message.guild?.members.cache.get(`${mutedUserID}`)?.user.discriminator
									  }`
							}** was successfully **muted** on this server.\n**Case number: ${muted[0].muteCase}**.\n**Reason:** ${
								reason ? reason : `No reason specified`
							}.\nYou can add notes for this mute by using the case command together with the case number.`,
						)
					} else {
						logChannelMessage.delete()
						await mute.destroy({ where: { muteCase: muted[0].muteCase } })
						return await message.channel.send(
							`ERROR! **Bento** does not have permission to mute users by giving them a role (THE MANAGE ROLES PERMISSION IS NOT ENABLED).`,
						)
					}
				} catch {
					if (message.guild?.me?.hasPermission(`MANAGE_ROLES`)) {
						await mutedUser?.roles.add(role as Role)
						return await message.channel.send(
							`**${
								message.guild?.members.cache.get(`${mutedUserID}`)?.nickname
									? `${message.guild.members.cache.get(`${mutedUserID}`)?.nickname} (${
											message.guild?.members.cache.get(`${mutedUserID}`)?.user.username +
											`#` +
											message.guild?.members.cache.get(`${mutedUserID}`)?.user.discriminator
									  })`
									: `${
											message.guild?.members.cache.get(`${mutedUserID}`)?.user.username +
											`#` +
											message.guild?.members.cache.get(`${mutedUserID}`)?.user.discriminator
									  }`
							}** was successfully **muted** on this server.\n**Case number: ${muted[0].muteCase}**.\n**Reason:** ${
								reason ? reason : `No reason specified`
							}.\nYou can add notes for this mute by using the case command together with the case number.`,
						)
					} else {
						logChannelMessage.delete()
						await mute.destroy({ where: { muteCase: muted[0].muteCase } })
						return await message.channel.send(
							`ERROR! **Bento** does not have permission to mute users by giving them a role (THE MANAGE ROLES PERMISSION IS NOT ENABLED).`,
						)
					}
				}
			} catch {
				try {
					if (message.guild?.me?.hasPermission(`MANAGE_ROLES`)) {
						;(await client.users.fetch(mutedUserID as string))
							.send(
								`😶 You have been \`muted\` for ${amountOfTime} ${timeframe} from **${
									message.guild?.name
								}** 😶 \n**Reason**: ${reason}.\nThis is mute number ${
									muteCount.count
								} that you have received from this server.\nYou will be unmuted at approx. <t:${moment(
									muted[0].muteEnd,
								).format(`X`)}:F>.`,
							)
							.catch(() => console.error(`Could not send mute DM`))
						await mutedUser?.roles.add(role as Role)
						return await message.channel.send(
							`**${
								message.guild?.members.cache.get(`${mutedUserID}`)?.nickname
									? `${message.guild?.members.cache.get(`${mutedUserID}`)?.nickname} (${
											message.guild?.members.cache.get(`${mutedUserID}`)?.user.username +
											`#` +
											message.guild?.members.cache.get(`${mutedUserID}`)?.user.discriminator
									  })`
									: `${
											message.guild?.members.cache.get(`${mutedUserID}`)?.user.username +
											`#` +
											message.guild?.members.cache.get(`${mutedUserID}`)?.user.discriminator
									  }`
							}** was successfully **muted** on this server.\n**Case number: ${muted[0].muteCase}**.\n**Reason:** ${
								reason ? reason : `No reason specified`
							}.\nYou can add notes for this mute by using the case command together with the case number.`,
						)
					} else {
						await mute.destroy({ where: { muteCase: muted[0].muteCase } })
						return await message.channel.send(
							`ERROR! **Bento** does not have permission to mute users by giving them a role (THE MANAGE ROLES PERMISSION IS NOT ENABLED).`,
						)
					}
				} catch {
					if (message.guild?.me?.hasPermission(`MANAGE_ROLES`)) {
						await mutedUser?.roles.add(role as Role)
						return await message.channel.send(
							`**${
								message.guild?.members.cache.get(`${mutedUserID}`)?.nickname
									? `${message.guild.members.cache.get(`${mutedUserID}`)?.nickname} (${
											message.guild?.members.cache.get(`${mutedUserID}`)?.user.username +
											`#` +
											message.guild?.members.cache.get(`${mutedUserID}`)?.user.discriminator
									  })`
									: `${
											message.guild?.members.cache.get(`${mutedUserID}`)?.user.username +
											`#` +
											message.guild?.members.cache.get(`${mutedUserID}`)?.user.discriminator
									  }`
							}** was successfully **muted** on this server.\n**Case number: ${muted[0].muteCase}**.\n**Reason:** ${
								reason ? reason : `No reason specified`
							}.\nYou can add notes for this mute by using the case command together with the case number.`,
						)
					} else {
						await mute.destroy({ where: { muteCase: muted[0].muteCase } })
						return await message.channel.send(
							`ERROR! **Bento** does not have permission to mute users by giving them a role (THE MANAGE ROLES PERMISSION IS NOT ENABLED).`,
						)
					}
				}
			}
		}

		async function regularMute(
			message: Message,
			user: string,
			reason?: string,
		): Promise<GuildMember | Message | undefined> {
			if (!message.member?.hasPermission(`BAN_MEMBERS`)) {
				return message.channel
					.send(`You do not have permission to use this command.\nYou are not a mod.`)
					.then((m) => m.delete({ timeout: 5000 }))
			}

			if (!message.guild?.me?.hasPermission(`MANAGE_ROLES`)) {
				return await message.channel.send(
					`**ERROR!** ${client.user} does not have permission to manage roles (add mute role) on this server.`,
				)
			}

			if (!user) {
				return message.channel.send(
					`You need to specify a user to mute.\nUse the help command with mute to check options when using the mute command.`,
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

			let mutedUser: GuildMember | undefined
			let mutedUserID: string | undefined
			try {
				mutedUser = message.mentions?.members?.has(client.user?.id as string)
					? message.mentions.members.size > 1
						? message.mentions.members.last()
						: message.member
					: message.mentions?.members?.first() || (await message.guild?.members.fetch(user))
				mutedUserID = mutedUser?.id
			} catch {
				return message.channel.send(
					`I cannot find the specified member. Please mention a valid member in this Discord server.`,
				)
			}

			const mutedUserRolePosition = mutedUser?.roles.highest.position as number

			if (message.member.roles.highest.position <= mutedUserRolePosition) {
				return message.channel.send(`You cannot mute someone with a higher role than you.`)
			}

			const muteAttr: muteCreationAttributes = {
				userID: BigInt(mutedUserID as string),
				guildID: BigInt(message.guild?.id as string),
				date: new Date(),
				actor: BigInt(message.author.id),
				reason: reason,
				MuteStatus: true,
			}

			initModels(database)

			const muted = await mute.findOrCreate({
				raw: true,
				where: {
					userID: mutedUserID,
					guildID: message.guild?.id,
					MuteStatus: true,
				},
				defaults: muteAttr,
			})

			if (muted[1] === false) {
				return message.channel.send(
					`${
						message.guild?.members.cache.get(`${mutedUserID}`)?.nickname
							? `${message.guild.members.cache.get(`${mutedUserID}`)?.nickname} (${
									message.guild?.members.cache.get(`${mutedUserID}`)?.user.username +
									`#` +
									message.guild?.members.cache.get(`${mutedUserID}`)?.user.discriminator
							  })`
							: `${
									message.guild?.members.cache.get(`${mutedUserID}`)?.user.username +
									`#` +
									message.guild?.members.cache.get(`${mutedUserID}`)?.user.discriminator
							  }`
					} is already muted on this server.\nThe case number for this mute is: \`${
						muted[0].muteCase
					}\` if you want to look up details for this mute use the case check command.`,
				)
			}

			const muteCount = await mute.findAndCountAll({
				where: { guildID: message.guild?.id, userID: mutedUserID },
			})
			try {
				const channel = await modLog.findOne({
					raw: true,
					where: { guildID: message.guild?.id },
				})
				const logChannel: TextChannel = client.channels.cache.get(`${channel?.channel}`) as TextChannel
				const embed = new MessageEmbed()
					.setColor(`#000000`)
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
					.setThumbnail(mutedUser?.user.avatarURL() as string)
					.setTitle(
						`${
							mutedUser?.nickname
								? `${mutedUser?.nickname} (${mutedUser.user.username}#${mutedUser.user.discriminator})`
								: `${mutedUser?.user.username}#${mutedUser?.user.discriminator}`
						} has been muted for indefinite time!`,
					)
					.setDescription(
						`This user has been muted **${
							muteCount.count > 1 ? `${muteCount.count} times` : `once`
						}** on this server\n**Reason**\n${reason ? reason : `Reason not listed`}`,
					)
					.addField(`Username`, mutedUser?.user.username + `#` + mutedUser?.user.discriminator)
					.addField(`User ID`, mutedUser?.id)
					.addField(
						`Muted by`,
						message.guild?.members.cache.get(message.author.id)?.nickname
							? `${message.guild.members.cache.get(message.author.id)?.nickname} (${
									message.guild?.members.cache.get(message.author.id)?.user.username
							  }#${message.guild?.members.cache.get(message.author.id)?.user.discriminator})`
							: `${message.guild?.members.cache.get(message.author.id)?.user.username}#${
									message.guild?.members.cache.get(message.author.id)?.user.discriminator
							  }`,
					)
					.setFooter(`Mute Case Number: ${muted[0].muteCase}`)
					.setTimestamp()
				await logChannel.send(embed)
				await message.channel.send(
					`**${
						message.guild?.members.cache.get(`${mutedUserID}`)?.nickname
							? `${message.guild?.members.cache.get(`${mutedUserID}`)?.nickname} (${
									message.guild?.members.cache.get(`${mutedUserID}`)?.user.username +
									`#` +
									message.guild?.members.cache.get(`${mutedUserID}`)?.user.discriminator
							  })`
							: `${
									message.guild?.members.cache.get(`${mutedUserID}`)?.user.username +
									`#` +
									message.guild?.members.cache.get(`${mutedUserID}`)?.user.discriminator
							  }`
					}** was successfully **muted** on this server.\n**Case number:** ${muted[0].muteCase}.\n**Reason:** ${
						reason ? reason : `No reason specified`
					}.\nYou can add notes for this mute by using the case command together with the case number.`,
				)
				try {
					;(await client.users.fetch(mutedUserID as string))
						.send(
							`😶 You have been \`muted\` for indefinite time from **${message.guild?.name}** 😶 \n**Reason**: ${reason}.\nThis is mute number ${muteCount.count} that you have received from this server.`,
						)
						.catch(() => console.error(`Could not send mute DM`))
					return await mutedUser?.roles.add(role as Role)
				} catch {
					return await mutedUser?.roles.add(role as Role)
				}
			} catch {
				await message.channel.send(
					`**${
						message.guild?.members.cache.get(`${mutedUserID}`)?.nickname
							? `${message.guild.members.cache.get(`${mutedUserID}`)?.nickname} (${
									message.guild?.members.cache.get(`${mutedUserID}`)?.user.username +
									`#` +
									message.guild?.members.cache.get(`${mutedUserID}`)?.user.discriminator
							  })`
							: `${
									message.guild?.members.cache.get(`${mutedUserID}`)?.user.username +
									`#` +
									message.guild?.members.cache.get(`${mutedUserID}`)?.user.discriminator
							  }`
					}** was successfully **muted** on this server.\n**Case number:** ${muted[0].muteCase}.\n**Reason:** ${
						reason ? reason : `No reason specified`
					}.\nYou can add notes for this mute by using the case command together with the case number.`,
				)
				try {
					;(await client.users.fetch(mutedUserID as string))
						.send(
							`😶 You have been \`muted\` for indefinite time from **${message.guild?.name}** 😶 \n**Reason**: ${reason}.\nThis is mute number ${muteCount.count} that you have received from this server.`,
						)
						.catch(() => console.error(`Could not send mute DM`))
					return await mutedUser?.roles.add(role as Role)
				} catch {
					return await mutedUser?.roles.add(role as Role)
				}
			}
		}
	},
}
