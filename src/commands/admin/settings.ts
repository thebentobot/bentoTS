import { Command } from '../../interfaces'
import { Message, MessageEmbed } from 'discord.js'
import database from '../../database/database'
import {
	initModels,
	guild,
	messageLog,
	modLog,
	bye,
	welcome,
	autoRole,
	muteRole,
	caseGlobal,
} from '../../database/models/init-models'
import { trim } from '../../utils/trim'
import { urlToColours } from '../../utils/urlToColours'

export const command: Command = {
	name: `settings`,
	aliases: [],
	category: `admin`,
	description: `Sends an overview of the server settings`,
	usage: `settings`,
	website: `https://www.bentobot.xyz/commands#settings`,
	run: async (client, message): Promise<Message> => {
		if (!message.member?.hasPermission(`MANAGE_CHANNELS`)) {
			return message.channel
				.send(`You do not have permission to use this command!`)
				.then((m) => m.delete({ timeout: 10000 }))
		}

		initModels(database)

		const guildData = await guild.findOne({ raw: true, where: { guildID: message.guild?.id } })
		const messageLogData = await messageLog.findOne({ raw: true, where: { guildID: message.guild?.id } })
		const modLogData = await modLog.findOne({ raw: true, where: { guildID: message.guild?.id } })
		const byeData = await bye.findOne({ raw: true, where: { guildID: message.guild?.id } })
		const welcomeData = await welcome.findOne({ raw: true, where: { guildID: message.guild?.id } })
		const autoRoleData = await autoRole.findAll({ raw: true, where: { guildID: message.guild?.id } })
		const muteRoleData = await muteRole.findOne({ raw: true, where: { guildID: message.guild?.id } })
		const caseGlobalData = await caseGlobal.findOne({ raw: true, where: { guildID: message.guild?.id } })

		const modLogText = modLogData ? `<#${modLogData.channel}>` : `Not configured`
		const msgLogText = messageLogData ? `<#${messageLogData.channel}>` : `Not configured`
		const byeDataText = byeData?.channel && byeData?.message ? `Enabled in <#${byeData.channel}>` : `Disabled`
		const welcomeDataText =
			welcomeData?.channel && welcomeData?.message ? `Enabled in <#${welcomeData.channel}>` : `Disabled`
		const muteRoleDataText = muteRoleData ? `<@&${muteRoleData.roleID}>` : `Not configured`

		const Embed = new MessageEmbed()
			.setAuthor(
				`Bento 🍱`,
				`https://repository-images.githubusercontent.com/322448646/e3422d00-90d9-11eb-9d3d-2939e261681a`,
				`https://github.com/thebentobot/bentoTS`,
			)
			.setTitle(`Server settings for ${message.guild?.name}`)
			.setTimestamp()
			.setColor(
				`${
					message.guild?.iconURL()
						? await urlToColours(message.guild.iconURL({ format: `png` }) as string)
						: await urlToColours(client.user?.avatarURL({ format: `png` }) as string)
				}`,
			)
			.addField(`Tiktok`, `${guildData?.tiktok ? `Enabled` : `Disabled`}`, true)
			.addField(`Media`, `${guildData?.media ? `Enabled` : `Disabled`}`, true)
			.addField(`Leaderboard`, `${guildData?.leaderboard ? `Enabled` : `Disabled`}`, true)
			.addField(`Server name enabled for global cases`, `${caseGlobalData?.serverName ? `Enabled` : `Disabled`}`, true)
			.addField(`Case reasons enabled for global cases`, `${caseGlobalData?.reason ? `Enabled` : `Disabled`}`, true)
			.addField(`Welcome Messages`, `${welcomeDataText}`, true)
			.addField(`Bye Messages`, `${byeDataText}`, true)
			.addField(`Mod log channel`, `${modLogText}`, true)
			.addField(`Message log channel`, `${msgLogText}`, true)
			.addField(`Mute role`, `${muteRoleDataText}`, true)
			.addField(
				autoRoleData.length > 1 ? `Auto assigned roles` : `Auto assigned role`,
				autoRoleData.length ? trim(autoRoleData.map((r) => `<@&${r.roleID}>`).join(` | `), 1024) : `Not configured`,
				false,
			)
		if (message.guild?.iconURL()) {
			Embed.setThumbnail(message.guild.iconURL({ dynamic: true, format: `png` }) as string)
		}

		return message.channel.send(Embed)
	},
}
