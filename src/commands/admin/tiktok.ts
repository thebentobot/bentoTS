import { Command } from '../../interfaces';
import database from '../../database/database';
import { initModels, guild } from '../../database/models/init-models';
import { Message } from 'discord.js';

export const command: Command = {
    name: 'tiktok',
    aliases: [],
    category: 'admin',
    description: 'Enable or disable TikTok embedding for all messages on this server.',
    usage: 'tiktok <enable/disable/status>',
    run: async (client, message, args): Promise<Message> => {
        if (!message.member.hasPermission('MANAGE_GUILD')) {
            return message.channel.send('You do not have permission to use this command!').then(m => m.delete({timeout: 10000}));
        };

        initModels(database);

        const guildData = await guild.findOne({raw:true, where: {guildID: message.guild.id}});

        if (args.length < 1) {
            return message.channel.send(`You must specify what you want to do with the TikTok setting.\nUse \`${guildData.prefix}help tiktok\` to see how to use this command.`);
        };

        if (args[0] == 'status') {
            return message.channel.send(`TikTok embedding is currently \`${guildData.tiktok ? 'enabled' : 'disabled'}\` on this server`)
        }

        if (args[0] == 'enable' || args[0] == 'disable') {
            if (args[0] == 'enable') {
                await guild.update({tiktok: true}, {where: {guildID: message.guild.id}});
                return message.channel.send(`TikTok embedding has been \`enabled\``);
            }
            if (args[0] == 'disable') {
                await guild.update({tiktok: false}, {where: {guildID: message.guild.id}});
                return message.channel.send(`TikTok embedding has been \`disabled\``);
            }
        } else {
            return message.channel.send(`\`${args[0]}\` is an invalid argument for this command.\nYou must specify if you want to **enable** or **disable** TikTok embedding for all messages on this server!\TikTok content is currently \`${guildData.tiktok ? 'enabled' : 'disabled'}\` on this server`)
        }
    }
}