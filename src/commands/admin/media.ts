import { Command } from '../../interfaces';
import database from '../../database/database';
import { initModels, guild } from '../../database/models/init-models';
import { Message } from 'discord.js';

export const command: Command = {
    name: 'media',
    aliases: [],
    category: 'admin',
    description: 'Enable or disable the gif command on this server.',
    usage: 'media <enable/disable/status>',
    run: async (client, message, args): Promise<Message> => {
        if (!message.member.hasPermission('MANAGE_GUILD')) {
            return message.channel.send('You do not have permission to use this command!').then(m => m.delete({timeout: 10000}));
        };

        initModels(database);

        const guildData = await guild.findOne({raw:true, where: {guildID: message.guild.id}});

        if (args.length < 1) {
            return message.channel.send(`You must specify what you want to do with the media setting.\nUse \`${guildData.prefix}help media\` to see how to use this command.`);
        };

        if (args[0] == 'status') {
            return message.channel.send(`Media content is currently \`${guildData.media ? 'enabled' : 'disabled'}\` on this server`)
        }

        if (args[0] == 'enable' || args[0] == 'disable') {
            if (args[0] == 'enable') {
                await guild.update({media: true}, {where: {guildID: message.guild.id}});
                return message.channel.send(`Media content has been \`enabled\``);
            }
            if (args[0] == 'disable') {
                await guild.update({media: false}, {where: {guildID: message.guild.id}});
                return message.channel.send(`Media content has been \`disabled\``);
            }
        } else {
            return message.channel.send(`\`${args[0]}\` is an invalid argument for this command.\nYou must specify if you want to **enable** or **disable** media content on this server!\nMedia content is currently \`${guildData.media ? 'enabled' : 'disabled'}\` on this server`)
        }
    }
}