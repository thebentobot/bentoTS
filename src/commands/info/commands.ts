import { MessageEmbed } from 'discord.js';
import { Command } from '../../interfaces';
import database from '../../database/database.js';
import { initModels, guild } from '../../database/models/init-models.js';
import { stripIndents } from 'common-tags';
import { trim, urlToColours } from '../../utils/index.js'

export const command: Command = {
    name: 'commands',
    aliases: [],
    category: 'info',
    description: 'Displays a full list of bot commands categorised',
    usage: 'commands',
    run: async (client, message, args): Promise<any> => {
        initModels(database);
        const guildDB = await guild.findOne({raw: true, where: {guildID: message.guild.id}});
    
        const embed = new MessageEmbed()
        .setColor(`${await urlToColours(client.user.avatarURL({ format: 'png'}))}`)
        .setTitle('Command List')
        .setThumbnail(client.user.avatarURL())
        .setFooter('Created by Banner#1017')
        
        const commands = (category:any) => {
            return client.commands
                .filter(cmd => cmd.category === category)
                .map(cmd => `- \`${(guildDB.prefix) + cmd.name}\``)
                .join('\n');
        }
    
        const info = client.categories
            .map(cat => stripIndents`**${cat[0].toLowerCase() + cat.slice(1)}** \n${commands(cat)}`)
            .reduce((string, category) => `${string}\n${category}`);

        const desc = trim('Use `' + (`${guildDB.prefix}help <commandName>\` without the \`<>\` to see more information about a specific command.\n\n${info}`), 2048)

        return message.channel.send(embed.setDescription(desc));
    }
}