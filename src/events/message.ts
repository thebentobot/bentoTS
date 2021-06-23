import { Event, Command } from '../interfaces';
import { Message } from 'discord.js';
import database from '../database/database';
import { checkURL } from '../utils/checkURL';

// [table] Attributes is the interface defining the fields
// [table] CreationAttributes is the interface defining the fields when creating a new record
import { initModels, guild } from '../database/models/init-models';
import { tiktokEmbedding } from '../utils/tiktok';

export const event: Event = {
    name: 'message',
    run: async (client, message: Message) => {
        if (message.author.bot) return;
        
        initModels(database); //imports models into sequelize instance

        // finds prefix by guildID
        const messageGuild = await guild.findOne({raw: true, where: {"guildID": message.guild.id}}); //raw: true returns only the dataValues

        // we need to add global and server XP (remember 1 minute cooldown)

        const args = message.content
        .slice(messageGuild.prefix.length)
        .trim()
        .split(/ +/g);

        // tiktok feature
        if (message.content.includes('tiktok.com')) {
            if (messageGuild.tiktok == false) {
                return
            }
            const url = checkURL(message.content);
            const tiktok = await tiktokEmbedding(url);
            await message.channel.send(tiktok[0])
            await message.channel.send(tiktok[1])
        }

        if (!message.guild) return;

        const cmd = args.shift().toLowerCase();

        // down here we need to add the command implementation (don't implement a ''this command doesn't not exist'' unless people ask for it)
        if (!cmd) return;
        const command = client.commands.get(cmd) || client.aliases.get(cmd);
        if (command) (command as Command).run(client, message, args);
    }
}