import { Command } from '../../interfaces';
import database from '../../database/database';
import { initModels, modLog, modLogCreationAttributes, guild, roleChannel, roleChannelCreationAttributes } from '../../database/models/init-models';
import { Message, TextChannel } from 'discord.js';

export const command: Command = {
    name: 'rolechannel',
    aliases: ['rolec'],
    category: 'admin',
    description: 'set the role channel',
    usage: ' is the prefix\nrolechannel <status>\nrolechannel <channel> <channelID>\nrolechannel <delete>',
    run: async (client, message, args): Promise<Message> => {
        if (!message.member.hasPermission('MANAGE_GUILD')) {
            return message.channel.send('You do not have permission to use this command!').then(m => m.delete({timeout: 10000}));
        };

        initModels(database);

        const guildData = await guild.findOne({raw:true, where: {guildID: message.guild.id}});

        if (args.length < 1) {
            return message.channel.send(`You must specify what you want to do with the role channel settings.\nUse \`${guildData.prefix}help rolechannel\` to see how to use this command.`);
        };

        if (args[0] == 'status') {
            try {
                const roleChannelData = await roleChannel.findOne({raw: true, where: {guildID: message.guild.id}});
                return message.channel.send(`
            The role channel is currently \`enabled\` on this server.\nThe role channel on this server is currently in <#${roleChannelData.channelID}>.`);
            } catch {
                return message.channel.send(`This server doesn't have a role channel.\nUse \`${guildData.prefix}help modlog\` to see how to setup a mod log for this server.`)
            }
        }

        if (args[0] == 'channel') {
            if (!args[1]) return message.channel.send('Please assign a channel id as the second argument');
            let channel: string;
            try {
                const channelID = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]) as TextChannel
                channel = channelID.id
            } catch {
                return message.channel.send(`Your channel id ${args[1]} was invalid.\nPlease use a valid channel id.`);
            }
            
            const roleChannelData = await roleChannel.findOne({raw: true, where: {guildID: message.guild.id}});
            
            if (roleChannelData === null) {
                const attr: roleChannelCreationAttributes = {
                    guildID: BigInt(message.guild.id),
                    channelID: BigInt(channel)
                }
                const createmodLogChannelData = await roleChannel.create(attr);

                return message.channel.send(`Your role channel was assigned! It is in <#${createmodLogChannelData.channelID}> `);
            } else {
                await roleChannel.update({channelID: BigInt(channel)}, {where: {guildID: message.guild.id}});

                return message.channel.send(`Your role channel was updated! It is now <#${channel}>`);
            }
            
        }

        if (args[0] == 'delete') {
            try {
                await roleChannel.destroy({where: { channelID: message.guild.id}});
            return message.channel.send(`Your role channel channel is deleted in Bento's database and Bento will from now on not manage roles.\nPlease use ${guildData.prefix}rolechannel channel <channelID> to enable it again.`);
            } catch {
                return message.channel.send(`You don't have a role channel enabled.`)
            }
        }
    }
}