import axios from 'axios';
import { Message } from 'discord.js';
import { guild } from '../../database/models/guild';
import { Command } from '../../interfaces';

export const command: Command = {
    name: 'rps',
    aliases: [],
    category: 'features',
    description: 'Play Rock, Paper, Scissors with Bento 🍱',
    usage: 'rps <rock, paper, scissors>',
    website: 'https://www.bentobot.xyz/commands#rps',
    run: async (client, message, args): Promise<Message> => {
        const acceptedReplies = ['rock', 'paper', 'scissors'];
        const bentoReplies = ['Rock 🪨', 'Paper 🧻', 'Scissors ✂️'];
        const random = Math.floor((Math.random() * acceptedReplies.length));
        const bentoResult = bentoReplies[random]
        const result = acceptedReplies[random];

        const guildData = await guild.findOne({raw: true, where: {guildID: message.guild.id}})

        const choice = args[0];
        if (!choice) return message.channel.send(`How to play: \`${guildData.prefix}rps <rock|paper|scissors>\``);
        if (!acceptedReplies.includes(choice)) return message.channel.send(`Only these responses are accepted: \`${acceptedReplies.join(', ')}\``);
        
        const username = message.member.nickname ? message.member.nickname : message.author.username

        message.channel.send(bentoResult)

        if (result === choice) return message.channel.send(`**${username}** Its a tie 👔! We had the same choice 😂`);
        
        switch (choice) {
            case 'rock': {
                if (result === 'paper') return message.channel.send(`**${username}** I won! 🤣`);
                else return message.channel.send(`**${username}** You won! 😔`);
            }
            case 'paper': {
                if (result === 'scissors') return message.channel.send(`**${username}** I won! 🤣`);
                else return message.channel.send(`**${username}** You won! 😔`);        
            }
            case 'scissors': {
                if (result === 'rock') return message.channel.send(`**${username}** I won! 🤣`);
                else return message.channel.send(`**${username}** You won! 😔`);
            }
            default: {
                return message.channel.send(`Only these responses are accepted: \`${acceptedReplies.join(', ')}\``);
            }
        }
    }
}