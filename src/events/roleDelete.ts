import { Event } from "../interfaces";
import database from '../database/database';
import { initModels, modLog, autoRole, muteRole, guild, role as roleDB, availableRolesGuild } from '../database/models/init-models';
import { TextChannel, Role } from "discord.js"

export const event: Event = {
    name: 'roleDelete',
    run: async (client, role: Role): Promise<any> => {
        initModels(database);

        const guildData = await guild.findOne({where: { guildID: role.guild.id}});
        const autoRoleData = await autoRole.findOne({where: { roleID: role.id}});
        const muteRoleData = await muteRole.findOne({where: { roleID: role.id}});
        const roleData = await roleDB.findOne({where: { roleID: role.id}});

        if (autoRoleData) {
            await autoRole.destroy({where: { roleID: role.id}});
            try {
                const log = await modLog.findOne({where: { guildID: role.guild.id}});
                const modLogChannel: TextChannel = client.channels.cache.get(`${log.channel}`) as TextChannel;
                return await modLogChannel.send(`A deleted role called **${role.name}** was an **auto role** and has been deleted from Bento's database.\nIf you want a new auto role, please use ${guildData.prefix}autoRole again.`)
            } catch {
                return
            }
        }

        if (muteRoleData) {
            await muteRole.destroy({where: { roleID: role.id}});
            try {
                const log = await modLog.findOne({where: { guildID: role.guild.id}});
                const modLogChannel: TextChannel = client.channels.cache.get(`${log.channel}`) as TextChannel;
                return await modLogChannel.send(`A deleted role called **${role.name}** was a **mute role** and has been deleted from Bento's database.\nIf you want a new mute role, please use ${guildData.prefix}muteRole again.`)
            } catch {
                return
            }
        }

        if (roleData) {
            const availableRoleData = await availableRolesGuild.findOne({raw: true, where: {role: roleData.roleName, guildID: role.guild.id}})
            if (availableRoleData) {
                await availableRolesGuild.destroy({where: {role: roleData.roleName}})
            }
            await roleDB.destroy({where: { roleID: role.id}});
            try {
                const log = await modLog.findOne({where: { guildID: role.guild.id}});
                const modLogChannel: TextChannel = client.channels.cache.get(`${log.channel}`) as TextChannel;
                return await modLogChannel.send(`A deleted role called **${role.name}** was a role users could assign in the role management channel, and it has been deleted from Bento's database.\nRemember to update the role channel message by using \`${guildData.prefix}role update\`.`)
            } catch {
                return
            }
        }

        try {
            const log = await modLog.findOne({where: { guildID: role.guild.id}});
            const modLogChannel: TextChannel = client.channels.cache.get(`${log.channel}`) as TextChannel;
            return await modLogChannel.send(`A role called **${role.name}** was deleted.\nGet more info in the audit log.`)
        } catch {
            return
        }
    }
}

/*
Explanation for the specification and import of TextChannel can be found here: https://github.com/discordjs/discord/issues/3622
*/