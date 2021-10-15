import { Message } from 'discord.js';
import { Command } from '../../interfaces';

export const command: Command = {
    name: 'choose',
    aliases: [],
    category: 'features',
    description: 'Make Bento choose one of the options',
    usage: 'choose <option 1> <option 2> <option ∞>',
    website: 'https://www.bentobot.xyz/commands#choose',
    run: async (client, message, args): Promise<Message> => {
        if (!args.length) return message.channel.send(`${message.author} Give me some options!`)
        if (args.length < 2) return message.channel.send(`${message.author} Well obviously the choice is **${args[0]}**, but perhaps you wanted me to choose between a few more options other than one? 🙄`)
        return message.channel.send(`${args[Math.floor(Math.random() * args.length)]}`)
    }
}