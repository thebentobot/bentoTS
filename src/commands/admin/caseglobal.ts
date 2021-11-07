import { Command } from '../../interfaces'
import database from '../../database/database'
import { initModels, guild, caseGlobal } from '../../database/models/init-models'
import { Message } from 'discord.js'

export const command: Command = {
	name: `caseglobal`,
	aliases: [],
	category: `admin`,
	description: `Enable or disable server name and reasons for global cases.\nIf you disable them, the moderation cases's server info and reasons from this server will be classified, and if enabled, other server can see the server name and reasons for cases from this server.`,
	usage: `caseglobal server <enable/disable/status>\ncaseglobal reasons <enable/disable/status>`,
	website: `https://www.bentobot.xyz/commands#caseglobal`,
	run: async (client, message, args): Promise<Message | undefined> => {
		if (!message.member?.hasPermission(`MANAGE_GUILD`)) {
			return message.channel
				.send(`You do not have permission to use this command!`)
				.then((m) => m.delete({ timeout: 10000 }))
		}

		initModels(database)

		const guildData = await guild.findOne({ raw: true, where: { guildID: message.guild?.id } })

		if (args.length < 1) {
			return message.channel.send(
				`You must specify what you want to do with the caseglobal setting.\nUse \`${guildData?.prefix}help caseglobal\` to see how to use this command.`,
			)
		}

		const caseGlobalData = await caseGlobal.findOne({ raw: true, where: { guildID: message.guild?.id } })

		if (args[0] === `server` && args[1] === `status`) {
			return message.channel.send(
				`Server info for global moderation cases are currently \`${
					caseGlobalData?.serverName ? `enabled` : `disabled`
				}\` for this server`,
			)
		}

		if (args[0] === `reasons` && args[1] === `status`) {
			return message.channel.send(
				`Reasons for global moderation cases are currently \`${
					caseGlobalData?.reason ? `enabled` : `disabled`
				}\` for this server`,
			)
		}

		if ((args[0] === `server` && args[1] === `enable`) || args[1] === `disable`) {
			if (args[1] === `enable`) {
				await caseGlobal.update({ serverName: true }, { where: { guildID: message.guild?.id } })
				return message.channel.send(`Server info for global moderation cases has been \`enabled\``)
			}
			if (args[1] === `disable`) {
				await caseGlobal.update({ serverName: false }, { where: { guildID: message.guild?.id } })
				return message.channel.send(`Server info for global moderation cases has been \`disabled\``)
			}
		} else if ((args[0] === `reasons` && args[1] === `enable`) || args[1] === `disable`) {
			if (args[1] === `enable`) {
				await caseGlobal.update({ reason: true }, { where: { guildID: message.guild?.id } })
				return message.channel.send(`Reasons for global moderation cases has been \`enabled\``)
			}
			if (args[1] === `disable`) {
				await caseGlobal.update({ reason: false }, { where: { guildID: message.guild?.id } })
				return message.channel.send(`Reasons for global moderation cases has been \`disabled\``)
			}
		} else {
			return message.channel.send(
				`\`${args[0]}\` is an invalid argument for this command.\nUse \`${guildData?.prefix}help caseglobal\` to see how to use this command.`,
			)
		}
	},
}
