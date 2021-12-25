import { Message, MessageEmbed, Util } from 'discord.js'
import moment from 'moment'
import database from '../../database/database'
import { guild, initModels, reminderCreationAttributes, reminder as remindDB } from '../../database/models/init-models'
import { Command } from '../../interfaces'
import { capitalize, urlToColours } from '../../utils'

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
	name: `reminder`,
	aliases: [`remind`],
	category: `user`,
	description: `Create reminders and you will receive a message reminder from Bento at your desired time.\nYou can either use time and say remind me in a day, or use schedule to specify a specific time. Use list to see a list of your reminders.`,
	usage: ` is the prefix\n**reminder time <amount of time> <timeframe> <reminder>** E.g. reminder time 1 day eat cake\n**reminder schedule <DD-MM-YYYY> <HH:mm> <timezone offset> <reminder>** E.g. reminder schedule 25-11-2021 08:00 +02:00 eat cake\n**remind list** to see a list of your reminders`,
	website: `https://www.bentobot.xyz/commands#reminder`,
	run: async (client, message, args): Promise<Message | undefined> => {
		initModels(database)

		const guildData = await guild.findOne({
			raw: true,
			where: { guildID: message.guild?.id },
		})

		try {
			if (!args.length) {
				return message.channel.send(
					`If you need help with reminders, please use \`${guildData?.prefix}help reminder\` to see instructions`,
				)
			}

			if (args[0] === `time`) {
				return remindTime(message, args[1], args[2], args.slice(3).join(` `))
			}

			if (args[0] === `schedule`) {
				return remindSchedule(message, args[1], args[2], args[3], args.slice(4).join(` `))
			}

			if (args[0] === `list`) {
				return remindList(message)
			}

			if (args[0]) {
				return message.channel.send(
					`Invalid reminder.\nIf you need help with reminders, please use \`${guildData?.prefix}help reminder\` to see instructions`,
				)
			}
		} catch (err) {
			console.log(`Error at reminder.ts, server ${message.guild?.id}\n\n${err}`)
		}

		async function remindTime(message: Message, amountOfTime: string, timeframe: string, reminder?: string) {
			try {
				if (!amountOfTime) {
					return message.channel.send(
						`You haven't specified the amount of time.\nIf you need help with reminders, please use \`${guildData?.prefix}help reminder\` to see instructions`,
					)
				}

				if (!timeframe) {
					return message.channel.send(
						`You haven't specified the timeframe after ${amountOfTime}.\nIf you need help with reminders, please use \`${guildData?.prefix}help reminder\` to see instructions`,
					)
				}

				if (!momentTimeUnitBases.includes(timeframe)) {
					return message.channel.send(
						`Your specified timeframe \`${timeframe}\` is invalid.\nUse the help command with reminder to check options when using the reminder command.`,
					)
				}

				if (reminder) {
					if (reminder.length > 2000) {
						return message.channel.send(`Your reminder is too long. Maximum is 2000 characters.`)
					}
				}

				let files: string | undefined
				let text: string | undefined
				let reminderContent: string | undefined

				if (message.attachments.array() !== undefined) {
					const getUrl = message.attachments.array()
					files = getUrl[0] ? getUrl.join(`, `) : ``
				}

				if (reminder) {
					text = reminder
				}

				if (files && text) {
					reminderContent = `${Util.escapeMarkdown(text)}\n${files}`
				} else if (text && !files) {
					reminderContent = Util.escapeMarkdown(text)
				} else if (!text && files) {
					reminderContent = files
				} else if (!text && !files) {
					return message.channel.send(`You didn't attach any content for your reminder`)
				}

				if ((reminderContent?.length as number) > 2000) {
					return message.channel.send(`Your tag content is too long for me to be able to send it, sorry 😔`)
				}

				const remindDate = moment(new Date())
					.add(amountOfTime, timeframe as moment.unitOfTime.DurationConstructor)
					.toDate()
				const now: Date = new Date()
				const diff: number = remindDate.getTime() - now.getTime()
				if (diff < 10000) {
					return message.channel.send(`Your reminder must be more than 10 seconds into the future`)
				}

				if (diff > 157784760000) {
					return message.channel.send(`Your reminder must be less than 5 years into the future`)
				}

				const reminderAttr: reminderCreationAttributes = {
					userID: BigInt(message.author.id),
					reminder: reminderContent as string,
					date: remindDate,
				}

				const reminderData = (await remindDB
					.findOrCreate({
						raw: true,
						where: { userID: message.author.id, reminder: reminder },
						defaults: reminderAttr,
					})
					.catch(console.error)) as [remindDB, boolean]

				if (reminderData[1] === false) {
					return message.channel.send(`Your already have a reminder set with the following: \`${reminder}\``)
				}

				try {
					await client.users.cache
						.get(message.author.id)
						?.send(
							`Your reminder has been set!\n${capitalize(
								moment(now).to(remindDate),
							)} you will be reminded to \`${reminder}\`.\nDate for reminder: approx. <t:${moment(remindDate).format(
								`X`,
							)}:F>`,
						)
					return await message.channel.send(`Your reminder has been set.`)
				} catch {
					await remindDB.destroy({
						where: {
							userID: message.author.id,
							reminder: reminder,
							date: remindDate,
						},
					})
					return await message.channel.send(
						`Reminder hasn't been set, because I can't send DM's to you.\nPlease check your privacy settings and try again.`,
					)
				}
			} catch (err) {
				console.log(`Error at reminder.ts' time function, server ${message.guild?.id}\n\n${err}`)
			}
		}

		async function remindSchedule(message: Message, date: string, time: string, utc: string, reminder: string) {
			try {
				if (!date) {
					return message.channel.send(
						`You haven't specified the date for your reminder.\nIf you need help with reminders, please use \`${guildData?.prefix}help reminder\` to see instructions`,
					)
				}

				if (!time) {
					return message.channel.send(
						`You haven't specified the time for your reminder.\nIf you need help with reminders, please use \`${guildData?.prefix}help reminder\` to see instructions`,
					)
				}

				if (!utc) {
					return message.channel.send(
						`You haven't specified the timezone for your reminder.\nIf you need help with reminders, please use \`${guildData?.prefix}help reminder\` to see instructions`,
					)
				}

				if (reminder) {
					if (reminder.length > 2000) {
						return message.channel.send(`Your reminder is too long. Maximum is 2000 characters.`)
					}
				}

				let files: string | undefined
				let text: string | undefined
				let reminderContent: string | undefined

				if (message.attachments.array() !== undefined) {
					const getUrl = message.attachments.array()
					files = getUrl[0] ? getUrl.join(`, `) : ``
				}

				if (reminder) {
					text = reminder
				}

				if (files && text) {
					reminderContent = `${Util.escapeMarkdown(text)}\n${files}`
				} else if (text && !files) {
					reminderContent = Util.escapeMarkdown(text)
				} else if (!text && files) {
					reminderContent = files
				} else if (!text && !files) {
					return message.channel.send(`You didn't attach any content for your reminder`)
				}

				if ((reminderContent?.length as number) > 2000) {
					return message.channel.send(`Your tag content is too long for me to be able to send it, sorry 😔`)
				}

				const remindDateGathered = `${date} ${time} ${utc}`

				if (moment(remindDateGathered, `DD-MM-YYYY HH:mm Z`, true).isValid() === false) {
					return message.channel.send(
						`You need to specify a valid date to create a scheduled reminder. The format is DD-MM-YYYY HH:mm Z.\nE.g. \`25-11-2021 08:00 +02:00\``,
					)
				}

				const remindDate = moment.utc(remindDateGathered, `DD-MM-YYYY HH:mm Z`).toDate()
				const now: Date = new Date(moment().format())
				if (remindDate.getTime() < now.getTime())
					return message.channel.send(`Your reminder date has already been passed.`)
				const diff: number = remindDate.getTime() - now.getTime()
				if (diff < 10000) {
					return message.channel.send(`Your reminder must be scheduled to more than 10 seconds into the future`)
				}

				if (diff > 157784760000) {
					return message.channel.send(`Your reminder must be scheduled to less than 5 years into the future`)
				}

				const reminderAttr: reminderCreationAttributes = {
					userID: BigInt(message.author.id),
					reminder: reminderContent as string,
					date: remindDate,
				}

				const reminderData = (await remindDB
					.findOrCreate({
						raw: true,
						where: { userID: message.author.id, reminder: reminder },
						defaults: reminderAttr,
					})
					.catch(console.error)) as [remindDB, boolean]

				if (reminderData[1] === false) {
					return message.channel.send(`Your already have a reminder set with the following: \`${reminder}\``)
				}

				try {
					await client.users.cache
						.get(message.author.id)
						?.send(
							`Your reminder has been set!\n${capitalize(
								moment(now).to(remindDate),
							)} you will be reminded to \`${reminder}\`.\nDate for reminder: approx. <t:${moment(remindDate).format(
								`X`,
							)}:F>`,
						)
					return await message.channel.send(`Your reminder has been set.`)
				} catch {
					await remindDB.destroy({
						where: {
							userID: message.author.id,
							reminder: reminder,
							date: remindDate,
						},
					})
					return await message.channel.send(
						`Reminder hasn't been set, because I can't send DM's to you.\nPlease check your privacy settings and try again.`,
					)
				}
			} catch (err) {
				console.log(`Error at reminder.ts' schedule function, server ${message.guild?.id}\n\n${err}`)
			}
		}

		async function remindList(message: Message) {
			try {
				const reminderData = await remindDB.findAll({
					raw: true,
					where: { userID: message.author.id },
					order: [[`date`, `DESC`]],
				})

				const now: Date = new Date()

				if (!reminderData.length) {
					return message.channel.send(
						`You haven't set any reminders.\nUse \`${guildData?.prefix}help reminder\` if you need help with setting a reminder`,
					)
				}

				const embeds = await generateCaseEmbedding(reminderData)
				try {
					embeds.forEach(async (embed) => await client.users.cache.get(message.author.id)?.send(embed))
				} catch (err) {
					return message.channel.send(
						`Reminder list hasn't been sent, because I can't send DM's to you.\nPlease check your privacy settings and try again.`,
					)
				}

				// eslint-disable-next-line no-inner-declarations
				async function generateCaseEmbedding(input: remindDB[]) {
					const embeds = []
					for (let i = 0; i < input.length; i += 1) {
						const current = input[i]

						const embed = new MessageEmbed()
						embed.setAuthor(`Reminder`, client.user?.avatarURL({ format: `png` }) as string)
						embed.setColor(`${await urlToColours(message.author.avatarURL({ format: `png` }) as string)}`)
						embed.setDescription(`${current.reminder}\n\nRemind Date: <t:${moment(current.date).format(`X`)}:R>`)
						embed.setTitle(`${capitalize(moment(now).to(current.date))}`)
						embed.setThumbnail(
							message.author.avatarURL({
								format: `png`,
								size: 1024,
								dynamic: true,
							}) as string,
						)
						embeds.push(embed)
					}
					return embeds
				}
			} catch (err) {
				console.log(`Error at reminder.ts' schedule function, server ${message.guild?.id}\n\n${err}`)
			}
		}
	},
}
