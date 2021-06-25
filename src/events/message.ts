import { Event, Command } from '../interfaces';
import { Message } from 'discord.js';
import database from '../database/database';

import { checkURL } from '../utils/checkURL';
import { tiktokEmbedding } from '../utils/tiktok';
import { addXpServer, addXpGlobal } from '../utils/xp'
// [table] Attributes is the interface defining the fields
// [table] CreationAttributes is the interface defining the fields when creating a new record
import { initModels, guild, tag } from '../database/models/init-models';

export const event: Event = {
    name: 'message',
    run: async (client, message: Message): Promise<any> => {
        if (message.author.bot) return;
        
        initModels(database); //imports models into sequelize instance

        // finds prefix by guildID
        const messageGuild = await guild.findOne({raw: true, where: {guildID: message.guild.id}}); //raw: true returns only the dataValues

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

        if (messageGuild.leaderboard === true) {
            await addXpServer(message.guild.id, message.author.id, 23).catch();
            await addXpGlobal(message.author.id, 23).catch();
        }

        if (!message.guild) return;

        const cmd = args.shift().toLowerCase();

        if (!cmd) return;
        const command = client.commands.get(cmd) || client.aliases.get(cmd);

        // custom tags
        if (command) {
            (command as Command).run(client, message, args);
        } else {
            const customCommand = await tag.findOne({raw: true, where: {guildID: message.guild.id, command: cmd}})
            if (customCommand) {
                await tag.increment('count', {where: {command: cmd}})
            }
            try {
                return message.channel.send(customCommand.content)
            } catch {
                return
            }
        }
    }
}