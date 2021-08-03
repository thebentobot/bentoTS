import { Event, Command } from '../interfaces';
import { GuildMember, Message, MessageAttachment, MessageEmbed, Role, TextChannel, User, Util } from 'discord.js';
import database from '../database/database';

import { checkURL } from '../utils/checkURL';
import { tiktokEmbedding } from '../utils/tiktok';
import { addXpServer, addXpGlobal } from '../utils/xp'
// [table] Attributes is the interface defining the fields
// [table] CreationAttributes is the interface defining the fields when creating a new record
import { initModels, guild, tag, user, userCreationAttributes, guildMemberCreationAttributes, guildMember, roleChannel, role as roleDB } from '../database/models/init-models';
import { QueryTypes } from 'sequelize';
import { trim, urlToColours } from '../utils';
import moment from 'moment';
import _ from 'lodash';
import { performance } from 'perf_hooks';
import { roleManagement } from '../commands/admin/role';
import { instagramEmbedding } from '../utils/instagram';
import fetch from 'node-fetch';

export const event: Event = {
    name: 'message',
    run: async (client, message: Message): Promise<any> => {
        if (message.author.bot) return;
        
        initModels(database); //imports models into sequelize instance

        const userAttr: userCreationAttributes = {
            userID: BigInt(message.author.id),
            discriminator: message.author.discriminator,
            username: message.author.username,
            xp: 0,
            level: 1
        }

        const guildMemberAttr: guildMemberCreationAttributes = {
            userID: BigInt(message.author.id),
            guildID: BigInt(message.guild.id),
            xp: 0,
            level: 1
        }

        await user.findOrCreate({where: {userID: message.author.id}, defaults: userAttr})
        await guildMember.findOrCreate({where: {userID: message.author.id, guildID: message.guild.id}, defaults: guildMemberAttr})

        interface notificationValues {
            id: number,
            userID: bigint,
            guildID: bigint,
            content: string,
            global: boolean
        }
        
        const notificationData: Array<notificationValues> = await database.query(`
        SELECT *
        FROM "notificationMessage"
        WHERE content ILIKE ANY(ARRAY [:content]);`, {
            type: QueryTypes.SELECT,
            replacements: { content: message.content.split(' ') }
        })

        if (notificationData) {
            const newNotiArr: Array<notificationValues> = []
            for (const notiCheck of notificationData) {
                if (`${notiCheck.guildID}` !== message.guild.id) {
                    if (notiCheck.global === true && `${notiCheck.userID}` !== message.author.id) {
                        newNotiArr.push(notiCheck)
                    }
                } else if (`${notiCheck.userID}` !== message.author.id) {
                    newNotiArr.push(notiCheck)
                }
            }
            for (const noti of newNotiArr) {
                let user: User;
                try {
                    user = client.users.cache.get(`${noti.userID}`)
                    const lastMessages = (await message.channel.messages.fetch({limit: 3})).array().reverse()
                    const embed = new MessageEmbed()
                    .setAuthor(message.guild.name, message.guild.iconURL({dynamic: true, format: 'png'}) ? message.guild.iconURL({dynamic: true, format: 'png'}) : client.user.avatarURL({format: 'png'}))
                    .setTimestamp()
                    .setThumbnail(message.author.avatarURL({format: 'png', size: 1024, dynamic: true}))
                    .setColor(`${await urlToColours(message.guild.iconURL({ format: 'png'}) ? message.guild.iconURL({ format: 'png'}) : client.user.avatarURL({format: 'png'}))}`)
                    .setDescription(`🗨 ${message.member.nickname ? `${message.member.nickname} (${message.author.username}#${message.author.discriminator})` : `${message.author.username}#${message.author.discriminator}`} mentioned \`${noti.content}\` in ${message.channel} on **${message.guild.name}**.\nLink to the message [here](${message.url})\n${lastMessages.map(msg => `**[${moment(msg.createdAt).format('HH:mm:ss Z')}] ${msg.member.nickname ? `${msg.member.nickname} (${msg.author.username}#${msg.author.discriminator})` : `${msg.author.username}#${msg.author.discriminator}`}**\n> ${msg.content === '' ? '[MessageEmbed]' : msg.content.replace(noti.content, `**${noti.content}**`)}\n`).join('')}`)
                    await user.send(`Link to message:\n${message.url}`, embed).catch(error => { console.error(`Could not send notification DM`, error)})
                } catch {
                    return
                }
            }
        }

        // finds prefix by guildID
        const messageGuild = await guild.findOne({raw: true, where: {guildID: message.guild.id}}); //raw: true returns only the dataValues

        if (message.content.includes('tiktok.com')) {
            if (messageGuild.tiktok == false) {
                return
            }
            const url = checkURL(message.content);
            const tiktok = await tiktokEmbedding(url);
            try {
                await message.channel.send(tiktok[0])
                await message.channel.send(tiktok[1])
            } catch {
                return
            }
        }

        if (message.content.includes('instagram.com')) {
            /*
            if (messageGuild.instagram == false) {
                return
            }
            */
            const url = checkURL(message.content);
            const instagramData = await instagramEmbedding(url);
            try {
                let place = await instagramData.location ? `, ${await instagramData.location.name}` : ''
                let verify = await instagramData.owner.is_verified ? '✅' : ''

                // 1 pic, no vid
                if (typeof instagramData.edge_sidecar_to_children === 'undefined' && instagramData.is_video == false) {
                    try {
                        const embed = new MessageEmbed()
                        .setTitle(`${Util.escapeMarkdown(await instagramData.owner.full_name)}`)
                        .setDescription(trim(Util.escapeMarkdown(await instagramData.edge_media_to_caption.edges[0].node.text), 2048))
                        .setFooter(`${moment.unix(await instagramData.taken_at_timestamp).format("dddd, MMMM Do YYYY, h:mm A Z")}${place}`)
                        .setColor(`${await urlToColours(await instagramData.owner.profile_pic_url)}`)
                        .setAuthor(`${await instagramData.owner.username} ${verify}`, await instagramData.owner.profile_pic_url, `https://www.instagram.com/${await instagramData.owner.username}/`)
                        .setImage(await instagramData.display_url)
                        return await message.channel.send(embed)
                      } catch {
                        return
                      }
                }

                // 1 vid, nothing else
                if (instagramData.is_video == true && typeof instagramData.edge_sidecar_to_children === 'undefined') {
                    try {
                        const response = await fetch(instagramData.video_url, {
                            method: 'GET'
                            })
                            const buffer = await response.buffer()
                            const embed = new MessageEmbed()
                            .setTitle(`${Util.escapeMarkdown(await instagramData.owner.full_name)}`)
                            .setDescription(trim(Util.escapeMarkdown(await instagramData.edge_media_to_caption.edges[0].node.text), 2048))
                            .setFooter(`${moment.unix(await instagramData.taken_at_timestamp).format("dddd, MMMM Do YYYY, h:mm A Z")}${place}`)
                            .setColor(`${await urlToColours(await instagramData.owner.profile_pic_url)}`)
                            .setAuthor(`${await instagramData.owner.username} ${verify}`, await instagramData.owner.profile_pic_url, `https://www.instagram.com/${await instagramData.owner.username}/`)
                            await message.channel.send(embed)
                            return await message.channel.send(new MessageAttachment(buffer, 'video.mp4'))
                    } catch {
                        return
                    }
                }

                if (instagramData.edge_sidecar_to_children) {
                    function media (post) {
                      if (post.is_video == false) {
                          return post.display_url
                      }
                      if (post.is_video == false) {
                        return ''
                      }
                    }
                    
                    // borrowed function from the leaderboard command
                    async function generateLBembed(lb) {
                      const embeds = [];
                      // loops through the children-posts for a post till there isn't any posts left
                      for(let i =0; i < lb.edge_sidecar_to_children.edges.length; i += 1) {
                          // loops through every children-post, one children-post = current: object Object
                          const current = lb.edge_sidecar_to_children.edges[i]
                          // if children-post is not a video, it pushes a normal embed page with an image
                          if (current.node.is_video == false) {
                          const embed = new MessageEmbed()
                          .setDescription(trim(Util.escapeMarkdown(lb.edge_media_to_caption.edges[0].node.text), 2048))
                          .setColor(`${await urlToColours(await lb.owner.profile_pic_url)}`)
                          .setImage(media(current.node))
                          .setTitle(`${Util.escapeMarkdown(lb.owner.full_name)}`)
                          .setFooter(`${moment.unix(lb.taken_at_timestamp).format("dddd, MMMM Do YYYY, h:mm A Z")}${place}`)
                          .setAuthor(`${lb.owner.username} ${verify}`, lb.owner.profile_pic_url, `https://www.instagram.com/${lb.owner.username}/`)
                          embeds.push(embed)
                        }
                          // if children-post has a video, it doesn't send an .setImage
                          // it only sends the embed, and the video url
                          // perhaps it's possible to check out of the function scope below, if an object has two objects (embed, current.node.video_url), and if so, then it uses that url
                          if (current.node.is_video == true) {
                            const embed = new MessageEmbed()
                            .setDescription(trim(Util.escapeMarkdown(lb.edge_media_to_caption.edges[0].node.text), 2048))
                            .setColor(`${await urlToColours(await lb.owner.profile_pic_url)}`)
                            .setTitle(`${Util.escapeMarkdown(lb.owner.full_name)}`)
                            .setFooter(`${moment.unix(lb.taken_at_timestamp).format("dddd, MMMM Do YYYY, h:mm A Z")}${place}`)
                            .setAuthor(`${lb.owner.username} ${verify}`, lb.owner.profile_pic_url, `https://www.instagram.com/${lb.owner.username}/`)
                            embeds.push([embed, current.node.video_url])
                          }
                      }
                      return embeds;
                  }
                      let currentPage = 0;
                      const embeds = await generateLBembed(instagramData)
                      let queueEmbed;
                      // if the first object in the array is a photo
                      if (typeof embeds[currentPage][1] == 'undefined') {
                        queueEmbed = await message.channel.send(`Current Picture: ${currentPage+1}/${embeds.length}`, embeds[currentPage]);
                      }
                      // if the first object in the array is a video
                      if (typeof embeds[currentPage][1] != 'undefined') {
                        queueEmbed = await message.channel.send(`Current Video: ${currentPage+1}/${embeds.length}`, embeds[currentPage]);
                        const response = await fetch(embeds[currentPage][1], {
                          method: 'GET'
                        })
                        const buffer = await response.buffer()
                        await message.channel.send(new MessageAttachment(buffer, 'video.mp4'))
                      }
                      await queueEmbed.react('⬅️');
                      await queueEmbed.react('➡️');
                      await queueEmbed.react('❌');
                      queueEmbed.edit();
                      const filter = (reaction, user) => ['⬅️', '➡️', '❌'].includes(reaction.emoji.name) && (message.author.id === user.id);
                      const collector = queueEmbed.createReactionCollector(filter);
            
                        collector.on('collect', async (reaction, user) => {
                            if (reaction.emoji.name === '➡️') {
                                if (currentPage < embeds.length-1) {
                                    currentPage++; // change page
                                    // if the current page doesn't have a video
                                    if (typeof embeds[currentPage][1] == 'undefined') {
                                    reaction.users.remove(user);
                                    queueEmbed.edit(`Current Picture: ${currentPage+1}/${embeds.length}`, embeds[currentPage]);
                                    // if the last page has a video
                                    if (typeof embeds[currentPage-1][1] != 'undefined') {
                                        await message.channel.messages.fetch({ limit: 10 }).then(messages => { 
                                        const channel = message.channel as TextChannel
                                        const botMessages = [];
                                        messages.filter(m => m.author.id === '787041583580184609')
                                        messages.filter(f => f.attachments.size > 0).forEach(msg => botMessages.push(msg))
                                        channel.bulkDelete(botMessages)});
                                    }
                                    }
                                    // if the current page has a video
                                    if (typeof embeds[currentPage][1] != 'undefined') {
                                    // if the last page has a video
                                    if (typeof embeds[currentPage-1][1] != 'undefined') {
                                        await message.channel.messages.fetch({ limit: 10 }).then(messages => { 
                                            const channel = message.channel as TextChannel
                                            const botMessages = [];
                                            messages.filter(m => m.author.id === '787041583580184609')
                                            messages.filter(f => f.attachments.size > 0).forEach(msg => botMessages.push(msg))
                                            channel.bulkDelete(botMessages)});
                                    }
                                    reaction.users.remove(user);
                                    queueEmbed.edit(`Current Video: ${currentPage+1}/${embeds.length}`, embeds[currentPage]);
                                    const response = await fetch(embeds[currentPage][1], {
                                        method: 'GET'
                                    })
                                    const buffer = await response.buffer()
                                    await message.channel.send(new MessageAttachment(buffer, 'video.mp4'))
                                    }
                                } 
                            } else if (reaction.emoji.name === '⬅️') {
                                if (currentPage !== 0) {
                                    --currentPage; // change page
                                    // if the current page doesn't have a video
                                    if (typeof embeds[currentPage][1] == 'undefined') {
                                    reaction.users.remove(user);
                                    queueEmbed.edit(`Current Picture ${currentPage+1}/${embeds.length}`, embeds[currentPage])
                                    // if the last page has a video
                                    if (typeof embeds[currentPage+1][1] != 'undefined') {
                                        await message.channel.messages.fetch({ limit: 10 }).then(messages => { 
                                            const channel = message.channel as TextChannel
                                            const botMessages = [];
                                            messages.filter(m => m.author.id === '787041583580184609')
                                            messages.filter(f => f.attachments.size > 0).forEach(msg => botMessages.push(msg))
                                            channel.bulkDelete(botMessages)});
                                    }
                                    }
                                    // if the current page has a video
                                    if (typeof embeds[currentPage][1] != 'undefined') {
                                    // if the last page has a video
                                    if (typeof embeds[currentPage+1][1] != 'undefined') {
                                        await message.channel.messages.fetch({ limit: 10 }).then(messages => { 
                                            const channel = message.channel as TextChannel
                                            const botMessages = [];
                                            messages.filter(m => m.author.id === '787041583580184609')
                                            messages.filter(f => f.attachments.size > 0).forEach(msg => botMessages.push(msg))
                                            channel.bulkDelete(botMessages)});
                                    }
                                    reaction.users.remove(user);
                                    queueEmbed.edit(`Current Video ${currentPage+1}/${embeds.length}`, embeds[currentPage])
                                    const response = await fetch(embeds[currentPage][1], {
                                        method: 'GET'
                                    })
                                    const buffer = await response.buffer()
                                    await message.channel.send(new MessageAttachment(buffer, 'video.mp4'))
                                    }
                                }
                            } else {
                            collector.stop();
                            await queueEmbed.delete();
                            if (typeof embeds[currentPage][1] != 'undefined') {
                                await message.channel.messages.fetch({ limit: 10 }).then(messages => { 
                                    const channel = message.channel as TextChannel
                                    const botMessages = [];
                                    messages.filter(m => m.author.id === '787041583580184609')
                                    messages.filter(f => f.attachments.size > 0).forEach(msg => botMessages.push(msg))
                                    channel.bulkDelete(botMessages)});
                            }
                            }
                        })
                  }
            } catch {
                return
            }
        }

        if (messageGuild.leaderboard === true) {
            await addXpServer(message.guild.id, message.author.id, 23).catch();
            await addXpGlobal(message.author.id, 23).catch();
        }

        const prefix = messageGuild.prefix

        const roleChannelData = await roleChannel.findOne({raw: true, where: {guildID: message.guild.id}})

        if (roleChannelData !== null) {
            if (`${roleChannelData.channelID}` === message.channel.id) {
                await roleManagement(message)
            }
        }

        if (!message.content.startsWith(prefix)) return

        const args = message.content
        .slice(prefix.length)
        .trim()
        .split(/ +/g);

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