import { Message, MessageEmbed, MessageReaction, User } from 'discord.js'
import moment from 'moment'
import database from '../../database/database'
import {
	guild,
	initModels,
	announcementScheduleCreationAttributes,
	announcementTimeCreationAttributes,
	announcementSchedule,
	announcementTime,
} from '../../database/models/init-models'
import { Command } from '../../interfaces'
import { trim, urlToColours } from '../../utils'

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
	name: `announcement`,
	aliases: [`announce`],
	category: `admin`,
	description: `Create announcements in specific channels at specific times and Bento will deliver them for you.\nYou can either use "every" e.g. every 2 day and Bento will send out the announcement every 2nd day, or use schedule to specify a specific time and date to make an announcement. \nUse list to see a list of your reminders.`,
	usage: ` is the prefix\n**announcement every <amount of time> <timeframe> <channel> <announcement>** E.g. announcement 1 week 714920591429337109 IT IS FRIDAY\n**announcement schedule <DD-MM-YYYY> <HH:mm> <timezone offset> <channel> <announcement>** E.g. announcement schedule 25-11-2021 08:00 +02:00 714827566992850964 it is Banner's birthday 🥺\n**announcement list** to see a list of your announcements\n**announcement delete <every/schedule> <announcement id>** to delete an announcement\n**announcement edit <every/schedule> <announcement id> <column> <content>** to edit a specific part of an announcement. The bot will inform you about possible columns.`,
	website: `https://www.bentobot.xyz/commands#announcement`,
	run: async (client, message, args): Promise<Message | undefined> => {
		console.log(`Reached ${command.name}.ts, guildID: ${message.guild?.id}`)
		if (!message.member?.hasPermission(`MANAGE_MESSAGES`)) {
			return message.channel
				.send(`You do not have permission to use this command!`)
				.then((m) => m.delete({ timeout: 10000 }))
		}
		initModels(database)

		const guildData = await guild.findOne({
			raw: true,
			where: { guildID: message.guild?.id },
		})

		try {
			if (!args.length) {
				return message.channel.send(
					`If you need help with announcement, please use \`${guildData?.prefix}help announcement\` to see instructions`,
				)
			}

			if (args[0] === `every`) {
				return announceTime(message, args[1], args[2], args[3], args.slice(4).join(` `))
			}

			if (args[0] === `schedule`) {
				return announceSchedule(message, args[1], args[2], args[3], args[4], args.slice(5).join(` `))
			}

			if (args[0] === `list`) {
				return announceList(message)
			}

			if (args[0] === `delete`) {
				return announceDelete(message, args[1], args[2])
			}

			if (args[0] === `edit`) {
				return announceEdit(message, args[1], args[2], args[3], args.slice(4).join(` `))
			}

			if (args[0]) {
				return message.channel.send(
					`Invalid announcement.\nIf you need help with announcements, please use \`${guildData?.prefix}help announcement\` to see instructions`,
				)
			}
		} catch (err) {
			console.log(`Error at announcement.ts, server ${message.guild?.id}\n\n${err}`)
		}

		async function announceTime(
			message: Message,
			amountOfTime: string,
			timeframe: string,
			channel: string,
			announcement: string,
		) {
			try {
				if (!amountOfTime) {
					return message.channel.send(
						`You haven't specified the amount of time.\nIf you need help with announcements, please use \`${guildData?.prefix}help announcement\` to see instructions`,
					)
				}

				if (!timeframe) {
					return message.channel.send(
						`You haven't specified the timeframe after ${amountOfTime}.\nIf you need help with announcements, please use \`${guildData?.prefix}help announcement\` to see instructions`,
					)
				}

				if (!momentTimeUnitBases.includes(timeframe)) {
					return message.channel.send(
						`Your specified timeframe \`${timeframe}\` is invalid.\nIf you need help with announcements, please use \`${guildData?.prefix}help announcement\` to see instructions`,
					)
				}

				if (!channel) {
					return message.channel.send(
						`You haven't specified what channel I should announce in.\nIf you need help with announcements, please use \`${guildData?.prefix}help announcement\` to see instructions`,
					)
				}

				if (!announcement) {
					return message.channel.send(
						`You haven't specified what I should announce.\nIf you need help with announcements, please use \`${guildData?.prefix}help announcement\` to see instructions`,
					)
				}

				let channelID: string | undefined
				try {
					const channelObject = message.mentions.channels.first() || message.guild?.channels.cache.get(channel)
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					channelID = channelObject!.id
				} catch {
					return message.channel.send(`Your channel \`${channel}\` was invalid.\nPlease use a valid channel.`)
				}

				const announcementDate = moment(new Date())
					.add(amountOfTime, timeframe as moment.unitOfTime.DurationConstructor)
					.toDate()
				const nextDate = moment(announcementDate)
					.add(amountOfTime, timeframe as moment.unitOfTime.DurationConstructor)
					.toDate()

				const diff: number = nextDate.getTime() - announcementDate.getTime()
				// 15 minutes
				if (diff < 900000) {
					return message.channel.send(`Your announcement can't be sent in a duration under every 15th minute`)
				}
				// 5 years
				if (diff > 157784760000) {
					return message.channel.send(`Your announcement can't be sent 5 years into the future`)
				}

				const announcementAttr: announcementTimeCreationAttributes = {
					guildID: BigInt(message.guild?.id as string),
					channelID: BigInt(channelID as string),
					message: announcement,
					date: announcementDate,
					amountOfTime: parseInt(amountOfTime),
					timeframe: timeframe,
				}

				const announcementData = (await announcementTime
					.findOrCreate({
						raw: true,
						where: {
							guildID: message.guild?.id,
							channelID: channelID,
							message: announcement,
							amountOfTime: amountOfTime,
							timeframe: timeframe,
						},
						defaults: announcementAttr,
					})
					.catch(console.error)) as [announcementTime, boolean]

				if (announcementData[1] === false) {
					return message.channel.send(`Your already have an announcement set with the following: \`${message}\``)
				} else {
					return message.channel.send(
						`Your announcement has been set!\nThe announcement will be sent every \`${amountOfTime} ${timeframe}\`\nThe first announcement will be on <t:${Math.floor(
							announcementDate.getTime() / 1000,
						)}:F>`,
					)
				}
			} catch (err) {
				console.log(`Error at announcement.ts' announcementtime function, server ${message.guild?.id}\n\n${err}`)
			}
		}

		async function announceSchedule(
			message: Message,
			date: string,
			time: string,
			utc: string,
			channel: string,
			announcement: string,
		) {
			try {
				if (!date) {
					return message.channel.send(
						`You haven't specified the date for your announcement.\nIf you need help with announcements, please use \`${guildData?.prefix}help announcement\` to see instructions`,
					)
				}

				if (!time) {
					return message.channel.send(
						`You haven't specified the time for your announcement.\nIf you need help with announcements, please use \`${guildData?.prefix}help announcement\` to see instructions`,
					)
				}

				if (!utc) {
					return message.channel.send(
						`You haven't specified the timezone for your announcement.\nIf you need help with announcements, please use \`${guildData?.prefix}help announcement\` to see instructions`,
					)
				}

				if (!channel) {
					return message.channel.send(
						`You haven't specified what channel I should announce in.\nIf you need help with announcements, please use \`${guildData?.prefix}help announcement\` to see instructions`,
					)
				}

				if (!announcement) {
					return message.channel.send(
						`You haven't specified what I should announce.\nIf you need help with announcements, please use \`${guildData?.prefix}help announcement\` to see instructions`,
					)
				}

				let channelID: string | undefined
				try {
					const channelObject = message.mentions.channels.first() || message.guild?.channels.cache.get(channel)
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					channelID = channelObject!.id
				} catch {
					return message.channel.send(`Your channel \`${channel}\` was invalid.\nPlease use a valid channel.`)
				}

				const announcementDateGathered = `${date} ${time} ${utc}`

				if (moment(announcementDateGathered, `DD-MM-YYYY HH:mm Z`, true).isValid() === false) {
					return message.channel.send(
						`You need to specify a valid date to create a scheduled announcement. The format is DD-MM-YYYY HH:mm Z.\nE.g. \`25-11-2021 08:00 +02:00\``,
					)
				}

				const announcementDate = moment.utc(announcementDateGathered, `DD-MM-YYYY HH:mm Z`).toDate()
				const now: Date = new Date(moment().format())

				if (announcementDate.getTime() < now.getTime())
					return message.channel.send(`Your reminder date has already been passed.`)
				const diff: number = announcementDate.getTime() - now.getTime()
				if (diff < 10000) {
					return message.channel.send(`Your announcement must be scheduled to more than 10 seconds into the future`)
				}

				if (diff > 157784760000) {
					return message.channel.send(`Your announcement must be scheduled to less than 5 years into the future`)
				}

				const announcementAttr: announcementScheduleCreationAttributes = {
					guildID: BigInt(message.guild?.id as string),
					channelID: BigInt(channelID as string),
					message: announcement,
					date: announcementDate,
				}

				const announcementData = (await announcementSchedule
					.findOrCreate({
						raw: true,
						where: { guildID: message.guild?.id, channelID: channelID, message: announcement, date: announcementDate },
						defaults: announcementAttr,
					})
					.catch(console.error)) as [announcementSchedule, boolean]

				if (announcementData[1] === false) {
					return message.channel.send(
						`You already have an announcement set on <t:${Math.floor(
							announcementDate.getTime() / 1000,
						)}:F> with the following:\n\`${announcement}\``,
					)
				} else {
					return message.channel.send(
						`You have successfully set an announcement on <t:${Math.floor(
							announcementDate.getTime() / 1000,
						)}:F> with the following:\n\`${announcement}\``,
					)
				}
			} catch (err) {
				console.log(`Error at announcement.ts' announcementschedule function, server ${message.guild?.id}\n\n${err}`)
			}
		}

		async function announceDelete(message: Message, type: string, id: string) {
			try {
				if (!type) {
					return message.channel.send(`You need to specify a type of announcement to delete\nEither every or schedule`)
				}

				const announcementType = [`every`, `schedule`]

				if (!announcementType.includes(type)) {
					return message.channel.send(
						`You need to specify a valid type of announcement to delete\nEither every or schedule`,
					)
				}

				if (!id) {
					return message.channel.send(`You need to specify an announcement id to delete.`)
				}

				const announcementID: number = parseInt(id)

				if (isNaN(announcementID) === true) {
					return message.channel.send(`You need to specify a valid number for the announcement id to delete.`)
				}

				let announcementData

				if (type === `every`) {
					announcementData = (await announcementTime.findOne({
						raw: true,
						where: { id: announcementID, guildID: message.guild?.id },
					})) as announcementTime | null
					if (announcementData === null) {
						return message.channel.send(
							`Could not find a matching announcement to delete for this server.\nUse \`${guildData?.prefix}announcement list\` to see a list of announcements for this server and their ID's`,
						)
					} else {
						await announcementTime.destroy({ where: { id: announcementID, guildID: message.guild?.id } })
						return message.channel.send(
							`Successfully deleted an "every" announcement with the id ${announcementID}\nThe announcement was every ${
								announcementData.amountOfTime
							} ${announcementData.timeframe}\nThe announcement message was:\n${trim(announcementData.message, 1000)}`,
						)
					}
				} else {
					announcementData = (await announcementSchedule.findOne({
						raw: true,
						where: { id: announcementID, guildID: message.guild?.id },
					})) as announcementSchedule | null
					if (announcementData === null) {
						return message.channel.send(
							`Could not find a matching announcement to delete for this server.\nUse \`${guildData?.prefix}announcement list\` to see a list of announcements for this server and their ID's`,
						)
					} else {
						await announcementSchedule.destroy({ where: { id: announcementID, guildID: message.guild?.id } })
						return message.channel.send(
							`Successfully deleted a scheduled announcement with the id ${announcementID}\nThe announcement was scheduled for <t:${
								announcementData.date
							}:F>\nThe announcement message was:\n${trim(announcementData.message, 1000)}`,
						)
					}
				}
			} catch (err) {
				console.log(`Error at announcement.ts' announcedelete function, server ${message.guild?.id}\n\n${err}`)
			}
		}

		async function announceEdit(message: Message, type: string, id: string, column: string, content: string) {
			try {
				if (!type) {
					return message.channel.send(`You need to specify a type of announcement to edit\nEither every or schedule`)
				}

				const announcementType = [`every`, `schedule`]

				if (!announcementType.includes(type)) {
					return message.channel.send(
						`You need to specify a valid type of announcement to edit\nEither every or schedule`,
					)
				}

				if (!id) {
					return message.channel.send(`You need to specify an announcement id to edit.`)
				}

				const announcementID: number = parseInt(id)

				if (isNaN(announcementID) === true) {
					return message.channel.send(`You need to specify a number for the announcement id to edit.`)
				}

				if (!column) {
					return message.channel.send(
						`You need to specify a column of announcement to edit\nIf your type is **every** then the possible columns to edit are: channel, message, time, and timeframe.\nIf your type is **schedule** then the possible columns to edit are: channel, message and date`,
					)
				}

				if (!content) {
					return message.channel.send(`You need to specify content to update the column with.`)
				}

				const announcementColumnEvery = [`channel`, `message`, `time`, `timeframe`]
				const announcementColumnSchedule = [`channel`, `message`, `date`]

				if (type === `every`) {
					if (!announcementColumnEvery.includes(column)) {
						return message.channel.send(
							`You need to specify a valid "every" column to edit an "every" announcement\nEither channel, message, amount of time, or timeframe`,
						)
					}

					if (column === `channel`) {
						let channelID: string | undefined
						try {
							const channelObject = message.mentions.channels.first() || message.guild?.channels.cache.get(content)
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							channelID = channelObject!.id
						} catch {
							return message.channel.send(`Your channel \`${content}\` was invalid.\nPlease use a valid channel.`)
						}

						const announcementUpdate = await announcementTime.update(
							{ channelID: BigInt(channelID) },
							{ where: { guildID: message.guild?.id, id: id } },
						)
						if (announcementUpdate[0] === 0) {
							return message.channel.send(
								`Could not find a matching announcement to edit for this server.\nUse \`${guildData?.prefix}announcement list\` to see a list of announcements for this server and their ID's`,
							)
						} else {
							return message.channel.send(`Successfully updated the announcement channel to <#${channelID}>`)
						}
					}

					if (column === `message`) {
						const announcementUpdate = await announcementTime.update(
							{ message: content },
							{ where: { guildID: message.guild?.id, id: id } },
						)
						if (announcementUpdate[0] === 0) {
							return message.channel.send(
								`Could not find a matching announcement to edit for this server.\nUse \`${guildData?.prefix}announcement list\` to see a list of announcements for this server and their ID's`,
							)
						} else {
							return message.channel.send(`Successfully updated the announcement for announcement id \`${id}\``)
						}
					}

					if (column === `time`) {
						const amountOfTime = parseInt(content)
						if (isNaN(amountOfTime) === true) return message.channel.send(`Your inserted amount of time isn't a number`)
						const announcementData = await announcementTime.findOne({
							raw: true,
							where: { id: id, guildID: message.guild?.id },
						})
						if (announcementData === null) {
							return message.channel.send(
								`Could not find a matching announcement to edit for this server.\nUse \`${guildData?.prefix}announcement list\` to see a list of announcements for this server and their ID's`,
							)
						} else {
							const announcementDate = moment(new Date())
								.add(content, announcementData.timeframe as moment.unitOfTime.DurationConstructor)
								.toDate()
							const nextDate = moment(announcementDate)
								.add(content, announcementData.timeframe as moment.unitOfTime.DurationConstructor)
								.toDate()
							const diff: number = announcementDate.getTime() - nextDate.getTime()
							if (diff < 900000) {
								return message.channel.send(
									`Your announcement can't be sent in a duration under every 15th minute\nThe current timeframe is \`${announcementData.timeframe}\` which may have caused this error by combining the time \`${content}\``,
								)
							} else if (diff > 157784760000) {
								return message.channel.send(
									`Your announcement can't be sent 5 years into the future\nThe current timeframe is \`${announcementData.timeframe}\` which may have caused this error by combining the time \`${content}\``,
								)
							} else {
								const announcementUpdate = await announcementTime.update(
									{ amountOfTime: amountOfTime },
									{ where: { guildID: message.guild?.id, id: id } },
								)
								if (announcementUpdate[0] === 0) {
									return message.channel.send(
										`Could not find a matching announcement to edit for this server.\nUse \`${guildData?.prefix}announcement list\` to see a list of announcements for this server and their ID's`,
									)
								} else {
									return message.channel.send(
										`Successfully updated the announcement time. The announcement will now be made every **${content}** ${announcementData.timeframe}`,
									)
								}
							}
						}
					}

					if (column === `timeframe`) {
						if (!momentTimeUnitBases.includes(content)) {
							return message.channel.send(
								`Your specified timeframe \`${content}\` is invalid.\nIf you need help with announcements, please use \`${guildData?.prefix}help announcement\` to see instructions`,
							)
						} else {
							const announcementData = await announcementTime.findOne({
								raw: true,
								where: { id: id, guildID: message.guild?.id },
							})
							if (announcementData === null) {
								return message.channel.send(
									`Could not find a matching announcement to edit for this server.\nUse \`${guildData?.prefix}announcement list\` to see a list of announcements for this server and their ID's`,
								)
							} else {
								const announcementDate = moment(new Date())
									.add(announcementData.amountOfTime, content as moment.unitOfTime.DurationConstructor)
									.toDate()
								const nextDate = moment(announcementDate)
									.add(announcementData.amountOfTime, content as moment.unitOfTime.DurationConstructor)
									.toDate()
								const diff: number = announcementDate.getTime() - nextDate.getTime()
								if (diff < 900000) {
									return message.channel.send(
										`Your announcement can't be sent in a duration under every 15th minute\nThe current time is \`${announcementData.amountOfTime}\` which may have caused this error by combining the timeframe \`${content}\``,
									)
								} else if (diff > 157784760000) {
									return message.channel.send(
										`Your announcement can't be sent 5 years into the future\nThe current time is \`${announcementData.amountOfTime}\` which may have caused this error by combining the timeframe \`${content}\``,
									)
								} else {
									const announcementUpdate = await announcementTime.update(
										{ timeframe: content },
										{ where: { guildID: message.guild?.id, id: id } },
									)
									if (announcementUpdate[0] === 0) {
										return message.channel.send(
											`Could not find a matching announcement to edit for this server.\nUse \`${guildData?.prefix}announcement list\` to see a list of announcements for this server and their ID's`,
										)
									} else {
										return message.channel.send(
											`Successfully updated the announcement timeframe. The announcement will now be made every **${announcementData.amountOfTime}** ${content}`,
										)
									}
								}
							}
						}
					}
				} else {
					if (!announcementColumnSchedule.includes(column)) {
						return message.channel.send(
							`You need to specify a valid schedule column to edit a scheduled announcement\nEither channel, message or date`,
						)
					}

					if (column === `channel`) {
						let channelID: string | undefined
						try {
							const channelObject = message.mentions.channels.first() || message.guild?.channels.cache.get(content)
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							channelID = channelObject!.id
						} catch {
							return message.channel.send(`Your channel \`${content}\` was invalid.\nPlease use a valid channel.`)
						}

						const announcementUpdate = await announcementSchedule.update(
							{ channelID: BigInt(channelID) },
							{ where: { guildID: message.guild?.id, id: id } },
						)
						if (announcementUpdate[0] === 0) {
							return message.channel.send(
								`Could not find a matching announcement to edit for this server.\nUse \`${guildData?.prefix}announcement list\` to see a list of announcements for this server and their ID's`,
							)
						} else {
							return message.channel.send(`Successfully updated the announcement channel to <#${channelID}>`)
						}
					}

					if (column === `message`) {
						const announcementUpdate = await announcementSchedule.update(
							{ message: content },
							{ where: { guildID: message.guild?.id, id: id } },
						)
						if (announcementUpdate[0] === 0) {
							return message.channel.send(
								`Could not find a matching announcement to edit for this server.\nUse \`${guildData?.prefix}announcement list\` to see a list of announcements for this server and their ID's`,
							)
						} else {
							return message.channel.send(`Successfully updated the announcement for announcement id \`${id}\``)
						}
					}

					if (column === `date`) {
						if (moment(content, `DD-MM-YYYY HH:mm Z`, true).isValid() === false) {
							return message.channel.send(
								`You need to specify a valid date to edit a scheduled announcement. The format is DD-MM-YYYY HH:mm Z.\nE.g. \`25-11-2021 08:00 +02:00\``,
							)
						}

						const announcementDate = moment.utc(content, `DD-MM-YYYY HH:mm Z`).toDate()
						const now: Date = new Date(moment().format())
						if (announcementDate.getTime() < now.getTime())
							return message.channel.send(`Your reminder date has already been passed.`)
						const diff: number = announcementDate.getTime() - now.getTime()
						if (diff < 10000) {
							return message.channel.send(`Your announcement must be scheduled to more than 10 seconds into the future`)
						}

						if (diff > 157784760000) {
							return message.channel.send(`Your announcement must be scheduled to less than 5 years into the future`)
						}

						const announcementUpdate = await announcementSchedule.update(
							{ date: announcementDate },
							{ where: { guildID: message.guild?.id, id: id } },
						)
						if (announcementUpdate[0] === 0) {
							return message.channel.send(
								`Could not find a matching announcement to edit for this server.\nUse \`${guildData?.prefix}announcement list\` to see a list of announcements for this server and their ID's`,
							)
						} else {
							return message.channel.send(
								`Successfully updated the scheduled announcement date for announcement id \`${id}\`.\nThe announcement will be made on <t:${announcementDate.getTime()}:F>`,
							)
						}
					}
				}
			} catch (err) {
				console.log(`Error at announcement.ts' announceupdate function, server ${message.guild?.id}\n\n${err}`)
			}
		}

		async function announceList(message: Message) {
			try {
				const announceTimeData = await announcementTime.findAll({
					raw: true,
					where: { guildID: message.guild?.id },
					order: [[`date`, `DESC`]],
				})

				const announceScheduleData = await announcementSchedule.findAll({
					raw: true,
					where: { guildID: message.guild?.id },
					order: [[`date`, `DESC`]],
				})

				if (!announceTimeData.length && !announceScheduleData.length) {
					return message.channel.send(
						`You haven't set any planned announcements.\nUse \`${guildData?.prefix}help announcement\` if you need help with setting up an announcement`,
					)
				}

				interface AnnouncementCommonInterface {
					id: number
					guildID: bigint
					channelID: bigint
					message: string
					date: Date
					amountOfTime?: number
					timeframe?: string
				}

				const announcementArray: AnnouncementCommonInterface[] = []

				for (const announcementSchedule of announceScheduleData) {
					announcementArray.push(announcementSchedule)
				}

				for (const announcementTime of announceTimeData) {
					announcementArray.push(announcementTime)
				}

				announcementArray.sort(function (a, b) {
					return +b.date - +a.date
				})

				let currentPage = 0
				const embeds = await generateAnnouncementListEmbedding(announcementArray)
				const queueEmbed = await message.channel.send(
					`Current Page: ${currentPage + 1}/${embeds.length}`,
					embeds[currentPage],
				)
				await queueEmbed.react(`⬅️`)
				await queueEmbed.react(`➡️`)
				await queueEmbed.react(`❌`)
				const filter = (reaction: MessageReaction, user: User) =>
					[`⬅️`, `➡️`, `❌`].includes(reaction.emoji.name) && message.author.id === user.id
				const collector = queueEmbed.createReactionCollector(filter, {
					idle: 300000,
					dispose: true,
				})

				collector.on(`collect`, async (reaction, user) => {
					if (reaction.emoji.name === `➡️`) {
						if (currentPage < embeds.length - 1) {
							currentPage++
							reaction.users.remove(user)
							queueEmbed.edit(`Current Page: ${currentPage + 1}/${embeds.length}`, embeds[currentPage])
						}
					} else if (reaction.emoji.name === `⬅️`) {
						if (currentPage !== 0) {
							--currentPage
							reaction.users.remove(user)
							queueEmbed.edit(`Current Page ${currentPage + 1}/${embeds.length}`, embeds[currentPage])
						}
					} else {
						collector.stop()
						await queueEmbed.delete()
					}
				})

				// eslint-disable-next-line no-inner-declarations
				async function generateAnnouncementListEmbedding(input: AnnouncementCommonInterface[]) {
					const embeds = []
					for (let i = 0; i < input.length; i += 1) {
						const current = input[i]

						const embed = new MessageEmbed()
						embed.setAuthor(message.guild?.name, message.guild?.iconURL({ format: `png`, dynamic: true }) as string)
						embed.setColor(`${await urlToColours(message.guild?.iconURL({ format: `png` }) as string)}`)
						embed.setDescription(
							`Channel: <#${current.channelID}>\n${
								current.timeframe === undefined
									? `Announcement Date: <t:${moment(current.date).format(`X`)}:F> \nAnnouncement Schedule ID: ${
											current.id
									  }\n\nAnnouncement:\n${current.message}`
									: `Next Announcement Date: <t:${moment(current.date).format(`X`)}:F> \nAnnouncement Amount of Time: ${
											current.amountOfTime
									  }\nAnnouncement Timeframe: ${current.timeframe}\nAnnouncement Timed ID: ${
											current.id
									  }\n\nAnnouncement:\n${current.message}`
							}`,
						)
						embed.setTitle(
							current.timeframe === undefined
								? `Announcement Schedule ID: ${current.id}`
								: `Announcement Timed ID: ${current.id}`,
						)
						embeds.push(embed)
					}
					return embeds
				}
			} catch (err) {
				console.log(`Error at announcement.ts' announceupdate function, server ${message.guild?.id}\n\n${err}`)
			}
		}
	},
}
