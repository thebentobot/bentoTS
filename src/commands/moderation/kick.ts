import { GuildMember, Message, MessageEmbed, TextChannel } from 'discord.js'
import database from '../../database/database'

import {
	initModels,
	kick,
	kickCreationAttributes,
	user,
	userCreationAttributes,
} from '../../database/models/init-models'
import { modLog } from '../../database/models/modLog'
import { Command } from '../../interfaces'

export const command: Command = {
	name: `kick`,
	aliases: [],
	category: `moderation`,
	description: `Kicks the mentioned user from your server.`,
	usage: `kick <user id or mention user> [reason]`,
	website: `https://www.bentobot.xyz/commands#kick`,
	run: async (client, message, args): Promise<Message | GuildMember | void> => {
		try {
			if (!message.member?.hasPermission(`KICK_MEMBERS`)) {
				return message.channel
					.send(`You do not have permission to use this command.\nYou are not a mod.`)
					.then((m) => m.delete({ timeout: 5000 }))
			}

			if (!args[0]) {
				return message.channel.send(
					`You need to specify a user to kick.\nUse the help command with kick to check options when using the kick command.`,
				)
			}

			let kickedUser: GuildMember | undefined
			let kickedUserID: string | undefined

			try {
				kickedUser = message.mentions.members?.has(client.user?.id as string)
					? message.mentions.members.size > 1
						? message.mentions.members.last()
						: message.member
					: message.mentions.members?.first() || (await message.guild?.members.fetch(args[0]))
				kickedUserID = kickedUser?.id
			} catch {
				return message.channel.send(
					`I cannot find the specified member. Please mention a valid member in this Discord server.`,
				)
			}

			if (!kickedUser?.kickable) {
				return message.channel.send(`This member is not kickable.`)
			}

			if (message.member.roles.highest.position <= kickedUser.roles.highest.position) {
				return message.channel.send(`You cannot kick someone with a higher role than you.`)
			}

			let reason: string | undefined

			if (args.length > 1) {
				reason = args.slice(1).join(` `)
			}

			const kickAttr: kickCreationAttributes = {
				userID: BigInt(kickedUserID as string),
				guildID: BigInt(message.guild?.id as string),
				date: new Date(),
				actor: BigInt(message.author.id),
				reason: reason,
			}

			initModels(database)

			const userAttr: userCreationAttributes = {
				userID: BigInt(kickedUserID as string),
				discriminator: kickedUser.user.discriminator,
				username: kickedUser.user.username,
				xp: 0,
				level: 1,
				avatarURL: kickedUser.user.avatarURL({
					format: `png`,
					dynamic: true,
					size: 1024,
				}) as string,
			}

			await user.findOrCreate({
				where: { userID: kickedUserID as string },
				defaults: userAttr,
			})

			const kicked = (await kick
				.findOrCreate({
					raw: true,
					where: { userID: kickedUserID, guildID: message.guild?.id },
					defaults: kickAttr,
				})
				.catch(console.error)) as [kick, boolean]
			const kickedCount = await kick.findAndCountAll({
				where: { guildID: message.guild?.id, userID: kickedUserID },
			})
			try {
				const channel = await modLog.findOne({
					raw: true,
					where: { guildID: message.guild?.id },
				})
				const logChannel: TextChannel = client.channels.cache.get(`${channel?.channel}`) as TextChannel
				const embed = new MessageEmbed()
					.setColor(`#ff8000`)
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
					.setThumbnail(kickedUser.user.avatarURL() as string)
					.setTitle(
						`${
							kickedUser?.nickname
								? `${kickedUser?.nickname} (${kickedUser.user.username}#${kickedUser.user.discriminator})`
								: `${kickedUser.user.username}#${kickedUser.user.discriminator}`
						} was kicked!`,
					)
					.setDescription(
						`This user has been kicked **${
							kickedCount.count > 1 ? `${kickedCount.count} times` : `once`
						}** from this server\n**Reason**\n${reason ? reason : `No reason specified`}`,
					)
					.addField(`Username`, kickedUser.user.username + `#` + kickedUser.user.discriminator)
					.addField(`User ID`, kickedUser.id)
					.addField(
						`Kicked by`,
						message.guild?.members.cache.get(message.author.id)?.nickname
							? `${message.guild.members.cache.get(message.author.id)?.nickname} (${
									message.guild?.members.cache.get(message.author.id)?.user.username
							  }#${message.guild?.members.cache.get(message.author.id)?.user.discriminator})`
							: `${message.guild?.members.cache.get(message.author.id)?.user.username}#${
									message.guild?.members.cache.get(message.author.id)?.user.discriminator
							  }`,
					)
					.setFooter(`Kick Case Number: ${kicked[0].kickCase}`)
					.setTimestamp()
				await logChannel.send(embed)
				try {
					;(await client.users.fetch(kickedUserID as string))
						.send(`🦶 You were \`kicked\` from **${message.guild?.name}** 🦶 \n**Reason**: ${reason}.`)
						.catch((error) => {
							console.error(`Could not send kick DM`, error)
						})
					await message.channel.send(
						`**${
							message.guild?.members.cache.get(`${kickedUserID}`)?.nickname
								? `${message.guild.members.cache.get(`${kickedUserID}`)?.nickname} (${
										message.guild?.members.cache.get(`${kickedUserID}`)?.user.username +
										`#` +
										message.guild?.members.cache.get(`${kickedUserID}`)?.user.discriminator
								  })`
								: `${
										message.guild?.members.cache.get(`${kickedUserID}`)?.user.username +
										`#` +
										message.guild?.members.cache.get(`${kickedUserID}`)?.user.discriminator
								  }`
						}** was successfully **kicked** on this server.\n**Case number: ${kicked[0].kickCase}**.\n**Reason:** ${
							kicked[0].reason
						}\nYou can add notes for this kick by using the case command together with the case number.`,
					)
					return await kickedUser.kick(reason)
				} catch {
					await message.channel.send(
						`**${
							message.guild?.members.cache.get(`${kickedUserID}`)?.nickname
								? `${message.guild.members.cache.get(`${kickedUserID}`)?.nickname} (${
										message.guild?.members.cache.get(`${kickedUserID}`)?.user.username +
										`#` +
										message.guild?.members.cache.get(`${kickedUserID}`)?.user.discriminator
								  })`
								: `${
										message.guild?.members.cache.get(`${kickedUserID}`)?.user.username +
										`#` +
										message.guild?.members.cache.get(`${kickedUserID}`)?.user.discriminator
								  }`
						}** was successfully **kicked** on this server.\n**Case number: ${kicked[0].kickCase}**.\n**Reason:** ${
							kicked[0].reason
						}\nYou can add notes for this kick by using the case command together with the case number.`,
					)
					return await kickedUser.kick(reason)
				}
			} catch {
				try {
					;(await client.users.fetch(kickedUserID as string))
						.send(`🦶 You were \`kicked\` from **${message.guild?.name}** 🦶 \n**Reason**: ${reason}.`)
						.catch((error) => {
							console.error(`Could not send kick DM`, error)
						})
					await message.channel.send(
						`**${
							message.guild?.members.cache.get(`${kickedUserID}`)?.nickname
								? `${message.guild.members.cache.get(`${kickedUserID}`)?.nickname} (${
										message.guild?.members.cache.get(`${kickedUserID}`)?.user.username +
										`#` +
										message.guild?.members.cache.get(`${kickedUserID}`)?.user.discriminator
								  })`
								: `${
										message.guild?.members.cache.get(`${kickedUserID}`)?.user.username +
										`#` +
										message.guild?.members.cache.get(`${kickedUserID}`)?.user.discriminator
								  }`
						}** was successfully **kicked** on this server.\n**Case number: ${kicked[0].kickCase}**.\n**Reason:** ${
							kicked[0].reason
						}\nYou can add notes for this kick by using the case command together with the case number.`,
					)
					return await kickedUser.kick(reason)
				} catch {
					await message.channel.send(
						`**${
							message.guild?.members.cache.get(`${kickedUserID}`)?.nickname
								? `${message.guild.members.cache.get(`${kickedUserID}`)?.nickname} (${
										message.guild?.members.cache.get(`${kickedUserID}`)?.user.username +
										`#` +
										message.guild?.members.cache.get(`${kickedUserID}`)?.user.discriminator
								  })`
								: `${
										message.guild?.members.cache.get(`${kickedUserID}`)?.user.username +
										`#` +
										message.guild?.members.cache.get(`${kickedUserID}`)?.user.discriminator
								  }`
						}** was successfully **kicked** on this server.\n**Case number: ${kicked[0].kickCase}**.\n**Reason:** ${
							kicked[0].reason
						}\nYou can add notes for this kick by using the case command together with the case number.`,
					)
					return await kickedUser.kick(reason)
				}
			}
		} catch (err) {
			console.log(`Error at kick.ts, server ${message.guild?.id}\n\n${err}`)
		}
	},
}
