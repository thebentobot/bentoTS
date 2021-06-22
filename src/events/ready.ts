import { Event } from "../interfaces";

export const event: Event = {
    name: 'ready',
    run: (client) => {
        console.log(`${client.user.tag} is online! Let\'s get this bread!`);
        client.user.setActivity(`🍱 - Feeding in ${client.channels.cache.size} channels, serving on ${client.guilds.cache.size} servers`, {type: 'PLAYING'});
    }
}