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
import { urlToColours } from '../../utils'

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
	usage: ` is the prefix\n**announcement every <amount of time> <timeframe> <channel> <announcement>** E.g. announcement 1 week 714920591429337109 IT IS FRIDAY\n**announcement schedule <DD-MM-YYYY> <HH:mm> <timezone offset> <channel> <announcement>** E.g. announcement schedule 25-11-2021 08:00 +02:00 714827566992850964 it is Banner's birthday 🥺\n**announcement list** to see a list of your announcements`,
	website: `https://www.bentobot.xyz/commands#announcement`,
	run: async (client, message, args): Promise<Message | undefined> => {
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

			if (!message.member?.hasPermission(`MANAGE_MESSAGES`)) {
				return message.channel
					.send(`You do not have permission to use this command!`)
					.then((m) => m.delete({ timeout: 10000 }))
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
			const diff: number = announcementDate.getTime() - nextDate.getTime()
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
				date: nextDate,
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
					`Your announcement has been set!\nThe announcement will be sent every \`${amountOfTime} ${timeframe}\`\nThe first announcement will be on <t:${nextDate.getTime()}:F>`,
				)
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
					`You already have an announcement set on <t:${announcementDate.getTime()}:F> with the following:\n\`${announcement}\``,
				)
			} else {
				return message.channel.send(
					`You have successfully set an announcement on <t:${announcementDate.getTime()}:F> with the following:\n\`${announcement}\``,
				)
			}
		}

		async function announceDelete(message: Message, type: string, id: string) {
			// remember to validate that the announcement they're trying to delete is actually from the same guild
			return message.channel.send(`litty yuh`)
		}

		async function announceEdit(message: Message, type: string, id: string, column: string, content: string) {
			// for timeframe, remember to validate the format
			// for the new time saved, remember to validate that it isn't under 15 minutes or over 5 years
			// validate that the time hasn't passed
			// validate that the message isn't empty
			// remember to validate that the announcement they're trying to edit is actually from the same guild
			return message.channel.send(`litty yuh`)
		}

		async function announceList(message: Message) {
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
		}
	},
}
