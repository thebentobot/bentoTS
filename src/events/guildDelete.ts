import { Event } from "../interfaces";
import database from '../database/database.js';
import { initModels, guild as DbGuild, welcome, tag, modLog, messageLog, guildMember, bye, muteRole, autoRole } from '../database/models/init-models.js';
import { Guild} from "discord.js"

export const event: Event = {
    name: 'guildDelete',
    run: async (client, guild: Guild): Promise<any> => {
        initModels(database);

        await DbGuild.destroy({where: { guildID: guild.id }});
        await welcome.destroy({where: { guildID: guild.id }});
        await tag.destroy({where: { guildID: guild.id }});
        await modLog.destroy({where: { guildID: guild.id }});
        await messageLog.destroy({where: { guildID: guild.id }});
        await guildMember.destroy({where: { guildID: guild.id }});
        await bye.destroy({where: { guildID: guild.id }});
        await muteRole.destroy({where: { guildID: guild.id }});
        await autoRole.destroy({where: { guildID: guild.id }});
    }
}