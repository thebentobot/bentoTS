import { Message, MessageEmbed } from 'discord.js'
import database from '../../database/database'
import {
	guild,
	initModels,
	notificationMessage,
	notificationMessageCreationAttributes,
} from '../../database/models/init-models'
import { Command } from '../../interfaces'
import { trim, urlToColours } from '../../utils'

export const command: Command = {
	name: `notification`,
	aliases: [`noti`, `notify`],
	category: `user`,
	description: `Get a notification when someone mentions a specific word or sentence. You can enable it for the server you write the command from, or enable it globally to get it from all servers who has Bento.`,
	usage: ` is the prefix.\n**notification add <content>** to add content to be notified by. Add ''--global'' if you want to get notified when someone mentions the word on all Bento servers.\n**notification delete <content>** to delete the saved notification.\n**notification list** to get a DM with a list of all your saved notifications.\n**notification global <content>** to enable/disable global notifications for a saved notification.`,
	website: `https://www.bentobot.xyz/commands#notification`,
	run: async (client, message, args): Promise<Message | undefined> => {
		if (args[0] === `add`) {
			return addNoti(message, args.slice(1).join(` `))
		}

		if (args[0] === `delete`) {
			return deleteNoti(message, args.slice(1).join(` `))
		}

		if (args[0] === `list`) {
			return listNoti(message)
		}

		if (args[0] === `global`) {
			return globalNoti(message, args.slice(1).join(` `))
		}

		if (!args.length) {
			initModels(database)

			const guildData = await guild.findOne({ raw: true, where: { guildID: message.guild?.id } })

			return message.channel.send(
				`You need to use an argument for this command.\nUse \`${guildData?.prefix}help notification\` to get help with this command.`,
			)
		}

		async function addNoti(message: Message, content: string): Promise<Message> {
			await message.delete()
			initModels(database)

			const guildData = await guild.findOne({ raw: true, where: { guildID: message.guild?.id } })

			let globalStatus: boolean
			let wordContent: string

			if (content.includes(`--global`)) {
				globalStatus = true
				wordContent = content.replace(`--global`, ``).trim()
				if (wordContent === ``) {
					return message.channel.send(`You can't save a notification for nothing.`)
				}
			} else {
				globalStatus = false
				wordContent = content
				if (wordContent === ``) {
					return message.channel.send(`You can't save a notification for nothing.`)
				}
			}

			const notiAttr: notificationMessageCreationAttributes = {
				userID: BigInt(message.author.id),
				guildID: BigInt(message.guild?.id as string),
				content: wordContent,
				global: globalStatus,
			}

			const createNoti = await notificationMessage.findOrCreate({
				raw: true,
				where: { userID: message.author.id, content: wordContent },
				defaults: notiAttr,
			})

			if (createNoti[1] === false) {
				return message.channel.send(
					`You have already created a notification with the content you listed.\nIf you want to enable it globally use \`${guildData?.prefix}notification global <content>\` to enable/disable.`,
				)
			} else {
				try {
					const embed = new MessageEmbed()
						.setColor(`${await urlToColours(client.user?.avatarURL({ format: `png` }) as string)}`)
						.setTimestamp()
						.setDescription(
							`Your notification \`${createNoti[0].content}\` has been saved!\n${
								createNoti[0].global
									? `You have enabled global and will be notified when your notification content are mentioned on any server you are on, who has Bento.`
									: `You will be notified when your notification content are mentioned on the server you saved it on. Use the global argument for the notification command to enable global notifications.`
							}`,
						)
					return (await message.author.send(embed).catch((error) => {
						console.error(`Could not send noti DM`, error),
							message.channel.send(
								`The notification has not been saved because I can't send DM's to you ${message.author}.\nPlease check your privacy settings and try again.`,
							)
					})) as Message
				} catch {
					await notificationMessage.destroy({
						where: { userID: message.author.id, content: createNoti[0].content, id: createNoti[0].id },
					})
					return await message.channel.send(
						`The notification has not been saved because I can't send DM's to you ${message.author}.\nPlease check your privacy settings and try again.`,
					)
				}
			}
		}

		async function deleteNoti(message: Message, content: string) {
			await message.delete()
			initModels(database)

			const deleteNoti = await notificationMessage.destroy({ where: { userID: message.author.id, content: content } })

			if (deleteNoti === 0) {
				return message.channel.send(`The notification you tried to delete doesn't exist.`)
			} else {
				return message.channel.send(`${message.author} Your notifcation was successfully deleted.`)
			}
		}

		async function listNoti(message: Message) {
			initModels(database)

			const listNoti = await notificationMessage.findAndCountAll({ where: { userID: message.author.id } })

			if (listNoti.count === 0) {
				return message.channel.send(`You don't have any notifications saved.`)
			}
			try {
				const embed = new MessageEmbed()
					.setColor(`${await urlToColours(client.user?.avatarURL({ format: `png` }) as string)}`)
					.setTimestamp()
					.setThumbnail(message.author.avatarURL({ dynamic: true, format: `png`, size: 1024 }) as string)
					.setTitle(`Your saved notifications`)
					.setFooter(`Notifications marked with (G) is enabled globally.\nNotifications in total: ${listNoti.count}.`)
					.setDescription(
						trim(
							listNoti.rows
								.map(
									(noti) =>
										`${
											noti.global
												? `${noti.content} (G)`
												: `${noti.content} (${
														client.guilds.cache.get(`${noti.guildID}`)
															? client.guilds.cache.get(`${noti.guildID}`)?.name
															: `Server unreachable`
												  })`
										}`,
								)
								.join(` | `),
							4096,
						),
					)
				;(await message.author.send(embed).catch((error) => {
					console.error(`Could not send noti DM`, error),
						message.channel.send(
							`Notification list wasn't sent, because I can't send DM's to you ${message.author}.\nPlease check your privacy settings and try again.`,
						)
				})) as Message
				return await message.channel.send(`${message.author} your list of notifications has been sent to your DM's!`)
			} catch {
				return await message.channel.send(
					`Notification list hasn't been sent, because I can't send DM's to you.\nPlease check your privacy settings and try again.`,
				)
			}
		}

		async function globalNoti(message: Message, content: string) {
			await message.delete()
			initModels(database)

			const listNoti = await notificationMessage.findOne({ where: { userID: message.author.id, content: content } })

			if (!listNoti) {
				return message.channel.send(
					`The notification you tried to enable/disable global notifications with doesn't exist.`,
				)
			} else {
				await notificationMessage.update(
					{ global: listNoti.global === true ? false : true },
					{ where: { userID: message.author.id, content: content } },
				)
				return message.channel.send(
					`${message.author} Your notification was just \`${
						listNoti.global === true ? `disabled` : `enabled`
					}\` globally.`,
				)
			}
		}
	},
}
