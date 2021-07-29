import { Event } from "../interfaces";
import database from '../database/database';
import { initModels, modLog } from '../database/models/init-models';
import { TextChannel, GuildChannel } from "discord.js"

export const event: Event = {
    name: 'channelUpdate',
    run: async (client, oldChannel: GuildChannel, newChannel: GuildChannel): Promise<any> => {
        initModels(database);

        try {
            const log = await modLog.findOne({where: { guildID: oldChannel.guild.id}})
            const modLogChannel: TextChannel = client.channels.cache.get(`${log.channel}`) as TextChannel;
            return await modLogChannel.send(`**Channel update!**\nOld channel info:\n${oldChannel}\nNew channel info:\n${newChannel}`)
        } catch {
            return
        }
    }
}

/*
Explanation for the specification and import of TextChannel can be found here: https://github.com/discordjs/discord/issues/3622
*/