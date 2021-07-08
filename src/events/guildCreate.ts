import { Event } from "../interfaces";
import database from '../database/database';
import { initModels, guild as DbGuild, guildCreationAttributes } from '../database/models/init-models';
import * as dotenv from "dotenv";
dotenv.config();
import { Guild, MessageEmbed, TextChannel } from "discord.js";
import { urlToColours } from "../utils";

export const event: Event = {
    name: 'guildCreate',
    run: async (client, guild: Guild): Promise<any> => {
        initModels(database);

        const attr: guildCreationAttributes = {
            guildID: BigInt(guild.id),
            guildName: guild.name,
            prefix: process.env.prefix,
            tiktok: true,
            nsfw: false,
            leaderboard: true,
            media: true
        };

        const newGuild = await DbGuild.create(attr);
        console.log('New guild were added to the database. It is called: ' + newGuild.guildName + ', ID: ' + newGuild.guildID);
        try {
            const channelNames = ['general', 'welcome', 'main-chat']
            const channel = guild.channels.cache.find(ch => channelNames.includes(ch.name))

            if (channel) {
                const messageLogChannel: TextChannel = client.channels.cache.get(`${channel.id}`) as TextChannel;
                const embed = new MessageEmbed()
                .setAuthor(client.user.username, client.user.avatarURL())
                .setTitle('Hello! My name is Bento 🍱')
                .setColor(`${await urlToColours(client.user.avatarURL({ format: 'png'}))}`)
                .setDescription(`Thank you for choosing me to service your server!\nMy default prefix is \`${process.env.prefix}\`.\nIf the prefix is conflicting because of other bots, you can change it by writing \`${process.env.prefix}prefix <NEW PREFIX>\`\nUse \`${process.env.prefix}settings\` to check what features I've enabled or disabled by default.\nUse \`${process.env.prefix}commands\` to see a list of all my commands and \`${process.env.prefix}help <command name>\` to get help or info about a command.`)
                .addField('Need help? Or do you have some ideas or feedback to Bento 🍱? Feel free to join the support server', 'https://discord.gg/dd68WwP')
                .addField('Want to check out the code for Bento 🍱?', 'https://github.com/thebentobot/bentoTS')
                .setFooter('Bento 🍱 is created by Banner#1017', (await client.users.fetch('232584569289703424')).avatarURL())
                .setTimestamp()
                await messageLogChannel.send(embed)
            } else {
                return
            }
        } catch {
            return
        }
    }
}