import { Event } from "../interfaces";
import database from '../database/database';
import { initModels, guild as DbGuild, welcome, warning, mute, tag, modLog, messageLog, kick, guildMember, bye, ban } from '../database/models/init-models';

export const event: Event = {
    name: 'guildDelete',
    run: async (client, guild) => {
        initModels(database);

        await DbGuild.destroy({where: { guildID: guild.id }});
        await welcome.destroy({where: { guildID: guild.id }});
        await warning.destroy({where: { guildID: guild.id }});
        await mute.destroy({where: { guildID: guild.id }});
        await tag.destroy({where: { guildID: guild.id }});
        await modLog.destroy({where: { guildID: guild.id }});
        await messageLog.destroy({where: { guildID: guild.id }});
        await kick.destroy({where: { guildID: guild.id }});
        await guildMember.destroy({where: { guildID: guild.id }});
        await bye.destroy({where: { guildID: guild.id }});
        await ban.destroy({where: { guildID: guild.id }});
    }
}