import { Command } from '../../interfaces'
import database from '../../database/database'
import { initModels, muteRole, muteRoleCreationAttributes, guild } from '../../database/models/init-models'
import { Message } from 'discord.js'

export const command: Command = {
	name: `muterole`,
	aliases: [],
	category: `admin`,
	description: `Set an mute role that users get assigned when a mod mutes them`,
	usage: `muterole status\nmuterole set <roleID or role mention>\nmuterole delete`,
	website: `https://www.bentobot.xyz/commands#muterole`,
	run: async (client, message, args): Promise<Message | undefined> => {
		if (!message.member?.hasPermission(`MANAGE_ROLES`)) {
			return message.channel
				.send(`You do not have permission to use this command!`)
				.then((m) => m.delete({ timeout: 10000 }))
		}

		initModels(database)

		const guildData = await guild.findOne({ raw: true, where: { guildID: message.guild?.id } })

		if (args.length < 1) {
			return message.channel.send(
				`You must specify what you want to do with the mute role settings.\nUse \`${guildData?.prefix}help muterole\` to see how to use this command.`,
			)
		}

		if (args[0] === `status`) {
			const muteRoleData = await muteRole.findOne({ raw: true, where: { guildID: message.guild?.id } })
			if (muteRoleData !== null) {
				return message.channel.send(`
            mute role is currently \`${muteRoleData.roleID ? `Enabled` : `Disabled`}\` on this server.`)
			} else {
				return message.channel.send(
					`This server doesn't have a mute role.\nUse \`${guildData?.prefix}help muterole\` to see how to setup a mute role for this server.`,
				)
			}
		}

		if (args[0] === `set`) {
			if (!args[1]) return message.channel.send(`Please assign a role id as the second argument`)
			let role: string | undefined
			try {
				const roleID = message.mentions.roles.first() || message.guild?.roles.cache.get(args[1])
				role = roleID?.id
			} catch {
				return message.channel.send(`Your role id ${args[1]} was invalid.\nPlease use a valid role id.`)
			}

			const roleData = await muteRole.findOne({ raw: true, where: { guildID: message.guild?.id } })

			if (roleData === null) {
				const attr: muteRoleCreationAttributes = {
					guildID: BigInt(message.guild?.id as string),
					roleID: BigInt(role as string),
				}
				await muteRole.create(attr)
				return message.channel.send(`Your role <@&${role}> was set as an mute role.`, {
					disableMentions: `everyone`,
				})
			} else {
				await muteRole.update({ roleID: BigInt(role as string) }, { where: { guildID: message.guild?.id } })
				return message.channel.send(`Your role <@&${role}> was set as an mute role.`, {
					disableMentions: `everyone`,
				})
			}
		}

		if (args[0] === `delete`) {
			await muteRole.destroy({ where: { guildID: message.guild?.id } })
			return message.channel.send(
				`Your mute role is now deleted in Bento's database and Bento will from now on not mute users.\nPlease use ${guildData?.prefix}muterole set <role> to set an mute role again.\nYou can't mute users without a mute role.`,
			)
		}
	},
}
