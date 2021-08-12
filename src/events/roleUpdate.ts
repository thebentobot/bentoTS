import { Event } from "../interfaces";
import database from '../database/database';
import { initModels, modLog, autoRole, muteRole, guild, role as roleDB, availableRolesGuild } from '../database/models/init-models';
import { TextChannel, Role } from "discord.js"

export const event: Event = {
    name: 'roleUpdate',
    run: async (client, oldRole: Role, newRole: Role): Promise<any> => {
        initModels(database);

        const guildData = await guild.findOne({where: { guildID: oldRole.guild.id}});
        const muteRoleData = await muteRole.findOne({where: { roleID: oldRole.id}});
        const roleData = await roleDB.findOne({where: { roleID: oldRole.id}});

        if (muteRoleData && newRole.permissions.has('SEND_MESSAGES')) {
            try {
                const log = await modLog.findOne({where: { guildID: oldRole.guild.id}});
                const modLogChannel: TextChannel = client.channels.cache.get(`${log.channel}`) as TextChannel;
                return await modLogChannel.send(`The mute role **${oldRole.name}** has been updated${oldRole.name === newRole.name ? ` ` : ` to ${newRole.name}`} and has send messages enabled, which goes against the purpose of a mute role.\nIf you want a new mute role, please use ${guildData.prefix}muteRole again.`)
            } catch {
                return
            }
        }

        if (roleData && roleData.roleName !== newRole.name) {
            const availableRoleData = await availableRolesGuild.findOne({raw: true, where: {role: roleData.roleName, guildID: oldRole.guild.id}})
            if (availableRoleData) {
                await availableRolesGuild.update({role: newRole.name}, {where: {role: roleData.roleName, guildID: oldRole.guild.id}})
            }
            try {
                const log = await modLog.findOne({where: { guildID: oldRole.guild.id}});
                const modLogChannel: TextChannel = client.channels.cache.get(`${log.channel}`) as TextChannel;
                return await modLogChannel.send(`You have updated the role name for the role **${oldRole.name}** to **${newRole.name}**, which is a role users can assign in the role management channel, and it has been updated accordingly in the database.\nRemember to update the role channel message by using \`${guildData.prefix}role update\` and perhaps change the role commands to obtain the role, if the name differs a lot.`)
            } catch {
                return
            }
        }

        if (oldRole.name !== newRole.name) {
            try {
                const log = await modLog.findOne({where: { guildID: oldRole.guild.id}});
                const modLogChannel: TextChannel = client.channels.cache.get(`${log.channel}`) as TextChannel;
                await modLogChannel.send(`A role called **${oldRole.name}** was updated to **${newRole.name}**.\nGet more info in the audit log.`)
            } catch {
                return
            }
        }

        if (oldRole.permissions !== newRole.permissions) {
            try {
                const log = await modLog.findOne({where: { guildID: oldRole.guild.id}});
                const modLogChannel: TextChannel = client.channels.cache.get(`${log.channel}`) as TextChannel;
                await modLogChannel.send(`A role called **${oldRole.name}** was updated to **${newRole.name}**.\nGet more info in the audit log.`)
            } catch {
                return
            }
        }
    }
}

/*
Explanation for the specification and import of TextChannel can be found here: https://github.com/discordjs/discord/issues/3622
*/