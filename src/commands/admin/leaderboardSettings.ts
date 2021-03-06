import { Command } from '../../interfaces'
import database from '../../database/database'
import { initModels, guild } from '../../database/models/init-models'
import { Message } from 'discord.js'

export const command: Command = {
	name: `leaderboardsettings`,
	aliases: [`lbs`],
	category: `admin`,
	description: `Enable or disable the XP and levelling system on this server.`,
	usage: `leaderboardsettings <enable/disable/status>`,
	website: `https://www.bentobot.xyz/commands#leaderboardsettings`,
	run: async (client, message, args): Promise<Message | undefined> => {
		try {
			if (!message.member?.hasPermission(`MANAGE_GUILD`)) {
				return message.channel
					.send(`You do not have permission to use this command!`)
					.then((m) => m.delete({ timeout: 10000 }))
			}

			initModels(database)

			const guildData = await guild.findOne({
				raw: true,
				where: { guildID: message.guild?.id },
			})

			if (args.length < 1) {
				return message.channel.send(
					`You must specify what you want to do with the leaderboard setting.\nUse \`${guildData?.prefix}help leaderboard\` to see how to use this command.`,
				)
			}

			if (args[0] === `status`) {
				return message.channel.send(
					`The leaderboard and its surrounding features are currently \`${
						guildData?.leaderboard ? `enabled` : `disabled`
					}\` on this server`,
				)
			}

			if (args[0] === `enable` || args[0] === `disable`) {
				if (args[0] === `enable`) {
					await guild.update({ leaderboard: true }, { where: { guildID: message.guild?.id } })
					return message.channel.send(`The leaderboard and its surrounding features has been \`enabled\``)
				}
				if (args[0] === `disable`) {
					await guild.update({ leaderboard: false }, { where: { guildID: message.guild?.id } })
					return message.channel.send(`The leaderboard and its surrounding features has been \`disabled\``)
				}
			} else {
				return message.channel.send(
					`\`${
						args[0]
					}\` is an invalid argument for this command.\nYou must specify if you want to **enable** or **disable** the leaderboard and its surrounding features on this server!\nIt is currently \`${
						guildData?.leaderboard ? `enabled` : `disabled`
					}\` on this server`,
				)
			}
		} catch (err) {
			console.log(`Error at leaderboardsettings.ts, server ${message.guild?.id}\n\n${err}`)
		}
	},
}
