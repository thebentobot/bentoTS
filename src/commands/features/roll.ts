import { Message } from 'discord.js';
import { Command } from '../../interfaces';
import { answers } from '../../utils';

export const command: Command = {
    name: 'roll',
    aliases: [],
    category: 'features',
    description: 'Make Bento roll a random number between 1 and the value you set (max. 100)',
    usage: 'roll <number between 1-100>',
    website: 'https://www.bentobot.xyz/commands#roll',
    run: async (client, message, args): Promise<Message> => {
        if (!args.length) return message.channel.send(`${message.author} Give me a number between 1-100!`)
        const userNumber: number = parseInt(args[0])
        if (userNumber > 100) return message.channel.send(`${message.author} Give me a number between 1-100 😡`)
        if (userNumber < 1) return message.channel.send(`${message.author} Give me a number between 1-100 😡`)        
        return message.channel.send(`${randomIntFromInterval(1, userNumber)}`)

        function randomIntFromInterval(min: number, max: number): number {
            return Math.floor(Math.random() * (max - min + 1) + min)
        } 
    }
}