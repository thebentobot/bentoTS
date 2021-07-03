import { Event } from "../interfaces";
import database from '../database/database';
import { initModels, modLog } from '../database/models/init-models';
import { TextChannel, GuildChannel } from "discord.js"

export const event: Event = {
    name: 'channelCreate',
    run: async (client, channel: GuildChannel): Promise<any> => {
        initModels(database);

        try {
            const log = await modLog.findOne({where: { guildID: channel.guild.id}})
            const modLogChannel: TextChannel = client.channels.cache.get(`${log.channel}`) as TextChannel;
            await modLogChannel.send(`A channel called **${channel.name}** under the category **${channel.parent}** was created at **${channel.createdAt}**.\nGet more info in the audit log.`)
        } catch {
            return
        }
    }
}

/*
Explanation for the specification and import of TextChannel can be found here: https://github.com/discordjs/discord/issues/3622
*/