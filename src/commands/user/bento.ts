// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import { Command } from '../../interfaces'
import database from '../../database/database'
import {
	initModels,
	bento,
	bentoCreationAttributes,
	guildMember,
	patreon,
	user as userDB,
	userCreationAttributes,
	guildMemberCreationAttributes,
} from '../../database/models/init-models'
import { GuildMember, Message, Util } from 'discord.js'
import moment from 'moment'
import { getTimeRemaining } from '../../utils/getTimeRemaining'

export const command: Command = {
	name: `bento`,
	aliases: [`bentobox`, `🍱`],
	category: `user`,
	description: `Give a Bento Box 🍱 to your friend every 12th hour :D.`,
	usage: `bento [<user>]. If you just write the command, it shows when you can give a Bento Box 🍱 again.`,
	website: `https://www.bentobot.xyz/commands#bento`,
	run: async (client, message, args): Promise<Message | undefined> => {
		if (!args.length) {
			return giveBento(message)
		} else {
			return giveBento(message, args[0])
		}

		async function giveBento(message: Message, user?: string): Promise<Message | undefined> {
			initModels(database)

			if (!user) {
				let bentoData: bento | null
				let then: Date
				try {
					bentoData = await bento.findOne({ raw: true, where: { userID: message.author.id } })
					then = new Date(bentoData?.bentoDate as Date)
				} catch {
					return message.channel.send(
						Util.removeMentions(
							`${
								(await message?.guild?.members.fetch(message.author.id))?.nickname
									? (await message?.guild?.members.fetch(message.author.id))?.nickname
									: message.author.username
							} you haven't tried to give someone a Bento Box 🍱 before.\nPlease do the command again and mention a friend or a userID to give them a Bento 🍱!\nYou'll most likely get one back! 🥺`,
						),
					)
				}
				const now: Date = new Date()
				const diff: number = now.getTime() - then.getTime()
				const diffHours = Math.round(diff / (1000 * 60 * 60))
				const hours = 12
				// to make it 12 hours, i assume it's just changing 24 to 12, and for the moment add days it's 12 hours instead of 1 day
				if (diffHours < hours) {
					// perhaps use the new discord time function?
					return message.channel.send(
						Util.removeMentions(
							`${
								(await message?.guild?.members.fetch(message.author.id))?.nickname
									? (await message?.guild?.members.fetch(message.author.id))?.nickname
									: message.author.username
							}, you can give someone a Bento Box 🍱 again in ${
								getTimeRemaining(moment(bentoData?.bentoDate as Date).add(12, `hour`) as unknown as string).hours
							} hours, ${
								getTimeRemaining(moment(bentoData?.bentoDate as Date).add(12, `hour`) as unknown as string).minutes
							} minutes and ${
								getTimeRemaining(moment(bentoData?.bentoDate as Date).add(12, `hour`) as unknown as string).seconds
							} seconds`,
						),
					)
				}
				if (diffHours >= hours) {
					return message.channel.send(`You didn't specify a user to give a Bento 🍱 to 🥺`)
				}
			} else {
				let mentionedUser: GuildMember | null | undefined
				try {
					const getUser = message?.mentions?.members?.has(client?.user?.id as string)
						? message.mentions.members.size > 1
							? message.mentions.members.last()
							: message.member
						: message?.mentions?.members?.first() || (await message?.guild?.members.fetch(user))
					mentionedUser = getUser
					const userAttr: userCreationAttributes = {
						userID: BigInt(getUser?.id as string),
						discriminator: getUser?.user.discriminator as string,
						username: getUser?.user.username,
						xp: 0,
						level: 1,
						avatarURL: getUser?.user.avatarURL({ format: `png`, dynamic: true, size: 1024 }) as string,
					}

					const guildMemberAttr: guildMemberCreationAttributes = {
						userID: BigInt(getUser?.id as string),
						guildID: BigInt(message?.guild?.id as string),
						xp: 0,
						level: 1,
						avatarURL: getUser?.user.avatarURL({ format: `png`, dynamic: true, size: 1024 }) as string,
					}
					await userDB.findOrCreate({ where: { userID: getUser?.id }, defaults: userAttr })
					await guildMember.findOrCreate({
						where: { userID: getUser?.id, guildID: message?.guild?.id },
						defaults: guildMemberAttr,
					})
				} catch {
					return message.channel.send(`Your input was invalid. Please specify a user.`)
				}
				if (mentionedUser?.id === message.author.id)
					return message.channel.send(`You can't give yourself a Bento 🍱 😠`)
				if (mentionedUser?.user.bot === true)
					return message.channel.send(`You can't give a bot a Bento 🍱, don't feed bots food 😭`)

				const bentoAttr: bentoCreationAttributes = {
					userID: BigInt(message.author.id),
					bento: 0,
				}

				const bentoData = await bento.findOrCreate({
					raw: true,
					where: { userID: message.author.id },
					defaults: bentoAttr,
				})
				const now: Date = new Date()
				const then: Date = new Date(bentoData[0].bentoDate as Date)

				const diff = now.getTime() - then.getTime()
				const diffHours = Math.round(diff / (1000 * 60 * 60))
				const hours = 12

				if (diffHours < hours && bentoData[1] === false) {
					return message.channel.send(
						Util.removeMentions(
							`${
								(await message?.guild?.members.fetch(message.author.id))?.nickname
									? (await message?.guild?.members.fetch(message.author.id))?.nickname
									: message.author.username
							}, you can give someone a Bento Box 🍱 again in ${
								getTimeRemaining(moment(bentoData[0].bentoDate).add(12, `hour`) as unknown as string).hours
							} hours, ${
								getTimeRemaining(moment(bentoData[0].bentoDate).add(12, `hour`) as unknown as string).minutes
							} minutes and ${
								getTimeRemaining(moment(bentoData[0].bentoDate).add(12, `hour`) as unknown as string).seconds
							} seconds`,
						),
					)
				} else {
					const newUserDate = moment(now).add(-12, `hour`).toDate()

					const bentoAttrTarget: bentoCreationAttributes = {
						userID: BigInt(mentionedUser?.id as string),
						bento: 0,
						bentoDate: new Date(newUserDate),
					}

					await bento.update({ bentoDate: now }, { where: { userID: bentoData[0].userID } })
					const bentoDataTarget = await bento.findOrCreate({
						raw: true,
						where: { userID: mentionedUser?.id },
						defaults: bentoAttrTarget,
					})
					const patreonUser = await patreon.findOne({ raw: true, where: { userID: bentoDataTarget[0].userID } })
					if (patreonUser) {
						if (patreonUser.follower === true) {
							const targetIncrement = await bento.increment(`bento`, {
								by: 1 * 2,
								where: { userID: bentoDataTarget[0].userID },
							})
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							const targetIncrementParse = targetIncrement[0][0][0]
							return message.channel.send(
								Util.removeMentions(
									`**${
										(await message?.guild?.members.fetch(message.author.id))?.nickname
											? (await message?.guild?.members.fetch(message.author.id))?.nickname
											: message.author.username
									}** just gave 2 Bento 🍱 to 🌟 Official Patreon Bento 🍱 Follower 🌟 **${
										(await message?.guild?.members.fetch(mentionedUser?.id as string))?.nickname
											? `${(await message?.guild?.members.fetch(mentionedUser?.id as string))?.nickname} (${
													(await message?.guild?.members.fetch(mentionedUser?.id as string))?.user.username
											  }#${(await message?.guild?.members.fetch(mentionedUser?.id as string))?.user.discriminator})`
											: `${(await message?.guild?.members.fetch(mentionedUser?.id as string))?.user.username}#${
													(await message?.guild?.members.fetch(mentionedUser?.id as string))?.user.discriminator
											  }`
									}**!\n**${
										(await message?.guild?.members.fetch(mentionedUser?.id as string))?.nickname
											? `${(await message?.guild?.members.fetch(mentionedUser?.id as string))?.nickname} (${
													(await message?.guild?.members.fetch(mentionedUser?.id as string))?.user.username
											  }#${(await message?.guild?.members.fetch(mentionedUser?.id as string))?.user.discriminator})`
											: `${(await message?.guild?.members.fetch(mentionedUser?.id as string))?.user.username}#${
													(await message?.guild?.members.fetch(mentionedUser?.id as string))?.user.discriminator
											  }`
									}** has received **${targetIncrementParse.bento} Bento** 🍱 over time 😋\n**${
										(await message?.guild?.members.fetch(message.author.id))?.nickname
											? (await message?.guild?.members.fetch(message.author.id))?.nickname
											: message.author.username
									}** can give a Bento 🍱 again in 12 hours.`,
								),
							)
						} else if (patreonUser.enthusiast === true) {
							const targetIncrement = await bento.increment(`bento`, {
								by: 1 * 3,
								where: { userID: bentoDataTarget[0].userID },
							})
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							const targetIncrementParse = targetIncrement[0][0][0]
							return message.channel.send(
								Util.removeMentions(
									`**${
										(await message.guild?.members.fetch(message.author.id))?.nickname
											? (await message.guild?.members.fetch(message.author.id))?.nickname
											: message.author.username
									}** just gave 3 Bento 🍱 to 🌟 Official Patreon Bento 🍱 Enthusiast 🌟 **${
										(await message.guild?.members.fetch(mentionedUser?.id as string))?.nickname
											? `${(await message.guild?.members.fetch(mentionedUser?.id as string))?.nickname} (${
													(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.username
											  }#${(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.discriminator})`
											: `${(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.username}#${
													(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.discriminator
											  }`
									}**!\n**${
										(await message.guild?.members.fetch(mentionedUser?.id as string))?.nickname
											? `${(await message.guild?.members.fetch(mentionedUser?.id as string))?.nickname} (${
													(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.username
											  }#${(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.discriminator})`
											: `${(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.username}#${
													(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.discriminator
											  }`
									}** has received **${targetIncrementParse.bento as number} Bento** 🍱 over time 😋\n**${
										(await message.guild?.members.fetch(message.author.id))?.nickname
											? (await message.guild?.members.fetch(message.author.id))?.nickname
											: message.author.username
									}** can give a Bento 🍱 again in 12 hours.`,
								),
							)
						} else if (patreonUser.disciple === true) {
							const targetIncrement = await bento.increment(`bento`, {
								by: 1 * 4,
								where: { userID: bentoDataTarget[0].userID },
							})
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							const targetIncrementParse = targetIncrement[0][0][0]
							return message.channel.send(
								Util.removeMentions(
									`**${
										(await message.guild?.members.fetch(message.author.id))?.nickname
											? (await message.guild?.members.fetch(message.author.id))?.nickname
											: message.author.username
									}** just gave 4 Bento 🍱 to 🌟 Official Patreon Bento 🍱 Disciple 🌟 **${
										(await message.guild?.members.fetch(mentionedUser?.id as string))?.nickname
											? `${(await message.guild?.members.fetch(mentionedUser?.id as string))?.nickname} (${
													(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.username
											  }#${(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.discriminator})`
											: `${(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.username}#${
													(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.discriminator
											  }`
									}**!\n**${
										(await message.guild?.members.fetch(mentionedUser?.id as string))?.nickname
											? `${(await message.guild?.members.fetch(mentionedUser?.id as string))?.nickname} (${
													(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.username
											  }#${(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.discriminator})`
											: `${(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.username}#${
													(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.discriminator
											  }`
									}** has received **${targetIncrementParse.bento} Bento** 🍱 over time 😋\n**${
										(await message.guild?.members.fetch(message.author.id))?.nickname
											? (await message.guild?.members.fetch(message.author.id))?.nickname
											: message.author.username
									}** can give a Bento 🍱 again in 12 hours.`,
								),
							)
						} else if (patreonUser.sponsor === true) {
							const targetIncrement = await bento.increment(`bento`, {
								by: 1 * 5,
								where: { userID: bentoDataTarget[0].userID },
							})
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							const targetIncrementParse = targetIncrement[0][0][0]
							return message.channel.send(
								Util.removeMentions(
									`**${
										(await message.guild?.members.fetch(message.author.id))?.nickname
											? (await message.guild?.members.fetch(message.author.id))?.nickname
											: message.author.username
									}** just gave 5 Bento 🍱 to 🌟 Official Patreon Bento 🍱 Sponsor 🌟 **${
										(await message.guild?.members.fetch(mentionedUser?.id as string))?.nickname
											? `${(await message.guild?.members.fetch(mentionedUser?.id as string))?.nickname} (${
													(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.username
											  }#${(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.discriminator})`
											: `${(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.username}#${
													(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.discriminator
											  }`
									}**!\n**${
										(await message.guild?.members.fetch(mentionedUser?.id as string))?.nickname
											? `${(await message.guild?.members.fetch(mentionedUser?.id as string))?.nickname} (${
													(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.username
											  }#${(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.discriminator})`
											: `${(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.username}#${
													(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.discriminator
											  }`
									}** has received **${targetIncrementParse.bento} Bento** 🍱 over time 😋\n**${
										(await message.guild?.members.fetch(message.author.id))?.nickname
											? (await message.guild?.members.fetch(message.author.id))?.nickname
											: message.author.username
									}** can give a Bento 🍱 again in 12 hours.`,
								),
							)
						} else {
							const targetIncrement = await bento.increment(`bento`, {
								by: 1,
								where: { userID: bentoDataTarget[0].userID },
							})
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							const targetIncrementParse = targetIncrement[0][0][0]
							return message.channel.send(
								Util.removeMentions(
									`**${
										(await message.guild?.members.fetch(message.author.id))?.nickname
											? (await message.guild?.members.fetch(message.author.id))?.nickname
											: message.author.username
									}** just gave 1 Bento 🍱 to 🌟 Official Patreon Bento 🍱 Supporter 🌟 **${
										(await message.guild?.members.fetch(mentionedUser?.id as string))?.nickname
											? `${(await message.guild?.members.fetch(mentionedUser?.id as string))?.nickname} (${
													(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.username
											  }#${(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.discriminator})`
											: `${(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.username}#${
													(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.discriminator
											  }`
									}**!\n**${
										(await message.guild?.members.fetch(mentionedUser?.id as string))?.nickname
											? `${(await message.guild?.members.fetch(mentionedUser?.id as string))?.nickname} (${
													(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.username
											  }#${(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.discriminator})`
											: `${(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.username}#${
													(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.discriminator
											  }`
									}** has received **${targetIncrementParse.bento} Bento** 🍱 over time 😋\n**${
										(await message.guild?.members.fetch(message.author.id))?.nickname
											? (await message.guild?.members.fetch(message.author.id))?.nickname
											: message.author.username
									}** can give a Bento 🍱 again in 12 hours.`,
								),
							)
						}
					} else {
						const targetIncrement = await bento.increment(`bento`, {
							by: 1,
							where: { userID: bentoDataTarget[0].userID },
						})
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						const targetIncrementParse = targetIncrement[0][0][0]
						return message.channel.send(
							Util.removeMentions(
								`**${
									(await message.guild?.members.fetch(message.author.id))?.nickname
										? (await message.guild?.members.fetch(message.author.id))?.nickname
										: message.author.username
								}** just gave a Bento 🍱 to **${
									(await message.guild?.members.fetch(mentionedUser?.id as string))?.nickname
										? `${(await message.guild?.members.fetch(mentionedUser?.id as string))?.nickname} (${
												(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.username
										  }#${(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.discriminator})`
										: `${(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.username}#${
												(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.discriminator
										  }`
								}**!\n**${
									(await message.guild?.members.fetch(mentionedUser?.id as string))?.nickname
										? `${(await message.guild?.members.fetch(mentionedUser?.id as string))?.nickname} (${
												(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.username
										  }#${(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.discriminator})`
										: `${(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.username}#${
												(await message.guild?.members.fetch(mentionedUser?.id as string))?.user.discriminator
										  }`
								}** has received **${targetIncrementParse.bento} Bento** 🍱 over time 😋\n**${
									(await message.guild?.members.fetch(message.author.id))?.nickname
										? (await message.guild?.members.fetch(message.author.id))?.nickname
										: message.author.username
								}** can give a Bento 🍱 again in 12 hours.`,
							),
						)
					}
				}
			}
		}
	},
}
