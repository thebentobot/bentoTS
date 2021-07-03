import { Command } from '../../interfaces';
import database from '../../database/database.js';
import { initModels, modLog, modLogCreationAttributes, guild } from '../../database/models/init-models.js';

export const command: Command = {
    name: 'modlog',
    aliases: [],
    category: 'admin',
    description: 'Get a mod log in a specified channel, to log changes and moderation on the server',
    usage: ' is the prefix\nmodlog <status>\nmodlog <channel> <channelID>\nmodlog <delete>',
    run: async (client, message, args): Promise<any> => {
        if (!message.member.hasPermission('MANAGE_GUILD')) {
            return message.channel.send('You do not have permission to use this command!').then(m => m.delete({timeout: 10000}));
        };

        initModels(database);

        const guildData = await guild.findOne({raw:true, where: {guildID: message.guild.id}});

        if (args.length < 1) {
            return message.channel.send(`You must specify what you want to do with the mod log settings.\nUse \`${guildData.prefix}help modlog\` to see how to use this command.`);
        };

        if (args[0] == 'status') {
            try {
                const modLogData = await modLog.findOne({raw: true, where: {guildID: message.guild.id}});
                return message.channel.send(`
            The mod Log is currently \`enabled\` on this server.\nThe mod Log  channel on this server is currently in <#${modLogData.channel}>.`);
            } catch {
                return message.channel.send(`This server doesn't have a mod log.\nUse \`${guildData.prefix}help modlog\` to see how to setup a mod log for this server.`)
            }
        }

        if (args[0] == 'channel') {
            if (!args[1]) return message.channel.send('Please assign a channel id as the second argument');
            let regExp = /[a-zA-Z]/g;
            let channel = args[1]
            if (regExp.test(channel) == true) return message.channel.send(`Your channel id ${args[1]} was invalid.\nPlease use a valid channel id.`);
            
            const modLogData = await modLog.findOne({raw: true, where: {guildID: message.guild.id}});
            
            if (modLogData === null) {
                const attr: modLogCreationAttributes = {
                    guildID: BigInt(message.guild.id),
                    channel: BigInt(channel)
                }
                const createmodLogChannelData = await modLog.create(attr);

                return message.channel.send(`Your mod log channel was assigned! It is in <#${createmodLogChannelData.channel}> `);
            } else {
                await modLog.update({channel: BigInt(channel)}, {where: {guildID: message.guild.id}});

                return message.channel.send(`Your mod log channel was updated! It is now <#${channel}>`);
            }
            
        }

        if (args[0] == 'delete') {
            await modLog.destroy({where: { channel: message.guild.id}});
            return message.channel.send(`Your mod log channel is deleted in Bento's database and Bento will from now on not log changes and moderation.\nPlease use ${guildData.prefix}modlog channel <channelID> to enable it again.`);
        }
    }
}