import { GuildMember, Message, MessageEmbed } from 'discord.js'
import { QueryTypes } from 'sequelize'
import database from '../../database/database'
import { guild } from '../../database/models/guild'
import { rpsGame, rpsGameCreationAttributes } from '../../database/models/rpsGame'
import { Command } from '../../interfaces'
import { urlToColours } from '../../utils'

export const command: Command = {
	name: `rps`,
	aliases: [],
	category: `features`,
	description: `Play Rock, Paper, Scissors with Bento 🍱`,
	usage: `rps <rock, paper, scissors> to play the game\nrps stats [user mention or id] to see stats.`,
	website: `https://www.bentobot.xyz/commands#rps`,
	run: async (client, message, args): Promise<Message> => {
		if (args[0] === `stats`) return await userStats(message, args[1])
		const acceptedReplies = [`rock`, `paper`, `scissors`]
		const bentoReplies = [`Rock 🪨`, `Paper 🧻`, `Scissors ✂️`]
		const random = Math.floor(Math.random() * acceptedReplies.length)
		const bentoResult = bentoReplies[random]
		const result = acceptedReplies[random]

		const guildData = await guild.findOne({
			raw: true,
			where: { guildID: message.guild?.id },
		})

		const choice = args[0]
		if (!choice) return message.channel.send(`How to play: \`${guildData?.prefix}rps <rock|paper|scissors>\``)
		if (!acceptedReplies.includes(choice))
			return message.channel.send(`Only these responses are accepted: \`${acceptedReplies.join(`, `)}\``)

		const username = message.member?.nickname ? message.member?.nickname : message.author.username

		message.channel.send(bentoResult)

		const userDefault: rpsGameCreationAttributes = {
			userID: BigInt(message.author.id),
			paperLosses: 0,
			paperWins: 0,
			rockLosses: 0,
			rockWins: 0,
			scissorWins: 0,
			scissorsLosses: 0,
			paperTies: 0,
			rockTies: 0,
			scissorsTies: 0,
		}

		if (result === choice) {
			switch (choice) {
				case `rock`:
					{
						const userData = await rpsGame.findOrCreate({
							raw: true,
							where: { userID: message.author.id },
							defaults: userDefault,
						})
						await rpsGame.update(
							{ rockTies: (userData[0].rockTies as number) + 1 },
							{ where: { userID: message.author.id } },
						)
					}
					break
				case `paper`:
					{
						const userData = await rpsGame.findOrCreate({
							raw: true,
							where: { userID: message.author.id },
							defaults: userDefault,
						})
						await rpsGame.update(
							{ paperTies: (userData[0].paperTies as number) + 1 },
							{ where: { userID: message.author.id } },
						)
					}
					break
				case `scissors`: {
					const userData = await rpsGame.findOrCreate({
						raw: true,
						where: { userID: message.author.id },
						defaults: userDefault,
					})
					await rpsGame.update(
						{ scissorsTies: (userData[0].scissorsTies as number) + 1 },
						{ where: { userID: message.author.id } },
					)
				}
			}
			return message.channel.send(`**${username}** Its a tie 👔! We had the same choice 😂`)
		}

		switch (choice) {
			case `rock`: {
				if (result === `paper`) {
					const userData = await rpsGame.findOrCreate({
						raw: true,
						where: { userID: message.author.id },
						defaults: userDefault,
					})
					await rpsGame.update(
						{ rockLosses: (userData[0].rockLosses as number) + 1 },
						{ where: { userID: message.author.id } },
					)
					return message.channel.send(`**${username}** I won! 🤣`)
				} else {
					const userData = await rpsGame.findOrCreate({
						raw: true,
						where: { userID: message.author.id },
						defaults: userDefault,
					})
					await rpsGame.update(
						{ rockWins: (userData[0].rockWins as number) + 1 },
						{ where: { userID: message.author.id } },
					)
					return message.channel.send(`**${username}** You won! 😔`)
				}
			}
			case `paper`: {
				if (result === `scissors`) {
					const userData = await rpsGame.findOrCreate({
						raw: true,
						where: { userID: message.author.id },
						defaults: userDefault,
					})
					await rpsGame.update(
						{ paperLosses: (userData[0].paperLosses as number) + 1 },
						{ where: { userID: message.author.id } },
					)
					return message.channel.send(`**${username}** I won! 🤣`)
				} else {
					const userData = await rpsGame.findOrCreate({
						raw: true,
						where: { userID: message.author.id },
						defaults: userDefault,
					})
					await rpsGame.update(
						{ paperWins: (userData[0].paperWins as number) + 1 },
						{ where: { userID: message.author.id } },
					)
					return message.channel.send(`**${username}** You won! 😔`)
				}
			}
			case `scissors`: {
				if (result === `rock`) {
					const userData = await rpsGame.findOrCreate({
						raw: true,
						where: { userID: message.author.id },
						defaults: userDefault,
					})
					await rpsGame.update(
						{ scissorsLosses: (userData[0].scissorsLosses as number) + 1 },
						{ where: { userID: message.author.id } },
					)
					return message.channel.send(`**${username}** I won! 🤣`)
				} else {
					const userData = await rpsGame.findOrCreate({
						raw: true,
						where: { userID: message.author.id },
						defaults: userDefault,
					})
					await rpsGame.update(
						{ scissorWins: (userData[0].scissorWins as number) + 1 },
						{ where: { userID: message.author.id } },
					)
					return message.channel.send(`**${username}** You won! 😔`)
				}
			}
			default: {
				return message.channel.send(`Only these responses are accepted: \`${acceptedReplies.join(`, `)}\``)
			}
		}

		async function userStats(message: Message, user?: string) {
			let RPSUser: GuildMember
			let RPSUserID: string

			if (user) {
				try {
					const theUser = message.mentions.members?.has(client.user?.id as string)
						? message.mentions.members.size > 1
							? message.mentions.members.last()
							: message.member
						: message.mentions.members?.first() || (await message.guild?.members.fetch(user as string))
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					RPSUserID = theUser!.id as string
					RPSUser = theUser as GuildMember
				} catch {
					RPSUserID = message.author.id
					RPSUser = message.member as GuildMember
				}
			} else {
				RPSUserID = message.author.id
				RPSUser = message.member as GuildMember
			}

			const RPSData = await rpsGame.findOne({ raw: true, where: { userID: RPSUserID } })

			if (RPSData === null) return message.channel.send(`Error: This user does not have any stats for the RPS Game.`)

			interface rpsRankings {
				overallrank: number
				paperrank: number
				rockrank: number
				scissorsrank: number
			}

			const globalData: Array<rpsRankings> = await database.query(
				`
            SELECT overallRank, paperRank, rockRank, scissorsRank
			FROM (SELECT t.*, row_number() OVER (ORDER BY SUM(t."paperWins" + t."rockWins" + t."scissorWins") DESC,
				SUM(t."paperTies"+ t."rockTies" + t."scissorsTies") DESC,
				SUM(t."paperLosses" + t."rockLosses"+ t."scissorsLosses") DESC
			) AS overallRank, row_number() over (ORDER BY t."paperWins" DESC, t."paperTies" DESC, t."paperLosses" DESC
			) as paperRank, row_number() over (ORDER BY t."rockWins" DESC, t."rockTies" DESC, t."rockLosses" DESC
			) as rockRank, row_number() over (ORDER BY t."scissorWins" DESC, t."scissorsTies" DESC, t."scissorsLosses" DESC
			) as scissorsRank
				FROM "rpsGame" AS t
			GROUP BY t."id"
				) t
			WHERE "userID" = :user;`,
				{
					replacements: { user: RPSUserID as string },
					type: QueryTypes.SELECT,
				},
			)

			const serverData: Array<rpsRankings> = await database.query(
				`
            SELECT overallRank, paperRank, rockRank, scissorsRank
			FROM (SELECT t.*, row_number() OVER (ORDER BY SUM(t."paperWins" + t."rockWins" + t."scissorWins") DESC,
				SUM(t."paperTies"+ t."rockTies" + t."scissorsTies") DESC,
				SUM(t."paperLosses" + t."rockLosses"+ t."scissorsLosses") DESC
			) AS overallRank, row_number() over (ORDER BY t."paperWins" DESC, t."paperTies" DESC, t."paperLosses" DESC
			) as paperRank, row_number() over (ORDER BY t."rockWins" DESC, t."rockTies" DESC, t."rockLosses" DESC
			) as rockRank, row_number() over (ORDER BY t."scissorWins" DESC, t."scissorsTies" DESC, t."scissorsLosses" DESC
			) as scissorsRank
				FROM "rpsGame" AS t
			INNER JOIN "guildMember" gM on t."userID" = gM."userID"
			WHERE gM."guildID" = :guild
			GROUP BY t."id"
				) t
			WHERE "userID" = :user;`,
				{
					replacements: { guild: message?.guild?.id as string, user: RPSUserID as string },
					type: QueryTypes.SELECT,
				},
			)

			const userStatsEmbed = new MessageEmbed()
				.setTitle(
					`RPS Stats for ${
						RPSUser.nickname === null ? `${RPSUser.user.username}#${RPSUser.user.discriminator}` : `${RPSUser.nickname}`
					}`,
				)
				.setAuthor(
					RPSUser.nickname === null ? `${RPSUser.user.username}#${RPSUser.user.discriminator}` : `${RPSUser.nickname}`,
					RPSUser.user.avatarURL({ dynamic: true }) as string,
				)
				.setThumbnail(RPSUser.user.avatarURL({ dynamic: true, size: 1024, format: `png` }) as string)
				.setColor(`${await urlToColours(RPSUser.user.avatarURL({ format: `png` }) as string)}`)
				.setTimestamp()
				.setDescription(
					`**Overall**\n${Number(RPSData.rockWins) + Number(RPSData.paperWins) + Number(RPSData.scissorWins)} Wins, ${
						Number(RPSData.rockTies) + Number(RPSData.paperTies) + Number(RPSData.scissorsTies)
					} Ties, ${
						Number(RPSData.rockLosses) + Number(RPSData.paperLosses) + Number(RPSData.scissorsLosses)
					} Losses, Win Rate of ${(
						winRateCalculation(
							Number(RPSData.rockWins) + Number(RPSData.paperWins) + Number(RPSData.scissorWins),
							Number(Number(RPSData.rockWins) + Number(RPSData.paperWins) + Number(RPSData.scissorWins)) +
								Number(Number(RPSData.rockTies) + Number(RPSData.paperTies) + Number(RPSData.scissorsTies)) +
								Number(Number(RPSData.rockLosses) + Number(RPSData.paperLosses) + Number(RPSData.scissorsLosses)),
						) * 100
					).toFixed(2)}%\nRank ${serverData[0].overallrank} on ${message.guild?.name}, Rank ${
						globalData[0].overallrank
					} globally\n\n**Rock**\n${RPSData.rockWins} Wins, ${RPSData.rockTies} Ties, ${
						RPSData.rockLosses
					} Losses, Win Rate of ${(
						winRateCalculation(
							RPSData.rockWins as number,
							Number(RPSData.rockWins) + Number(RPSData.rockTies) + Number(RPSData.rockLosses),
						) * 100
					).toFixed(2)}%\nRank ${serverData[0].rockrank} on ${message.guild?.name}, Rank ${
						globalData[0].rockrank
					} globally\n\n**Paper**\n${RPSData.paperWins} Wins, ${RPSData.paperTies} Ties, ${
						RPSData.paperLosses
					} Losses, Win Rate of ${(
						winRateCalculation(
							RPSData.paperWins as number,
							Number(RPSData.paperWins) + Number(RPSData.paperTies) + Number(RPSData.paperLosses),
						) * 100
					).toFixed(2)}%\nRank ${serverData[0].paperrank} on ${message.guild?.name}, Rank ${
						globalData[0].paperrank
					} globally\n\n**Scissors**\n${RPSData.scissorWins} Wins, ${RPSData.scissorsTies} Ties, ${
						RPSData.scissorsLosses
					} Losses, Win Rate of ${(
						winRateCalculation(
							RPSData.scissorWins as number,
							Number(RPSData.scissorWins) + Number(RPSData.scissorsTies) + Number(RPSData.scissorsLosses),
						) * 100
					).toFixed(2)}%\nRank ${serverData[0].scissorsrank} on ${message.guild?.name}, Rank ${
						globalData[0].scissorsrank
					} globally`,
				)
			return message.channel.send(userStatsEmbed)
		}

		function winRateCalculation(a: number, b: number) {
			let c = a / b
			if (isNaN(c)) {
				c = 0
			}
			return c
		}
	},
}
