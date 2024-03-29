/* eslint-disable */
import { Event, Command } from '../interfaces'
import { Message, MessageEmbed, TextChannel, User } from 'discord.js'
import database from '../database/database'

import { checkURL } from '../utils/checkURL'
import { ttEmbedding } from '../utils/tt'
import { addXpServer, addXpGlobal } from '../utils/xp'
// [table] Attributes is the interface defining the fields
// [table] CreationAttributes is the interface defining the fields when creating a new record
import {
	initModels,
	guild,
	tag,
	user,
	userCreationAttributes,
	guildMemberCreationAttributes,
	guildMember,
	roleChannel,
	notificationMessage,
	patreon,
	channelDisable,
} from '../database/models/init-models'
import { QueryTypes } from 'sequelize'
import { trim, urlToColours } from '../utils'
import moment from 'moment'
import { roleManagement } from '../commands/admin/role'

const guildUpdate = new Set()

export const event: Event = {
	name: `message`,
	run: async (client, message: Message): Promise<Message | void> => {
		if (message.author.bot) return
		if (message.channel.type === 'dm') return
		if (!message.guild) return
		const channelObject = message.guild.channels.cache.get(message.channel.id)
		if (channelObject?.type === 'voice') return

		initModels(database) //imports models into sequelize instance

		const userAttr: userCreationAttributes = {
			userID: BigInt(message.author.id),
			discriminator: message.author.discriminator,
			username: message.author.username,
			xp: 0,
			level: 1,
			avatarURL: message.author.avatarURL({
				format: `png`,
				dynamic: true,
				size: 1024,
			}) as string,
		}

		const guildMemberAttr: guildMemberCreationAttributes = {
			userID: BigInt(message.author.id),
			guildID: BigInt(message.guild.id),
			xp: 0,
			level: 1,
			avatarURL: message.author.avatarURL({
				format: `png`,
				dynamic: true,
				size: 1024,
			}) as string,
		}

		await user.findOrCreate({
			where: { userID: message.author.id },
			defaults: userAttr,
		})
		await guildMember.findOrCreate({
			where: { userID: message.author.id, guildID: message.guild.id },
			defaults: guildMemberAttr,
		})

		const messageGuild = await guild.findOne({
			raw: true,
			where: { guildID: message.guild.id },
		}) //raw: true returns only the dataValues
		const patreonUser = await patreon.findOne({
			raw: true,
			where: { userID: message.author.id },
		})

		if (messageGuild?.leaderboard === true) {
			if (patreonUser) {
				if (patreonUser.follower === true) {
					await addXpServer(message.guild.id, message.author.id, 46).catch()
					await addXpGlobal(message.author.id, 46).catch()
				} else if (patreonUser.enthusiast === true) {
					await addXpServer(message.guild.id, message.author.id, 69).catch()
					await addXpGlobal(message.author.id, 69).catch()
				} else if (patreonUser.disciple === true) {
					await addXpServer(message.guild.id, message.author.id, 92).catch()
					await addXpGlobal(message.author.id, 92).catch()
				} else if (patreonUser.sponsor === true) {
					await addXpServer(message.guild.id, message.author.id, 115).catch()
					await addXpGlobal(message.author.id, 115).catch()
				}
			} else if (!patreonUser) {
				await addXpServer(message.guild.id, message.author.id, 23).catch()
				await addXpGlobal(message.author.id, 23).catch()
			}
		}

		if (!guildUpdate.has(message.guild.id)) {
			if (messageGuild?.memberCount !== message.guild.memberCount) {
				await guild.update({ memberCount: message.guild.memberCount }, { where: { guildID: message.guild.id } })
			}

			if (messageGuild?.guildName !== message.guild.name) {
				await guild.update({ guildName: message.guild.name }, { where: { guildID: message.guild.id } })
			}

			if (messageGuild?.icon !== message.guild.iconURL({ format: `png`, dynamic: true, size: 1024 })) {
				await guild.update(
					{
						icon: message.guild.iconURL({
							format: `png`,
							dynamic: true,
							size: 1024,
						}) as string,
					},
					{ where: { guildID: message.guild.id } },
				)
			}

			guildUpdate.add(message.guild.id)
			setTimeout(() => {
				guildUpdate.delete(message?.guild?.id)
			}, 3600000) // 1 hour
		}

		const roleChannelData = await roleChannel.findOne({
			raw: true,
			where: { guildID: message.guild.id },
		})

		try {
			if (roleChannelData !== null) {
				if (`${roleChannelData.channelID}` === message.channel.id) {
					await roleManagement(message)
				}
			}
		} catch (err) {
			console.log(`Error at message.ts (rolemanagement), server ${message.guild.id}\n\n${err}`)
		}

		if (message.content.includes(`tiktok.com`)) {
			if (messageGuild?.tiktok !== false) {
				const url = checkURL(message.content)
				try {
					const tt = await ttEmbedding(url as string)
					if (tt) {
						await message.channel.send(tt[0])
						await message.channel.send(tt[1])
					}
				} catch {
					return
				}
			}
		}

		interface notificationValues {
			id: number
			userID: bigint
			guildID: bigint
			content: string
			global: boolean
		}

		const notiMessage = message.content
			.replace(`%`, ``)
			.replace(`_`, ``)
			.replace(/\\/g, `\\\\`)
			.replace(`__`, ``)
			.split(` `)

		const notificationData: Array<notificationValues> = await database.query(
			`
        SELECT *
        FROM "notificationMessage"
        WHERE content ILIKE ANY(ARRAY [:content]);`,
			{
				type: QueryTypes.SELECT,
				replacements: { content: notiMessage },
			},
		)

		if (notificationData) {
			const guildMemberData = await guildMember.findAll({
				raw: true,
				where: { userID: message.author.id },
			})
			const guildCheck = guildMemberData.map((guild) => guild.guildID)
			const newNotiArr: Array<notificationValues> = []
			for (const notiCheck of notificationData) {
				if (`${notiCheck.guildID}` !== message.guild.id) {
					if (
						notiCheck.global === true &&
						`${notiCheck.userID}` !== message.author.id &&
						guildCheck.includes(notiCheck.guildID)
					) {
						newNotiArr.push(notiCheck)
					}
				} else if (`${notiCheck.userID}` !== message.author.id) {
					newNotiArr.push(notiCheck)
				}
			}
			for (const noti of newNotiArr) {
				let user: User
				try {
					user = client.users.cache.get(`${noti.userID}`) as User
					const channelData = (await client.channels.fetch(message.guild.id)) as TextChannel
					if (!channelData.permissionsFor(user)?.has(`VIEW_CHANNEL`)) return
					const lastMessages = (await message.channel.messages.fetch({ limit: 3 })).array().reverse()
					const embed = new MessageEmbed()
						.setAuthor(
							message.guild.name,
							(message.guild.iconURL({
								dynamic: true,
								format: `png`,
							}) as string)
								? (message.guild.iconURL({
										dynamic: true,
										format: `png`,
								  }) as string)
								: (client?.user?.avatarURL({ format: `png` }) as string),
						)
						.setTimestamp()
						.setThumbnail(
							message.author.avatarURL({
								format: `png`,
								size: 1024,
								dynamic: true,
							}) as string,
						)
						.setColor(
							`${await urlToColours(
								(message.guild.iconURL({ format: `png` }) as string)
									? (message.guild.iconURL({ format: `png` }) as string)
									: (client?.user?.avatarURL({ format: `png` }) as string),
							)}`,
						)
						.setDescription(
							trim(
								`🗨 ${
									message?.member?.nickname
										? `${message.member.nickname} (${message.author.username}#${message.author.discriminator})`
										: `${message.author.username}#${message.author.discriminator}`
								} mentioned \`${noti.content}\` in ${message.channel} on **${
									message.guild.name
								}**.\nLink to the message [here](${message.url})\n${lastMessages
									.map(
										(msg) =>
											`**[${moment(msg.createdAt).format(`HH:mm:ss Z`)}] ${
												msg?.member?.nickname
													? `${msg.member.nickname} (${msg.author.username}#${msg.author.discriminator})`
													: `${msg.author.username}#${msg.author.discriminator}`
											}**\n> ${
												msg.content === `` ? `[MessageEmbed]` : msg.content.replace(noti.content, `**${noti.content}**`)
											}\n`,
									)
									.join(``)}`,
								4096,
							),
						)
					await user.send(`Link to message:\n${message.url}`, embed).catch(async (error) => {
						console.error(`Could not send notification DM`, error)
						await notificationMessage.destroy({
							where: {
								userID: noti.userID,
								content: noti.content,
								id: noti.id,
							},
						})
					})
				} catch {
					return
				}
			}
		}

		const channelDisableData = await channelDisable.findOne({
			raw: true,
			where: { guildID: message.guild.id, channelID: message.channel.id },
		})

		if (channelDisableData && !message.member?.hasPermission(`MANAGE_MESSAGES`)) {
			return
		}

		const hasEmoteRegex = /<a?:.+:\d+>/gm
		const emoteRegex = /<:.+:(\d+)>/gm
		const animatedEmoteRegex = /<a:.+:(\d+)>/gm

		const argsSplit = message.content.slice().trim().split(/ +/g)

		// the line below causes the bot to reply to mentions which in reality is a reply.
		// https://discord.js.org/#/docs/main/stable/typedef/MessageType it's possible to check if it's a reply
		// in discord.js v13
		if (argsSplit.length === 1 && message.mentions.users.has(client?.user?.id as string))
			return message.channel.send(`The Bento 🍱 prefix on this server is: \`${messageGuild?.prefix}\`.`)

		const prefixMention = new RegExp(`^<@!?${client?.user?.id}> `)
		const prefixCheck = message.content.match(prefixMention) as RegExpMatchArray
		let prefix: string
		if (prefixCheck) {
			prefix = message.content.match(prefixMention)![0]
		} else {
			prefix = messageGuild?.prefix as string
		}

		if (!message.content.startsWith(prefix)) return

		const args = message.content.slice(prefix.length).trim().split(/ +/g)

		if (args.length === 1 && message.content.match(hasEmoteRegex)) {
			let emoji

			if ((emoji = emoteRegex.exec(message.content))) {
				const url = `https://cdn.discordapp.com/emojis/` + emoji[1] + `.png?v=1`
				message.channel.send(url)
			} else if ((emoji = animatedEmoteRegex.exec(message.content))) {
				const url = `https://cdn.discordapp.com/emojis/` + emoji[1] + `.gif?v=1`
				message.channel.send(url)
			}
		}

		const cmd = args.shift()?.toLowerCase()

		if (!cmd) return
		const command = client.commands.get(cmd) || client.aliases.get(cmd)

		// custom tags
		if (command) {
			;(command as Command).run(client, message, args)
		} else {
			const customCommand = await tag.findOne({
				raw: true,
				where: { guildID: message.guild.id, command: cmd },
			})
			if (customCommand) {
				await tag.increment(`count`, { where: { command: cmd } })
				try {
					return message.channel.send(customCommand?.content)
				} catch {
					return
				}
			}
		}
	},
}
