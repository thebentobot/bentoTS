import { Command } from '../../interfaces';
import database from '../../database/database';
import { initModels, guild } from '../../database/models/init-models';

export const command: Command = {
    name: 'nsfw',
    aliases: [],
    category: 'admin',
    description: 'Enable or disable NSFW content for the image and gif command on this server.',
    usage: 'nsfw <enable/disable/status>',
    run: async (client, message, args): Promise<any> => {
        if (!message.member.hasPermission('MANAGE_GUILD')) {
            return message.channel.send('You do not have permission to use this command!').then(m => m.delete({timeout: 10000}));
        };

        initModels(database);

        const guildData = await guild.findOne({raw:true, where: {guildID: message.guild.id}});

        if (args.length < 1) {
            return message.channel.send(`You must specify what you want to do with the NSFW setting.\nUse \`${guildData.prefix}help nsfw\` to see how to use this command.`);
        };

        if (args[0] == 'status') {
            return message.channel.send(`NSFW content is currently \`${guildData.nsfw ? 'enabled' : 'disabled'}\` on this server`)
        }

        if (args[0] == 'enable' || args[0] == 'disable') {
            if (args[0] == 'enable') {
                await guild.update({nsfw: true}, {where: {guildID: message.guild.id}});
                return message.channel.send(`NSFW content has been \`enabled\``);
            }
            if (args[0] == 'disable') {
                await guild.update({nsfw: false}, {where: {guildID: message.guild.id}});
                return message.channel.send(`NSFW content has been \`disabled\``);
            }
        } else {
            return message.channel.send(`\`${args[0]}\` is an invalid argument for this command.\nYou must specify if you want to **enable** or **disable** NSFW content for \`${guildData.prefix}image <query>\` and \`${guildData.prefix}gif <query>\` on this server!\nNSFW content is currently \`${guildData.nsfw ? 'enabled' : 'disabled'}\` on this server`)
        }
    }
}