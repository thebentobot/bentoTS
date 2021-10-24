import axios from 'axios';
import { Message } from 'discord.js';
import { Command } from '../../interfaces';
import { gfycatToken } from './gif';

const gfycatAPI = axios.create({
    baseURL: "https://api.gfycat.com/v1/",
});

export const command: Command = {
    name: 'gfycat',
    aliases: ['gfy'],
    category: 'features',
    description: 'Link to the Bento 🍱 GitHub organisation',
    usage: 'gfycat',
    website: 'https://www.bentobot.xyz/commands#gfycat',
    run: async (client, message, args): Promise<any> => {
        switch (args[0]) {
            case 'upload':
            case 'create':
                await createGfycat(message)
            break;
            case 'user': switch (args[1]) {
                case 'profile':
                    await userProfile(message, args[2])
                break;
                case 'feed':
                case 'gfycats':
                case 'gfys':
                    await userFeed(message, args[2])
                break;
                case 'album':
                    await userAlbum(message, args[2], args.slice(3).join(" "))
                break;
            }
            break;
            case 'get':
            case 'info':
                await getGfycat(message, args[1])
            break;
            case 'trending':
                await trendingGfycats(message)
            break;
        }
        
        async function createGfycat(message: Message) {
            let getUrl = message.attachments.array()

            if (!args[1] && !getUrl[0]) {
                return message.channel.send(`You didn't attach any content to create a gfycat`)
            }

            let gfyContent: string;
            let caption: string;
            let startSeconds: string;
            let duration: string;
            
            gfyContent = getUrl[0] ? getUrl[0].url : args[1];
            if (args.includes('--full')) {
                startSeconds = ''
                duration = ''
                caption = getUrl[0] ? args.slice(1).join(" ").replace('--full', '').trim() : args.slice(2).join(" ").replace('--full', '').trim()
            } else {
                startSeconds = getUrl[0] ? (args[1] ? args[1] : '') : (args[2] ? args[2] : '')
                duration = getUrl[0] ? (args[2] ? args[2] : '') : (args[3] ? args[3] : '')
                caption = getUrl[0] ? (args[3] ? args.slice(3).join(" ") : ``) : (args[4] ? args.slice(4).join(" ") : ``)
            }

            const response = await gfycatAPI.post('gfycats', {fetchUrl: gfyContent, noMd5: true, cut: {start: startSeconds.length > 0 ? startSeconds : 0, duration: duration.length > 0 ? duration : 0}, title: caption.length > 0 ? caption : ''}, {headers: {Authorization: `Bearer ${gfycatToken}`, 'Content-Type': 'application/json'}})
            console.log(response.config.data)
            if (response.status !== 200) return message.channel.send(`Gfycat error.`)
            
            if (response.data.isOk === false) {
                return message.channel.send(`Unable to create Gfycat Post 😭`)
            } else {
                let waitingMessage = await message.channel.send(`Encoding your Gfycat Post... ⌛🐱`)
                let checkStatus = await gfycatAPI.get(`gfycats/fetch/status/${response.data.gfyname}`, {headers: {Authorization: `Bearer ${gfycatToken}`, 'Content-Type': 'application/json'}})
                console.log(checkStatus.data)
                while (checkStatus.data.task === 'encoding') {
                    function sleep(ms: number) {
                        return new Promise((resolve) => {
                          setTimeout(resolve, ms);
                        });
                    }
                    sleep(30000)
                    checkStatus = await gfycatAPI.get(`gfycats/fetch/status/${response.data.gfyname}`, {headers: {Authorization: `Bearer ${gfycatToken}`}})
                }

                if (checkStatus.data.task === 'NotFoundo') {
                    waitingMessage.delete()
                    return message.channel.send(`Error. Apparently the Gfycat Post wasn't found by Gfycat 🤔`)
                }

                if (checkStatus.data.task === 'error') {
                    waitingMessage.delete()
                    return message.channel.send(`Error from Gfycat 😔 - ${checkStatus.data.errorMessage.description}, Error code ${checkStatus.data.errorMessage.code}`)
                }

                if (checkStatus.data.task === 'complete') {
                    waitingMessage.delete()
                    return message.channel.send(`https://gfycat.com/${checkStatus.data.gfyname}`)
                }
            }
        }

        async function userProfile(message: Message, user: string) {
            return message.channel.send(`You didn't attach any content to create a gfycat`)

        }

        async function userFeed(message: Message, user: string) {
            return message.channel.send(`You didn't attach any content to create a gfycat`)

        }

        async function userAlbum(message: Message, user: string, albumTitle: string) {
            return message.channel.send(`You didn't attach any content to create a gfycat`)

        }

        async function getGfycat(message: Message, gfyID: string) {
            return message.channel.send(`You didn't attach any content to create a gfycat`)

            // click on a button to switch between info embed and gfycat embed
        }

        async function trendingGfycats(message: Message) {
            return message.channel.send(`You didn't attach any content to create a gfycat`)

            // click on a button to switch between info embed and gfycat embed
        }
    }
}