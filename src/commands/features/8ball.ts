import { Message } from 'discord.js';
import { Command } from '../../interfaces';
import { answers } from '../../utils';

export const command: Command = {
    name: '8ball',
    aliases: [],
    category: 'features',
    description: 'Ask Bento a question and you will get an answer',
    usage: '8ball <question>',
    website: 'https://www.bentobot.xyz/commands#8ball',
    run: async (client, message, args): Promise<Message> => {
        if (!args.length) return message.channel.send(`${message.author} Ask me something!`)
        return message.channel.send(answers[Math.floor(Math.random() * answers.length)])
    }
}