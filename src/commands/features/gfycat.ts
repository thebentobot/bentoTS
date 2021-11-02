import axios, { AxiosResponse } from 'axios';
import { Message, MessageAttachment, MessageEmbed, TextChannel } from 'discord.js';
import database from '../../database/database';
import { initModels, guild, gfycatBlacklist } from '../../database/models/init-models';
import { Command, gfycatInterface, gfycatSearchInterface } from '../../interfaces';
import { gfycatToken } from './gif';
import naughtyWords from 'naughty-words/en.json'
import utf8 from 'utf8';
import moment from 'moment';
import { nFormatter, urlToColours } from '../../utils';

const gfycatAPI = axios.create({
    baseURL: "https://api.gfycat.com/v1/",
});

export const command: Command = {
    name: 'gfycat',
    aliases: ['gfy'],
    category: 'features',
    description: 'Various Gfycat features. Create GIFs with video URLs or video attachments, get gfycat user profiles or feeds, get info about a gfycat post, or search for gfycat posts just like the gif command.',
    usage: 'gfycat create <video url, or attachment> [--full if you want the whole video as a gif. If this is added, no need to specify start seconds and duration] <seconds to start at> <duration of the gif> [title of your gfycat post]\ngfycat user profile <gfycat username>\ngfycat user feed <gfycat username> [count number between 1-30]\ngfycat info <gfycat post name e.g. naiveamusingfritillarybutterfly>\ngfycat search <search input> [--multi [--count <number between 1-30>]]',
    website: 'https://www.bentobot.xyz/commands#gfycat',
    run: async (client, message, args): Promise<any> => {
        if (message.channel.type !== 'text') return

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
                    await userFeed(message, args[2], args[3])
                break;
            }
            break;
            case 'get':
            case 'info':
                await getGfycat(message, args[1])
            break;
            case 'search':
                await searchGfycat(message, args)
            break;
        }

        initModels(database);

        const guildDB = await guild.findOne({raw: true, where: {guildID: message.guild.id}});

        if (guildDB.media === false) return

        async function searchGfycat(message: Message, search: string[]) {
            if (!search) {
                return message.channel.send('You need to provide a search input!').then(m => m.delete({timeout: 5000}));
            }

            if (message.channel.type !== 'text') return

            const channelObject = message.channel as TextChannel

            let messageParse: string[] = search

            let returnMultipleGifs: boolean = false

            let count = 15

            if (args.includes('--multi')) {
                let getNumber = args.join(" ");
                if (args.includes('--count')) {
                    getNumber = getNumber.match(/\d+/).pop()
                    count = parseInt(getNumber)
                    if (count > 30) return message.channel.send('Sorry, 30 posts is the max.')
                }
                messageParse = args.filter(msg => msg !== '--multi' && msg !== '--count' && msg !== getNumber && msg !== 'search')
                returnMultipleGifs = true
            }

            const blacklistData = await gfycatBlacklist.findAll()

            let query: string = messageParse.join(" ");
            if (naughtyWords.includes(query)) return message.channel.send(`No GIFs found based on your search input \`${query}\`.`);

            const response = await gfycatAPI.get<gfycatSearchInterface>('gfycats/search', {params: {search_text: utf8.encode(query), count: returnMultipleGifs === true ? count : 50}, headers: {Authorization: `Bearer ${gfycatToken}`}})
            if (!response.data.gfycats.length) {
                return message.channel.send(`No GIFs found based on your search input \`${query}\`.`);
            } else {
                let gfycatData = response.data.gfycats
                
                if (channelObject.nsfw !== true) {
                    gfycatData = gfycatData.filter(gfy => gfy.nsfw === '0')
                    gfycatData = gfycatData.filter(gfyUser => {
                        return !blacklistData.some(user => user.username === `${gfyUser.userData?.username}`)
                    })
                }

                if (returnMultipleGifs === false) {
                    let waitingMessage = await message.channel.send(`Loading a random Gfycat Post related to \`${query}\` ... ⌛🐱`)
                    let index = Math.floor(Math.random() * gfycatData.length);
                    let gfyTest
                    await axios.get(gfycatData[index].mobileUrl).then(res => {
                        gfyTest = res
                    }).catch(error => {

                    })
                    while (gfyTest?.status !== 200) {
                        gfycatData = gfycatData.filter(gfy => gfy.userData.username !== gfycatData[index].userData.username)
                        index = Math.floor(Math.random() * gfycatData.length);
                        await axios.get(gfycatData[index].mobileUrl).then(res => {
                            gfyTest = res
                        }).catch(error => {
        
                        })
                    }
                    waitingMessage.delete()
                    return message.channel.send(`https://gfycat.com/${gfycatData[index].gfyName}`);
                } else {
                    let currentPage = 0;
                    let waitingMessage = await message.channel.send(`Loading the multiple Gfycat Posts related to \`${query}\` ... ⌛🐱`)
                    const embeds = await generateGfyCatEmbed(gfycatData)
                    waitingMessage.delete()
                    if (!embeds.length) return message.channel.send('No results based on your specifications')
                    const queueEmbed = await message.channel.send(`Current Gfycat: ${currentPage+1}/${embeds.length}\n${embeds[currentPage]}`);
                    await queueEmbed.react('⬅️');
                    await queueEmbed.react('➡️');
                    await queueEmbed.react('❌');
                    const filter = (reaction, user) => ['⬅️', '➡️', '❌'].includes(reaction.emoji.name) && (message.author.id === user.id);
                    const collector = queueEmbed.createReactionCollector(filter, {idle: 900000, dispose: true});

                    collector.on('collect', async (reaction, user) => {
                        if (reaction.emoji.name === '➡️') {
                            if (currentPage < embeds.length-1) {
                            currentPage++;
                            reaction.users.remove(user);
                            queueEmbed.edit(`Current Gfycat: ${currentPage+1}/${embeds.length}\n${embeds[currentPage]}`);
                            } 
                        } else if (reaction.emoji.name === '⬅️') {
                            if (currentPage !== 0) {
                            --currentPage;
                            reaction.users.remove(user);
                            queueEmbed.edit(`Current Gfycat: ${currentPage+1}/${embeds.length}\n${embeds[currentPage]}`);
                            }
                        } else {
                            collector.stop();
                            await queueEmbed.delete();
                        }
                    })

                    async function generateGfyCatEmbed (gfycat: gfycatInterface[]) {
                        const embeds = [];
                        let k = 1;
                        for(let i =0; i < gfycat.length; i += 1) {
                            const current = gfycat[i];
                            let j = i;
                            k += 1;

                            const embed = `${current.title.length > 0 ? `**${current.title}**\n` : ''}${current.userData?.username.length ? `Made by <${current.userData.url}>\n` : ''}${current.views} Views\n<t:${current.createDate}:F>\nhttps://gfycat.com/${current.gfyName}`
                            await axios.get(current.mobileUrl).then(res => {
                                embeds.push(embed)
                            }).catch(error => {

                            })
                        }
                        return embeds;
                    }
                }
            }
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
            if (response.status !== 200) return message.channel.send(`Gfycat error.`)
            
            if (response.data.isOk === false) {
                return message.channel.send(`Unable to create Gfycat Post 😭`)
            } else {
                let waitingMessage = await message.channel.send(`Encoding your Gfycat Post... ⌛🐱`)
                let checkStatus = await gfycatAPI.get(`gfycats/fetch/status/${response.data.gfyname}`, {headers: {Authorization: `Bearer ${gfycatToken}`, 'Content-Type': 'application/json'}})
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
                    return message.channel.send(`${message.author} your Gfycat Post is ready! 👏\nhttps://gfycat.com/${checkStatus.data.gfyname}`)
                }
            }
        }

        async function userProfile(message: Message, user: string) {
            if (!user) {
                return message.channel.send('You need to specify a user')
            }

            const blacklistData = await gfycatBlacklist.findAll()

            if (blacklistData.some(user => user.username === `${user}`)) {
                return message.channel.send(`Error - couldn't find \`${user}\``)
            }

            let response: AxiosResponse
            await gfycatAPI.get(`users/${user}`, {headers: {Authorization: `Bearer ${gfycatToken}`, 'Content-Type': 'application/json'}}).then(res => {
                response = res
            }).catch(error => {
            })

            try {
            const profilePicture = await axios({
                method: 'post',
                url: "http://sushii-image-server:3000/url",
                data: {
                    url: response.data.profileImageUrl, 
                    width: 200, 
                    height: 200,
                    imageFormat: 'png',
                    quality: 100
                },
                responseType: "arraybuffer"
            }).then(res => Buffer.from(res.data))

            const embed = new MessageEmbed()
            .setAuthor(await response.data.verified ? `${await response.data.username} ✔️` : await response.data.username, await response.data.profileImageUrl, await response.data.url)
            .setColor(`${await urlToColours(response.data.profileImageUrl)}`)
            .setTitle(await response.data.name)
            .attachFiles([{name: `${response.data.username}_gfypfp.png`, attachment: profilePicture}])
            .setThumbnail(`attachment://${response.data.username}_gfypfp.png`)
            .setDescription(`${await response.data.description.length > 0 ? `${await response.data.description}\n\n` : ``}Total Views: ${nFormatter(await response.data.views, 1)}\nPublished Gfycats: ${nFormatter(await response.data.publishedGfycats, 1)}\nPublished Gfycat Albums: ${nFormatter(await response.data.publishedAlbums, 1)}\nFollowers: ${nFormatter(await response.data.followers, 1)}\nFollowing: ${nFormatter(await response.data.following, 1)}\nProfile URL: ${await response.data.profileUrl}`)
            .setFooter(`Account made on <t:${await response.data.createDate}:F>`)
            return await message.channel.send(embed)
            } catch {
                return message.channel.send(`Error - couldn't find \`${user}\``)
            }
        }

        async function userFeed(message: Message, user: string, count: string) {
            if (!user) {
                return message.channel.send('You need to specify a user')
            }

            const blacklistData = await gfycatBlacklist.findAll()

            if (blacklistData.some(user => user.username === `${user}`)) {
                return message.channel.send(`Error - couldn't find \`${user}\``)
            }

            let insertCount = 15

            if (count) {
                let getNumber = count.match(/\d+/).pop()
                insertCount = parseInt(getNumber)
                if (insertCount > 30) return message.channel.send('Sorry, 30 posts is the max.')
            }
            let response: AxiosResponse
            await gfycatAPI.get(`users/${user}/gfycats`, {params: {count: insertCount}, headers: {Authorization: `Bearer ${gfycatToken}`, 'Content-Type': 'application/json'}}).then(res => {
                response = res
            }).catch(error => {
            })

            let waitingMessage: Message = await message.channel.send(`Loading the multiple Gfycat Posts from \`${user}\` ... ⌛🐱`)

            try {
                let gfycatData = response.data.gfycats

                const channelObject = message.channel as TextChannel
                
                if (channelObject.nsfw !== true) {
                    gfycatData = gfycatData.filter(gfy => gfy.nsfw === 0)
                }

                let currentPage = 0;
                const embeds = await generateGfyCatEmbed(gfycatData)
                waitingMessage.delete()
                if (!embeds.length) return message.channel.send('No results based on your specifications')
                const queueEmbed = await message.channel.send(`Current Gfycat: ${currentPage+1}/${embeds.length}\n${embeds[currentPage]}`);
                await queueEmbed.react('⬅️');
                await queueEmbed.react('➡️');
                await queueEmbed.react('❌');
                const filter = (reaction, user) => ['⬅️', '➡️', '❌'].includes(reaction.emoji.name) && (message.author.id === user.id);
                const collector = queueEmbed.createReactionCollector(filter, {idle: 900000, dispose: true});

                collector.on('collect', async (reaction, user) => {
                    if (reaction.emoji.name === '➡️') {
                        if (currentPage < embeds.length-1) {
                        currentPage++;
                        reaction.users.remove(user);
                        queueEmbed.edit(`Current Gfycat: ${currentPage+1}/${embeds.length}\n${embeds[currentPage]}`);
                        } 
                    } else if (reaction.emoji.name === '⬅️') {
                        if (currentPage !== 0) {
                        --currentPage;
                        reaction.users.remove(user);
                        queueEmbed.edit(`Current Gfycat: ${currentPage+1}/${embeds.length}\n${embeds[currentPage]}`);
                        }
                    } else {
                        collector.stop();
                        await queueEmbed.delete();
                    }
                })

                async function generateGfyCatEmbed (gfycat: any) {
                    const embeds = [];
                    let k = 1;
                    for(let i =0; i < gfycat.length; i += 1) {
                        const current = gfycat[i];
                        let j = i;
                        k += 1;

                        const embed = `${current.title.length > 0 ? `**${current.title}**\n` : ''}${`Made by <https://gfycat.com/@${current.username}>`}\n${current.views} Views\n<t:${current.createDate}:F>\nhttps://gfycat.com/${current.gfyName}`
                        await axios.get(current.mobileUrl).then(res => {
                            embeds.push(embed)
                        }).catch(error => {

                        })
                    }
                    return embeds;
                }
            } catch {
                waitingMessage.delete()
                return message.channel.send(`Error - couldn't find \`${user}\``)
            }
        }

        async function getGfycat(message: Message, gfyID: string) {
            if (!gfyID) {
                return message.channel.send('You need to specify a gfyID')
            }
            let response: AxiosResponse
            await gfycatAPI.get(`gfycats/${gfyID}`, {headers: {Authorization: `Bearer ${gfycatToken}`, 'Content-Type': 'application/json'}}).then(res => {
                response = res
            }).catch(error => {
            })

            const blacklistData = await gfycatBlacklist.findAll()

            if (blacklistData.some(user => user.username === `${response.data.gfyItem.username}`)) {
                return message.channel.send(`Error - couldn't find \`${gfyID}\``)
            }

            try {
                
                let profilePicture
                if (response.data.gfyItem.userData?.profileImageUrl) {
                    profilePicture = await axios({
                        method: 'post',
                        url: "http://sushii-image-server:3000/url",
                        data: {
                            url: response.data.gfyItem.userData.profileImageUrl, 
                            width: 200, 
                            height: 200,
                            imageFormat: 'png',
                            quality: 100
                        },
                        responseType: "arraybuffer"
                    }).then(res => Buffer.from(res.data))
                }

                const embeds = [];
                
                const gfycatEmbed = `https://gfycat.com/${response.data.gfyItem.gfyName}`
                embeds.push(gfycatEmbed)

                const profileEmbed = new MessageEmbed()
                .setColor(response.data.gfyItem.avgColor)
                .setTitle(await response.data.gfyItem.gfyName)
                .attachFiles([{name: `${response.data.username}_gfypfp.png`, attachment: profilePicture}])
                .setThumbnail(`attachment://${response.data.username}_gfypfp.png`)
                .setDescription(`${await response.data.gfyItem.description.length > 0 ? `${await response.data.description}\n\n` : ``}Total Views: ${nFormatter(await response.data.gfyItem.views, 1)}\n${response.data.gfyItem.likes} Likes ❤️ \nFrame rate: ${response.data.gfyItem.frameRate}\nWidth & Height: ${response.data.gfyItem.width}x${response.data.gfyItem.height}${response.data.gfyItem.tags.length > 0 ? `\n\nTags: ${response.data.gfyItem.tags.join(', ')}` : ''}`)
                .setFooter(`Gfycat Post made on <t:${await response.data.gfyItem.createDate}:F>`)
                if (response.data.gfyItem.userData?.username) {
                    profileEmbed.setAuthor(await response.data.gfyItem.userData.verified ? `${await response.data.gfyItem.userData.username} ✔️` : await response.data.gfyItem.userData.username, await response.data.gfyItem.userData?.profileImageUrl ? response.data.gfyItem.userData?.profileImageUrl : '', `https://gfycat.com/@${response.data.gfyItem.userData.username}`)
                }
                embeds.push(profileEmbed)
                
                let currentPage = 0
                const queueEmbed = await message.channel.send(gfycatEmbed);
                await queueEmbed.react('🔄');
                await queueEmbed.react('❌');
                const filter = (reaction, user) => ['🔄', '❌'].includes(reaction.emoji.name) && (message.author.id === user.id);
                const collector = queueEmbed.createReactionCollector(filter, {idle: 300000, dispose: true});

                collector.on('collect', async (reaction, user) => {
                    if (reaction.emoji.name === '🔄') {
                        if (currentPage < embeds.length-1) {
                        currentPage++;
                        reaction.users.remove(user);
                        queueEmbed.edit(profileEmbed);
                        } else {
                            currentPage--;
                            reaction.users.remove(user);
                            queueEmbed.edit(gfycatEmbed);
                        }
                    }  else {
                        collector.stop();
                        await queueEmbed.delete();
                    }
                })
            } catch {
                return message.channel.send(`Error - couldn't find \`${gfyID}\``)
            }
            // click on a button to switch between info embed and gfycat embed
        }
    }
}