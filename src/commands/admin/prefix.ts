import { Command } from '../../interfaces';
import database from '../../database/database.js';
import { initModels, guild } from '../../database/models/init-models.js';

export const command: Command = {
    name: 'prefix',
    aliases: [],
    category: 'admin',
    description: 'Sets the prefix for this server.',
    usage: 'prefix <newPrefix>',
    run: async (client, message, args): Promise<any> => {
        message.delete();

        if (!message.member.hasPermission('ADMINISTRATOR')) {
            return message.channel.send('You do not have permission to use this command!').then(m => m.delete({timeout: 10000}));
        };

        initModels(database);

        const guildData = await guild.findOne({raw:true, where: {guildID: message.guild.id}});

        if (args.length < 1) {
            return message.channel.send(`You must specify a prefix to set for this server! Your current server prefix is \`${guildData.prefix}\``).then(m => m.delete({timeout: 10000}));
        };

        await guild.update({prefix: args[0]}, {where: {guildID: message.guild.id}})
        return message.channel.send(`Your server prefix has been updated to \`${args[0]}\``);
    }
}