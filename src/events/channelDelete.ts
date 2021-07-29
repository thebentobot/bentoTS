import { Event } from "../interfaces";
import database from '../database/database';
import { initModels, modLog, messageLog, welcome, bye, guild, memberLog } from '../database/models/init-models';
import { TextChannel, GuildChannel } from "discord.js"

export const event: Event = {
    name: 'channelDelete',
    run: async (client, channel: GuildChannel): Promise<any> => {
        initModels(database);

        const guildData = await guild.findOne({where: { guildID: channel.guild.id}});
        const messageLogData = await messageLog.findOne({where: { channel: channel.id}});
        const memberLogData = await memberLog.findOne({where: { channel: channel.id}});
        const modLogData = await modLog.findOne({where: { channel: channel.id}});
        const welcomeData = await welcome.findOne({where: { channel: channel.id}});
        const byeData = await bye.findOne({where: { channel: channel.id}});

        if (messageLogData && modLogData) {
            await messageLog.destroy({where: { channel: channel.id}});
            const log = await modLog.findOne({where: { guildID: channel.guild.id}});
            const modLogChannel: TextChannel = client.channels.cache.get(`${log.channel}`) as TextChannel;
            await modLogChannel.send(`The deleted channel called **${channel.name}** was a **message log channel** and has been deleted from Bento's database.\nIf you want a new message log channel, please use ${guildData.prefix}messageLog again.`)
        }

        if (welcomeData && modLogData) {
            await welcome.destroy({where: { channel: channel.id}});
            const log = await modLog.findOne({where: { guildID: channel.guild.id}});
            const modLogChannel: TextChannel = client.channels.cache.get(`${log.channel}`) as TextChannel;
            await modLogChannel.send(`The deleted channel called **${channel.name}** was a **welcome channel** and has been deleted from Bento's database.\nIf you want a new welcome channel and welcome message, please use ${guildData.prefix}welcome again.`)
        }

        if (byeData && modLogData) {
            await bye.destroy({where: { channel: channel.id}});
            const log = await modLog.findOne({where: { guildID: channel.guild.id}});
            const modLogChannel: TextChannel = client.channels.cache.get(`${log.channel}`) as TextChannel;
            await modLogChannel.send(`The deleted channel called **${channel.name}** was a **bye channel** and has been deleted from Bento's database.\nIf you want a new bye channel and bye message, please use ${guildData.prefix}bye again.`)
        }

        if (memberLogData && modLogData) {
            await memberLog.destroy({where: { channel: channel.id}});
            const log = await modLog.findOne({where: { guildID: channel.guild.id}});
            const modLogChannel: TextChannel = client.channels.cache.get(`${log.channel}`) as TextChannel;
            await modLogChannel.send(`The deleted channel called **${channel.name}** was a **bye channel** and has been deleted from Bento's database.\nIf you want a new bye channel and bye message, please use ${guildData.prefix}bye again.`)
        }

        try {
            const log = await modLog.findOne({where: { guildID: channel.guild.id}});
            const modLogChannel: TextChannel = client.channels.cache.get(`${log.channel}`) as TextChannel;
            return await modLogChannel.send(`A channel called **${channel.name}** under the category **${channel.parent}** was deleted.\nGet more info in the audit log.`)
        } catch {
            return
        }
    }
}

/*
Explanation for the specification and import of TextChannel can be found here: https://github.com/discordjs/discord/issues/3622
*/