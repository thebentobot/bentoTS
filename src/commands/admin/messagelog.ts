import { Command } from '../../interfaces';
import database from '../../database/database.js';
import { initModels, messageLog, messageLogCreationAttributes, guild } from '../../database/models/init-models.js';

export const command: Command = {
    name: 'messagelog',
    aliases: [],
    category: 'admin',
    description: 'Get a message log in a specified channel, to edited and deleted messages',
    usage: ' is the prefix\messagelog <status>\messagelog <channel> <channelID>\messagelog <delete>',
    run: async (client, message, args): Promise<any> => {
        if (!message.member.hasPermission('MANAGE_GUILD')) {
            return message.channel.send('You do not have permission to use this command!').then(m => m.delete({timeout: 10000}));
        };

        console.log('hello')

        initModels(database);

        const guildData = await guild.findOne({raw:true, where: {guildID: message.guild.id}});

        if (args.length < 1) {
            return message.channel.send(`You must specify what you want to do with the message log settings.\nUse \`${guildData.prefix}help messagelog\` to see how to use this command.`);
        };

        if (args[0] == 'status') {
            try {
                const messageLogData = await messageLog.findOne({raw: true, where: {guildID: message.guild.id}});
                return message.channel.send(`
            The message log is currently \`enabled\` on this server.\nThe message log channel on this server is currently in <#${messageLogData.channel}>.`);
            } catch {
                return message.channel.send(`This server doesn't have a message log.\nUse \`${guildData.prefix}help messagelog\` to see how to setup a message log for this server.`)
            }
        }

        if (args[0] == 'channel') {
            if (!args[1]) return message.channel.send('Please assign a channel id as the second argument');
            let regExp = /[a-zA-Z]/g;
            let channel = args[1]
            if (regExp.test(channel) == true) return message.channel.send(`Your channel id ${args[1]} was invalid.\nPlease use a valid channel id.`);
            
            const messageLogData = await messageLog.findOne({raw: true, where: {guildID: message.guild.id}});
            
            if (messageLogData === null) {
                const attr: messageLogCreationAttributes = {
                    guildID: BigInt(message.guild.id),
                    channel: BigInt(channel)
                }
                const createmessageLogChannelData = await messageLog.create(attr);
                return message.channel.send(`Your message log channel was assigned! It is in <#${createmessageLogChannelData.channel}> `);
            } else {
                await messageLog.update({channel: BigInt(channel)}, {where: {guildID: message.guild.id}});

                return message.channel.send(`Your message log channel was updated! It is now <#${channel}>`);
            }
            
        }

        if (args[0] == 'delete') {
            await messageLog.destroy({where: { channel: message.guild.id}});
            return message.channel.send(`Your message log channel is deleted in Bento's database and Bento will from now on not log edited and deleted messages.\nPlease use ${guildData.prefix}messagelog channel <channelID> to enable it again.`);
        }
    }
}