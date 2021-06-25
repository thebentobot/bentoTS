import { Event } from "../interfaces";
import database from '../database/database';
import { initModels, modLog, autoRole, muteRole, guild } from '../database/models/init-models';
import { TextChannel, Role } from "discord.js"

export const event: Event = {
    name: 'roleDelete',
    run: async (client, role: Role): Promise<any> => {
        initModels(database);

        const guildData = await guild.findOne({where: { guildID: role.guild.id}});
        const autoRoleData = await autoRole.findOne({where: { roleID: role.id}});
        const muteRoleData = await muteRole.findOne({where: { roleID: role.id}});

        try {
            const log = await modLog.findOne({where: { guildID: role.guild.id}});
            const modLogChannel: TextChannel = client.channels.cache.get(`${log.channel}`) as TextChannel;
            await modLogChannel.send(`A role called **${role.name}** was deleted.\nGet more info in the audit log.`)
        } catch {
            return
        }

        if (autoRoleData) {
            await autoRole.destroy({where: { roleID: role.id}});
            try {
                const log = await modLog.findOne({where: { guildID: role.guild.id}});
                const modLogChannel: TextChannel = client.channels.cache.get(`${log.channel}`) as TextChannel;
                await modLogChannel.send(`A deleted role called **${role.name}** was an **auto role** and has been deleted from Bento's database.\nIf you want a new auto role, please use ${guildData.prefix}autoRole again.`)
            } catch {
            }
        }

        if (muteRoleData) {
            await muteRole.destroy({where: { roleID: role.id}});
            try {
                const log = await modLog.findOne({where: { guildID: role.guild.id}});
                const modLogChannel: TextChannel = client.channels.cache.get(`${log.channel}`) as TextChannel;
                await modLogChannel.send(`A deleted role called **${role.name}** was a **mute role** and has been deleted from Bento's database.\nIf you want a new mute role, please use ${guildData.prefix}muteRole again.`)
            } catch {
            }
        }
    }
}

/*
Explanation for the specification and import of TextChannel can be found here: https://github.com/discordjs/discord.js/issues/3622
*/