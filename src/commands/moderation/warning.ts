import { GuildMember, Message, MessageEmbed, TextChannel } from 'discord.js'
import { warning, warningCreationAttributes } from '../../database/models/warning'
import { Command } from '../../interfaces'
import { initModels, modLog } from '../../database/models/init-models'
import database from '../../database/database'

export const command: Command = {
	name: `warning`,
	aliases: [`warn`],
	category: `moderation`,
	description: `Warns the mentioned user.`,
	usage: `warning <user id or mention user> [reason]`,
	website: `https://www.bentobot.xyz/commands#warning`,
	run: async (client, message, args): Promise<Message> => {
		if (!message.member.hasPermission(`BAN_MEMBERS`)) {
			return message.channel
				.send(`You do not have permission to use this command.\nYou are not a mod.`)
				.then((m) => m.delete({ timeout: 5000 }))
		}

		if (!args[0]) {
			return message.channel.send(
				`You need to specify a user to warn.\nUse the help command with warning to check options when using the warning command.`,
			)
		}

		let warningUser: GuildMember
		let warningUserID: string

		try {
			warningUser = message.mentions.members.has(client.user.id)
				? message.mentions.members.size > 1
					? message.mentions.members.last()
					: message.member
				: message.mentions.members.first() || (await message.guild.members.fetch(args[0]))
			warningUserID = warningUser.id
		} catch {
			return message.channel.send(
				`I cannot find the specified member. Please mention a valid member in this Discord server.`,
			)
		}

		if (!warningUser.bannable) {
			return message.channel.send(`This member is not warnable.`)
		}

		if (message.member.roles.highest.position < warningUser.roles.highest.position) {
			return message.channel.send(`You cannot warn someone with a higher role than you.`)
		}

		let reason: string

		if (args.length > 1) {
			reason = args.slice(1).join(` `)
		}

		const warnAttr: warningCreationAttributes = {
			userID: BigInt(warningUserID),
			guildID: BigInt(message.guild.id),
			date: new Date(),
			actor: BigInt(message.author.id),
			reason: reason,
		}

		initModels(database)

		const warned = await warning.create(warnAttr)
		const warningCount = await warning.findAndCountAll({ where: { guildID: message.guild.id, userID: warningUserID } })
		try {
			let logChannel: TextChannel
			const channel = await modLog.findOne({ raw: true, where: { guildID: message.guild.id } })
			logChannel = client.channels.cache.get(`${channel.channel}`) as TextChannel
			const embed = new MessageEmbed()
				.setColor(`#22ff00`)
				.setAuthor(
					message.guild.members.cache.get(message.author.id)?.nickname
						? `${message.guild.members.cache.get(message.author.id)?.nickname} (${
							message.guild.members.cache.get(message.author.id).user.username
						  }#${message.guild.members.cache.get(message.author.id).user.discriminator})`
						: `${message.guild.members.cache.get(message.author.id).user.username}#${
							message.guild.members.cache.get(message.author.id).user.discriminator
						  }`,
					message.author.avatarURL(),
				)
				.setThumbnail(warningUser.user.avatarURL())
				.setTitle(
					`${
						warningUser?.nickname
							? `${warningUser?.nickname} (${warningUser.user.username}#${warningUser.user.discriminator})`
							: `${warningUser.user.username}#${warningUser.user.discriminator}`
					} was warned!`,
				)
				.setDescription(
					`**Warning number ${warningCount.count}**\n**Reason**\n${reason ? reason : `Reason not listed`}`,
				)
				.addField(`Username`, warningUser.user.username + `#` + warningUser.user.discriminator)
				.addField(`User ID`, warningUser.id)
				.addField(
					`Warned by`,
					message.guild.members.cache.get(message.author.id)?.nickname
						? `${message.guild.members.cache.get(message.author.id)?.nickname} (${
							message.guild.members.cache.get(message.author.id).user.username
						  }#${message.guild.members.cache.get(message.author.id).user.discriminator})`
						: `${message.guild.members.cache.get(message.author.id).user.username}#${
							message.guild.members.cache.get(message.author.id).user.discriminator
						  }`,
				)
				.setFooter(`Warning Case Number: ${warned.warningCase}`)
				.setTimestamp()
			await logChannel.send(embed)
			try {
				(await client.users.fetch(warningUserID))
					.send(
						`⚠ You have received a \`warning\` from **${message.guild.name}** ⚠\n**Reason**: ${reason}.\nThis is warning number ${warningCount.count} that you have received from this server.`,
					)
					.catch((error) => {
						console.error(`Could not send warning DM`, error)
					})
				return await message.channel.send(
					`**${
						message.guild.members.cache.get(`${warningUserID}`)?.nickname
							? `${message.guild.members.cache.get(`${warningUserID}`)?.nickname} (${
								message.guild.members.cache.get(`${warningUserID}`).user.username +
									`#` +
									message.guild.members.cache.get(`${warningUserID}`).user.discriminator
							  })`
							: `${
								message.guild.members.cache.get(`${warningUserID}`).user.username +
									`#` +
									message.guild.members.cache.get(`${warningUserID}`).user.discriminator
							  }`
					}** was successfully **warned**.\n**Case number: ${
						warned.warningCase
					}**.\n**Reason:** ${reason}\nYou can add notes for this warning by using the case command, together with the case number.`,
				)
			} catch {
				return await message.channel.send(
					`**${
						message.guild.members.cache.get(`${warningUserID}`)?.nickname
							? `${message.guild.members.cache.get(`${warningUserID}`)?.nickname} (${
								message.guild.members.cache.get(`${warningUserID}`).user.username +
									`#` +
									message.guild.members.cache.get(`${warningUserID}`).user.discriminator
							  })`
							: `${
								message.guild.members.cache.get(`${warningUserID}`).user.username +
									`#` +
									message.guild.members.cache.get(`${warningUserID}`).user.discriminator
							  }`
					}** was successfully **warned**.\n**Case number: ${
						warned.warningCase
					}**.\n**Reason:** ${reason}\nYou can add notes for this warning by using the case command, together with the case number.`,
				)
			}
		} catch {
			try {
				(await client.users.fetch(warningUserID))
					.send(
						`⚠ You have received a \`warning\` from **${message.guild.name}** ⚠\n**Reason**: ${reason}.\nThis is warning number ${warningCount.count} that you have received from this server.`,
					)
					.catch((error) => {
						console.error(`Could not send warning DM`, error)
					})
				return await message.channel.send(
					`**${
						message.guild.members.cache.get(`${warningUserID}`)?.nickname
							? `${message.guild.members.cache.get(`${warningUserID}`)?.nickname} (${
								message.guild.members.cache.get(`${warningUserID}`).user.username +
									`#` +
									message.guild.members.cache.get(`${warningUserID}`).user.discriminator
							  })`
							: `${
								message.guild.members.cache.get(`${warningUserID}`).user.username +
									`#` +
									message.guild.members.cache.get(`${warningUserID}`).user.discriminator
							  }`
					}** was successfully **warned**.\n**Case number: ${
						warned.warningCase
					}**.\n**Reason:** ${reason}\nYou can add notes for this warning by using the case command, together with the case number.`,
				)
			} catch {
				return await message.channel.send(
					`**${
						message.guild.members.cache.get(`${warningUserID}`)?.nickname
							? `${message.guild.members.cache.get(`${warningUserID}`)?.nickname} (${
								message.guild.members.cache.get(`${warningUserID}`).user.username +
									`#` +
									message.guild.members.cache.get(`${warningUserID}`).user.discriminator
							  })`
							: `${
								message.guild.members.cache.get(`${warningUserID}`).user.username +
									`#` +
									message.guild.members.cache.get(`${warningUserID}`).user.discriminator
							  }`
					}** was successfully **warned**.\n**Case number: ${
						warned.warningCase
					}**.\n**Reason:** ${reason}\nYou can add notes for this warning by using the case command, together with the case number.`,
				)
			}
		}
	},
}
