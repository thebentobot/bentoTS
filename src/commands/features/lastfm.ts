// @ts-nocheck
import { Message, MessageEmbed, Util } from 'discord.js';
import { Command } from '../../interfaces';
import database from '../../database/database';
import { initModels, guild, lastfmCreationAttributes, lastfm } from '../../database/models/init-models';
import axios from 'axios';
import * as dotenv from "dotenv";
import SpotifyWebApi from 'spotify-web-api-node';
import moment from 'moment';
import { flag } from 'country-emoji';
import { QueryTypes } from 'sequelize';
import { urlToColours } from '../../utils';
dotenv.config();

const api_key = process.env.lastfm

const lastfmAPI = axios.create({
    baseURL: "https://ws.audioscrobbler.com/2.0",
    params: { api_key: api_key, format: 'json' }
});

let spotifyCred = new SpotifyWebApi({
    clientId: process.env.spotifyClientID,
    clientSecret: process.env.spotifyClientSecret,
    redirectUri: 'http://localhost:3000/auth/spotify/success'
})

async function newToken () {
    await spotifyCred.clientCredentialsGrant().then(
        async function(data) {
          console.log('The access token expires in ' + data.body['expires_in']);
          //console.log('The access token is ' + data.body['access_token']);
      
          // Save the access token so that it's used in future calls
          await spotifyCred.setAccessToken(data.body['access_token']);
        },
        async function(err) {
          console.log('Something went wrong when retrieving an access token', err);
        }
    );
}

newToken()

setInterval(newToken, 3600000)

export const command: Command = {
    name: 'lastfm',
    aliases: ['fm', 'lf'],
    category: 'features',
    description: 'last.fm feature. If you don\'t mention a user with an argument, it searches for your last.fm. If you only mention a user and no time period, it checks for overall.\nThe possible time period arguments: overall, 7day, 1month, 3month, 6month, 12month.',
    usage: ' is the prefix.\n**lastfm set <lastfm account name>** sets your lastfm user.\n**lastfm remove <lastfm account name>** removes your lastfm account.\n**lastfm [np] [user id or mention a user]** shows your current/last two songs.\n**lastfm toptracks [time period, or user where time period = overall] [user id or mention a user]** returns top tracks in a given period.\n**lastfm topalbums [time period, or user where time period = overall] [user id or mention a user]** returns top albums in a given period.\n**lastfm topartists [time period, or user where time period = overall] [user id or mention a user]** returns top artists in a given time period.\n**lastfm recent [user id or mention a user]** returns the 50 most recent tracks.\n**lastfm profile [user id or mention a user]** shows info about a user\'s last.fm account.\n**lastfm wkt [artist - song]** shows top 10 users on the server in terms of plays of a song.\n**lastfm wka [artist - album]** shows top 10 users on the server in terms of plays of an album.\n**lastfm wk [artist]** shows top 10 users on the server in terms of plays of an artist.\n**lastfm gwkt [artist - song]** shows top 10 global Bento users in terms of plays of a song.\n**lastfm gwka [artist - album]** shows top 10 global Bento users in terms of plays of an album.\n**lastfm wk [artist]** shows top 10 Bento users in terms of plays of an artist.',
    run: async (client, message, args): Promise<any> => {
        if (!args.length) {
            return nowPlaying (message);
        }

        if (args[0] === 'np') {
            return nowPlaying (message, args[1]);
        }

        if (args[0] === 'set') {
            return setUser (message, args[1]);
        }

        if (args[0] === 'remove') {
            return removeUser (message);
        }

        if (args[0] === 'toptracks') {
            return topTracks (message, args[1], args[2]);
        }

        if (args[0] === 'topalbums') {
            return topAlbums (message, args[1], args[2]);
        }

        if (args[0] === 'topartists') {
            return topArtists (message, args[1], args[2]);
        }

        if (args[0] === 'recent') {
            return recentTracks (message, args[1]);
        }

        if (args[0] === 'profile') {
            return lastfmProfile (message, args[1]);
        }

        if (args[0] === 'wkt') {
            return lastfmWkt (message, args.slice(1).join(" "));
        }

        if (args[0] === 'wka') {
            return lastfmWka (message, args.slice(1).join(" "));
        }

        if (args[0] === 'wk') {
            return lastfmWk (message, args.slice(1).join(" "));
        }
        
        if (args[0] === 'gwkt') {
            return lastfmGwkt (message, args.slice(1).join(" "));
        }

        if (args[0] === 'gwka') {
            return lastfmGwka (message, args.slice(1).join(" "));
        }

        if (args[0] === 'gwk') {
            return lastfmGwk (message, args.slice(1).join(" "));
        }

        /*
        Space for more commands, perhaps combining with the spotify API to look for songs?
        */

        if (args[0]) {
            return nowPlaying (message, args[0]);
        }

        async function nowPlaying (message: Message, mentionedUser?: any) {
            initModels(database);

            let username: string;
            let usernameEmbed: any;
            let user: string;

            try {
                const theUser = message.mentions.members.first() || await message.guild.members.fetch(mentionedUser);
                user = theUser.id
                const lastfmData = await lastfm.findOne({raw: true, where : {userID: user}})
                if (!lastfmData) {
                    return message.channel.send(`This user doesn't have a last.fm account saved.`)
                }
                username = lastfmData.lastfm
            } catch {
                try {
                    let lastFmName = await lastfm.findOne({raw:true, where: {userID: message.author.id}});
                    username = lastFmName.lastfm
                } catch {
                    const guildData = await guild.findOne({raw: true, where : {guildID: message.guild.id}})
                    return message.channel.send(`Please provide a LastFM username\n\`${guildData.prefix}fm set <lastfm account name>\`.`)
                }
            }

            try {
                let response = await lastfmAPI.get('/', {params: { method: "user.getrecenttracks", user: username, limit: 2, page: 1}});
                usernameEmbed = response.data
            } catch {
                const guildData = await guild.findOne({raw: true, where : {guildID: message.guild.id}})
                return message.channel.send(`Request failed. Please provide a valid LastFM username\n\`${guildData.prefix}fm set <lastfm account name>\`.`)
            }

            const embed = new MessageEmbed()
            .setAuthor(user ? `${message.guild.members.cache.get(user).nickname ? `${message.guild.members.cache.get(user).nickname} (${message.guild.members.cache.get(user).user.username + '#' + message.guild.members.cache.get(user).user.discriminator})` : message.guild.members.cache.get(user).user.username + '#' + message.guild.members.cache.get(user).user.discriminator}` : `${message.guild.members.cache.get(message.author.id).nickname ? `${message.guild.members.cache.get(message.author.id).nickname} (${message.guild.members.cache.get(message.author.id).user.username + '#' + message.guild.members.cache.get(message.author.id).user.discriminator})` : `${message.guild.members.cache.get(message.author.id).user.username + '#' + message.guild.members.cache.get(message.author.id).user.discriminator}`}`, user ? message.guild.members.cache.get(user).user.displayAvatarURL() : message.guild.members.cache.get(message.author.id).user.displayAvatarURL(), `https://www.last.fm/user/${username}`)
            .setColor('#e4141e')
            .setThumbnail(usernameEmbed.recenttracks.track[0].image[3]['#text'])
            .addFields(
                { name: `${usernameEmbed.recenttracks.track[0]['@attr'] ? `Now Playing` : moment.unix(usernameEmbed.recenttracks.track[0].date.uts).fromNow()}`, value: `**${usernameEmbed.recenttracks.track[0].artist['#text']}** - [${usernameEmbed.recenttracks.track[0].name}](${usernameEmbed.recenttracks.track[0].url})\nFrom the album **${usernameEmbed.recenttracks.track[0].album['#text']}**`},
                { name: `${moment.unix(usernameEmbed.recenttracks.track[1].date.uts).fromNow()}`, value: `**${usernameEmbed.recenttracks.track[1].artist['#text']}** - [${usernameEmbed.recenttracks.track[1].name}](${usernameEmbed.recenttracks.track[1].url})\nFrom the album **${usernameEmbed.recenttracks.track[1].album['#text']}**`},
            )
            .setFooter(`Total Tracks: ${usernameEmbed.recenttracks['@attr'].total} | Powered by last.fm`, 'https://www.last.fm/static/images/lastfm_avatar_twitter.52a5d69a85ac.png')
            
            return message.channel.send(embed)
        }

        async function setUser (message: Message, username: string) {
            initModels(database);

            const userExits = await lastfm.findOne({raw: true, where: {userID: message.author.id}})

            if (userExits && username) {
                try {
                    let response = await lastfmAPI.get('/', {params: { method: "user.getinfo", user: username }});
                    username = response.data.user.name;
                } catch (error) {
                    if (error.response) {
                        console.error(Error(`Last.fm error: ${error.response.status} - ${error.response.statusText}`));
                        if (error.response.status >= 500) {
                            return message.channel.send(`Server Error. LastFM is likely down or experiencing issues.`);
                        } else {
                            return message.channel.send(`Error occurred fetching LastDM data.`);
                        }
                    } else {
                        console.error(error);
                        message.channel.send(`Unknown error occurred.`);
                    }
                    return;
                }

                await lastfm.update({lastfm: username}, {where: {userID: message.author.id}})
                return message.channel.send(`Last.fm username was updated to \`${username}\`.`);
            }

            if (!username) {
                const guildData = await guild.findOne({raw:true, where: {guildID: message.guild.id}});
                return message.channel.send(`Please provide a LastFM username: \`${guildData.prefix}fm set <lastfm account name>\`.`);
            } else {
                try {
                    let response = await lastfmAPI.get('/', {params: { method: "user.getinfo", user: username }});
                    username = response.data.user.name;
                } catch (error) {
                    if (error.response) {
                        console.error(Error(`Last.fm error: ${error.response.status} - ${error.response.statusText}`));
                        if (error.response.status >= 500) {
                            return message.channel.send(`Server Error. LastFM is likely down or experiencing issues.`);
                        } else {
                            return message.channel.send(`Error occurred fetching LastDM data.`);
                        }
                    } else {
                        console.error(error);
                        return message.channel.send(`Unknown error occurred.`);
                    }
                    return;
                }

                const lastFMUser: lastfmCreationAttributes = {
                    userID: BigInt(message.author.id),
                    lastfm: username
                }

                await lastfm.create(lastFMUser)
                message.channel.send(`Last.fm username set to \`${username}\`.`);
            }


        }

        async function removeUser (message: Message) {
            initModels(database);

            try {
                await lastfm.destroy({where: {userID: message.author.id}})
                return message.channel.send(`Your LastFM username was removed.`);
            } catch {
                return message.channel.send(`No LastFM username found.`);
            }
        }

        async function topTracks (message: Message, secondArg?: string, thirdArg?: string) {
            initModels(database);

            let username: string;
            let usernameEmbed: any;
            let userID: string;
            let userIDInsert: string;
            let period: string[];

            if (secondArg === 'overall') {
                period = ['overall', 'ALL']
                if (thirdArg) {
                    userIDInsert = thirdArg
                }
            } else if (secondArg === '7day') {
                period = ['7day', 'LAST_7_DAYS']
                if (thirdArg) {
                    userIDInsert = thirdArg
                }
            } else if (secondArg === '1month') {
                period = ['1month', 'LAST_30_DAYS']
                if (thirdArg) {
                    userIDInsert = thirdArg
                }
            } else if (secondArg === '3month') {
                period = ['3month', 'LAST_90_DAYS']
                if (thirdArg) {
                    userIDInsert = thirdArg
                }
            } else if (secondArg === '6month') {
                period = ['6month', 'LAST_180_DAYS']
                if (thirdArg) {
                    userIDInsert = thirdArg
                }
            } else if (secondArg === '12month') {
                period = ['12month', 'LAST_365_DAYS']
                if (thirdArg) {
                    userIDInsert = thirdArg
                }
            } else {
                userIDInsert = secondArg
                period = ['overall', 'ALL']
            }

            try {
                const theUser = message.mentions.members.first() || await message.guild.members.fetch(userIDInsert);
                if (theUser.user.bot === true) return message.channel.send(`A bot doesn't have a lastfm.`)
                userID = theUser.id
                try {
                    const lastfmData = await lastfm.findOne({raw: true, where : {userID: userID}})
                    if (!lastfmData) {
                        return message.channel.send(`This user doesn't have a last.fm account saved.`)
                    }
                    username = lastfmData.lastfm
                } catch {
                    return message.channel.send(`The mentioned user doesn't have a lastfm account saved.`)
                }
                } catch {
                    try {
                        let lastFmName = await lastfm.findOne({raw:true, where: {userID: message.author.id}});
                        username = lastFmName.lastfm
                    } catch {
                        const guildData = await guild.findOne({raw: true, where : {guildID: message.guild.id}})
                        return message.channel.send(`Please provide a LastFM username\n\`${guildData.prefix}fm set <lastfm account name>\`.`)
                    }
                }
            
            try {
                let response = await lastfmAPI.get('/', {params: { method: "user.gettoptracks", user: username, period: period[0], limit: 50, page: 1}});
                usernameEmbed = response.data
            } catch {
                const guildData = await guild.findOne({raw: true, where : {guildID: message.guild.id}})
                return message.channel.send(`Request failed. Please provide a valid LastFM username\n\`${guildData.prefix}fm set <lastfm account name>\`.`)
            }

            let currentPage = 0;
            const embeds = generateTopTracksEmbed(usernameEmbed, message, period, userID)
            const queueEmbed = await message.channel.send(`Current Page: ${currentPage+1}/${(await embeds).length}`, (await embeds)[currentPage]);
            await queueEmbed.react('⬅️');
            await queueEmbed.react('➡️');
            await queueEmbed.react('❌');
            const filter = (reaction, user) => ['⬅️', '➡️', '❌'].includes(reaction.emoji.name) && (message.author.id === user.id);
            const collector = queueEmbed.createReactionCollector(filter);

            collector.on('collect', async (reaction, user) => {
                if (reaction.emoji.name === '➡️') {
                    if (currentPage < (await embeds).length-1) {
                      currentPage++;
                      reaction.users.remove(user);
                      queueEmbed.edit(`Current Page: ${currentPage+1}/${(await embeds).length}`, (await embeds)[currentPage]);
                    } 
                  } else if (reaction.emoji.name === '⬅️') {
                    if (currentPage !== 0) {
                      --currentPage;
                      reaction.users.remove(user);
                      queueEmbed.edit(`Current Page ${currentPage+1}/${(await embeds).length}`, (await embeds)[currentPage]);
                    }
                  } else {
                    collector.stop();
                    await queueEmbed.delete();
                  }
            })

            async function generateTopTracksEmbed (input, message: Message, period: string[], userID: string) {
                const lastfmAcc = input.toptracks['@attr'].user
                const tracks = input.toptracks.track
                const embeds = [];
                let k = 10;
                for(let i =0; i < tracks.length; i += 10) {
                    const current = tracks.slice(i, k);
                    let j = i;
                    k += 10;

                    const embed = new MessageEmbed()
                    embed.setAuthor(userID ? `${message.guild.members.cache.get(userID).nickname ? `${message.guild.members.cache.get(userID).nickname} (${message.guild.members.cache.get(userID).user.username + '#' + message.guild.members.cache.get(userID).user.discriminator})` : message.guild.members.cache.get(userID).user.username + '#' + message.guild.members.cache.get(userID).user.discriminator}` : `${message.guild.members.cache.get(message.author.id).nickname ? `${message.guild.members.cache.get(message.author.id).nickname} (${message.guild.members.cache.get(message.author.id).user.username + '#' + message.guild.members.cache.get(message.author.id).user.discriminator})` : `${message.guild.members.cache.get(message.author.id).user.username + '#' + message.guild.members.cache.get(message.author.id).user.discriminator}`}`, userID ? message.guild.members.cache.get(userID).user.displayAvatarURL() : message.guild.members.cache.get(message.author.id).user.displayAvatarURL(), `https://www.last.fm/user/${lastfmAcc}`)
                    embed.setColor('#e4141e')
                    embed.setTimestamp()
                    embed.setURL(`https://www.last.fm/user/${lastfmAcc}/library/tracks?date_preset=${period[1]}`)
                    const info = current.map(track => `**${track['@attr'].rank}. ${Util.escapeMarkdown(track.name, {bold: false})}** by [${Util.escapeMarkdown(track.artist.name, {bold: false})}](${track.url}) - ${track.playcount > 1 ? `${track.playcount} plays` : `${track.playcount} play`}`).join(`\n`)
                    embed.setDescription(`${info}`)
                    embed.setTitle(`Top tracks for ${userID ? `${message.guild.members.cache.get(userID).nickname ? `${message.guild.members.cache.get(userID).nickname} (${message.guild.members.cache.get(userID).user.username + '#' + message.guild.members.cache.get(userID).user.discriminator})` : message.guild.members.cache.get(userID).user.username + '#' + message.guild.members.cache.get(userID).user.discriminator}` : `${message.guild.members.cache.get(message.author.id).nickname ? `${message.guild.members.cache.get(message.author.id).nickname} (${message.guild.members.cache.get(message.author.id).user.username + '#' + message.guild.members.cache.get(message.author.id).user.discriminator})` : `${message.guild.members.cache.get(message.author.id).user.username + '#' + message.guild.members.cache.get(message.author.id).user.discriminator}`}`}`)
                    let cover;
                    await spotifyCred.searchArtists(current[0].artist.name, {limit: 1}).then(function(data) {
                        cover = data
                    }, function (err) {
                        console.error(err);
                    })
                    embed.setThumbnail(cover.body.artists.items[0].images[0].url);
                    embed.setFooter(`Time period - ${period[0]} | Powered by last.fm`, 'https://www.last.fm/static/images/lastfm_avatar_twitter.52a5d69a85ac.png')
                    embeds.push(embed)
                }
                return embeds;
            }
        }

        async function topAlbums (message: Message, secondArg?: string, thirdArg?: string) {
            initModels(database);

            let username: string;
            let usernameEmbed: any;
            let userID: string;
            let userIDInsert: string;
            let period: string[];

            if (secondArg === 'overall') {
                period = ['overall', 'ALL']
                if (thirdArg) {
                    userIDInsert = thirdArg
                }
            } else if (secondArg === '7day') {
                period = ['7day', 'LAST_7_DAYS']
                if (thirdArg) {
                    userIDInsert = thirdArg
                }
            } else if (secondArg === '1month') {
                period = ['1month', 'LAST_30_DAYS']
                if (thirdArg) {
                    userIDInsert = thirdArg
                }
            } else if (secondArg === '3month') {
                period = ['3month', 'LAST_90_DAYS']
                if (thirdArg) {
                    userIDInsert = thirdArg
                }
            } else if (secondArg === '6month') {
                period = ['6month', 'LAST_180_DAYS']
                if (thirdArg) {
                    userIDInsert = thirdArg
                }
            } else if (secondArg === '12month') {
                period = ['12month', 'LAST_365_DAYS']
                if (thirdArg) {
                    userIDInsert = thirdArg
                }
            } else {
                userIDInsert = secondArg
                period = ['overall', 'ALL']
            }

            try {
                const theUser = message.mentions.members.first() || await message.guild.members.fetch(userIDInsert);
                if (theUser.user.bot === true) return message.channel.send(`A bot doesn't have a lastfm.`)
                userID = theUser.id
                try {
                    const lastfmData = await lastfm.findOne({raw: true, where : {userID: userID}})
                    if (!lastfmData) {
                        return message.channel.send(`This user doesn't have a last.fm account saved.`)
                    }
                    username = lastfmData.lastfm
                } catch {
                    return message.channel.send(`The mentioned user doesn't have a lastfm account saved.`)
                }
                } catch {
                    try {
                        let lastFmName = await lastfm.findOne({raw:true, where: {userID: message.author.id}});
                        username = lastFmName.lastfm
                    } catch {
                        const guildData = await guild.findOne({raw: true, where : {guildID: message.guild.id}})
                        return message.channel.send(`Please provide a LastFM username\n\`${guildData.prefix}fm set <lastfm account name>\`.`)
                    }
                }
            
            try {
                let response = await lastfmAPI.get('/', {params: { method: "user.gettopalbums", user: username, period: period[0], limit: 50, page: 1}});
                usernameEmbed = response.data
            } catch {
                const guildData = await guild.findOne({raw: true, where : {guildID: message.guild.id}})
                return message.channel.send(`Request failed. Please provide a valid LastFM username\n\`${guildData.prefix}fm set <lastfm account name>\`.`)
            }

            let currentPage = 0;
            const embeds = generateTopAlbumsEmbed(usernameEmbed, message, period, userID)
            const queueEmbed = await message.channel.send(`Current Page: ${currentPage+1}/${(await embeds).length}`, (await embeds)[currentPage]);
            await queueEmbed.react('⬅️');
            await queueEmbed.react('➡️');
            await queueEmbed.react('❌');
            const filter = (reaction, user) => ['⬅️', '➡️', '❌'].includes(reaction.emoji.name) && (message.author.id === user.id);
            const collector = queueEmbed.createReactionCollector(filter);

            collector.on('collect', async (reaction, user) => {
                if (reaction.emoji.name === '➡️') {
                    if (currentPage < (await embeds).length-1) {
                      currentPage++;
                      reaction.users.remove(user);
                      queueEmbed.edit(`Current Page: ${currentPage+1}/${(await embeds).length}`, (await embeds)[currentPage]);
                    } 
                  } else if (reaction.emoji.name === '⬅️') {
                    if (currentPage !== 0) {
                      --currentPage;
                      reaction.users.remove(user);
                      queueEmbed.edit(`Current Page ${currentPage+1}/${(await embeds).length}`, (await embeds)[currentPage]);
                    }
                  } else {
                    collector.stop();
                    await queueEmbed.delete();
                  }
            })

            async function generateTopAlbumsEmbed (input, message: Message, period: string[], userID: string) {
                const lastfmAcc = input.topalbums['@attr'].user
                const tracks = input.topalbums.album
                const embeds = [];
                let k = 10;
                for(let i =0; i < tracks.length; i += 10) {
                    const current = tracks.slice(i, k);
                    let j = i;
                    k += 10;

                    const embed = new MessageEmbed()
                    embed.setAuthor(userID ? `${message.guild.members.cache.get(userID).nickname ? `${message.guild.members.cache.get(userID).nickname} (${message.guild.members.cache.get(userID).user.username + '#' + message.guild.members.cache.get(userID).user.discriminator})` : message.guild.members.cache.get(userID).user.username + '#' + message.guild.members.cache.get(userID).user.discriminator}` : `${message.guild.members.cache.get(message.author.id).nickname ? `${message.guild.members.cache.get(message.author.id).nickname} (${message.guild.members.cache.get(message.author.id).user.username + '#' + message.guild.members.cache.get(message.author.id).user.discriminator})` : `${message.guild.members.cache.get(message.author.id).user.username + '#' + message.guild.members.cache.get(message.author.id).user.discriminator}`}`, userID ? message.guild.members.cache.get(userID).user.displayAvatarURL() : message.guild.members.cache.get(message.author.id).user.displayAvatarURL(), `https://www.last.fm/user/${lastfmAcc}`)
                    embed.setColor('#e4141e')
                    embed.setTimestamp()
                    embed.setURL(`https://www.last.fm/user/${lastfmAcc}/library/albums?date_preset=${period[1]}`)
                    const info = current.map(album => `**${album['@attr'].rank}. ${Util.escapeMarkdown(album.name, {bold: false})}** by [${Util.escapeMarkdown(album.artist.name, {bold: false})}](${album.url}) - ${album.playcount > 1 ? `${album.playcount} plays` : `${album.playcount} play`}`).join(`\n`)
                    embed.setDescription(`${info}`)
                    embed.setTitle(`Top albums for ${userID ? `${message.guild.members.cache.get(userID).nickname ? `${message.guild.members.cache.get(userID).nickname} (${message.guild.members.cache.get(userID).user.username + '#' + message.guild.members.cache.get(userID).user.discriminator})` : message.guild.members.cache.get(userID).user.username + '#' + message.guild.members.cache.get(userID).user.discriminator}` : `${message.guild.members.cache.get(message.author.id).nickname ? `${message.guild.members.cache.get(message.author.id).nickname} (${message.guild.members.cache.get(message.author.id).user.username + '#' + message.guild.members.cache.get(message.author.id).user.discriminator})` : `${message.guild.members.cache.get(message.author.id).user.username + '#' + message.guild.members.cache.get(message.author.id).user.discriminator}`}`}`)
                    embed.setThumbnail(current[0].image[3]['#text']);
                    embed.setFooter(`Time period - ${period[0]} | Powered by last.fm`, 'https://www.last.fm/static/images/lastfm_avatar_twitter.52a5d69a85ac.png')
                    embeds.push(embed)
                }
                return embeds;
            }
        }

        async function topArtists (message: Message, secondArg?: string, thirdArg?: string) {
            initModels(database);

            let username: string;
            let usernameEmbed: any;
            let userID: string;
            let userIDInsert: string;
            let period: string[];

            if (secondArg === 'overall') {
                period = ['overall', 'ALL']
                if (thirdArg) {
                    userIDInsert = thirdArg
                }
            } else if (secondArg === '7day') {
                period = ['7day', 'LAST_7_DAYS']
                if (thirdArg) {
                    userIDInsert = thirdArg
                }
            } else if (secondArg === '1month') {
                period = ['1month', 'LAST_30_DAYS']
                if (thirdArg) {
                    userIDInsert = thirdArg
                }
            } else if (secondArg === '3month') {
                period = ['3month', 'LAST_90_DAYS']
                if (thirdArg) {
                    userIDInsert = thirdArg
                }
            } else if (secondArg === '6month') {
                period = ['6month', 'LAST_180_DAYS']
                if (thirdArg) {
                    userIDInsert = thirdArg
                }
            } else if (secondArg === '12month') {
                period = ['12month', 'LAST_365_DAYS']
                if (thirdArg) {
                    userIDInsert = thirdArg
                }
            } else {
                userIDInsert = secondArg
                period = ['overall', 'ALL']
            }

            try {
                const theUser = message.mentions.members.first() || await message.guild.members.fetch(userIDInsert);
                if (theUser.user.bot === true) return message.channel.send(`A bot doesn't have a lastfm.`)
                userID = theUser.id
                try {
                    const lastfmData = await lastfm.findOne({raw: true, where : {userID: userID}})
                    if (!lastfmData) {
                        return message.channel.send(`This user doesn't have a last.fm account saved.`)
                    }
                    username = lastfmData.lastfm
                } catch {
                    return message.channel.send(`The mentioned user doesn't have a lastfm account saved.`)
                }
                } catch {
                    try {
                        let lastFmName = await lastfm.findOne({raw:true, where: {userID: message.author.id}});
                        username = lastFmName.lastfm
                    } catch {
                        const guildData = await guild.findOne({raw: true, where : {guildID: message.guild.id}})
                        return message.channel.send(`Please provide a LastFM username\n\`${guildData.prefix}fm set <lastfm account name>\`.`)
                    }
                }
            
            try {
                let response = await lastfmAPI.get('/', {params: { method: "user.gettopartists", user: username, period: period[0], limit: 50, page: 1}});
                usernameEmbed = response.data
            } catch {
                const guildData = await guild.findOne({raw: true, where : {guildID: message.guild.id}})
                return message.channel.send(`Request failed. Please provide a valid LastFM username\n\`${guildData.prefix}fm set <lastfm account name>\`.`)
            }

            let currentPage = 0;
            const embeds = generateTopArtistsEmbed(usernameEmbed, message, period, userID)
            const queueEmbed = await message.channel.send(`Current Page: ${currentPage+1}/${(await embeds).length}`, (await embeds)[currentPage]);
            await queueEmbed.react('⬅️');
            await queueEmbed.react('➡️');
            await queueEmbed.react('❌');
            const filter = (reaction, user) => ['⬅️', '➡️', '❌'].includes(reaction.emoji.name) && (message.author.id === user.id);
            const collector = queueEmbed.createReactionCollector(filter);

            collector.on('collect', async (reaction, user) => {
                if (reaction.emoji.name === '➡️') {
                    if (currentPage < (await embeds).length-1) {
                      currentPage++;
                      reaction.users.remove(user);
                      queueEmbed.edit(`Current Page: ${currentPage+1}/${(await embeds).length}`, (await embeds)[currentPage]);
                    } 
                  } else if (reaction.emoji.name === '⬅️') {
                    if (currentPage !== 0) {
                      --currentPage;
                      reaction.users.remove(user);
                      queueEmbed.edit(`Current Page ${currentPage+1}/${(await embeds).length}`, (await embeds)[currentPage]);
                    }
                  } else {
                    collector.stop();
                    await queueEmbed.delete();
                  }
            })

            async function generateTopArtistsEmbed (input, message: Message, period: string[], userID: string) {
                const lastfmAcc = input.topartists['@attr'].user
                const tracks = input.topartists.artist
                const embeds = [];
                let k = 10;
                for(let i =0; i < tracks.length; i += 10) {
                    const current = tracks.slice(i, k);
                    let j = i;
                    k += 10;

                    const embed = new MessageEmbed()
                    embed.setAuthor(userID ? `${message.guild.members.cache.get(userID).nickname ? `${message.guild.members.cache.get(userID).nickname} (${message.guild.members.cache.get(userID).user.username + '#' + message.guild.members.cache.get(userID).user.discriminator})` : message.guild.members.cache.get(userID).user.username + '#' + message.guild.members.cache.get(userID).user.discriminator}` : `${message.guild.members.cache.get(message.author.id).nickname ? `${message.guild.members.cache.get(message.author.id).nickname} (${message.guild.members.cache.get(message.author.id).user.username + '#' + message.guild.members.cache.get(message.author.id).user.discriminator})` : `${message.guild.members.cache.get(message.author.id).user.username + '#' + message.guild.members.cache.get(message.author.id).user.discriminator}`}`, userID ? message.guild.members.cache.get(userID).user.displayAvatarURL() : message.guild.members.cache.get(message.author.id).user.displayAvatarURL(), `https://www.last.fm/user/${lastfmAcc}`)
                    embed.setColor('#e4141e')
                    embed.setTimestamp()
                    embed.setURL(`https://www.last.fm/user/${lastfmAcc}/library/artists?date_preset=${period[1]}`)
                    const info = current.map(artist => `**${artist['@attr'].rank}. ${Util.escapeMarkdown(artist.name, {bold: false})}** - [${artist.playcount > 1 ? `${artist.playcount} plays` : `${artist.playcount} play`}](${artist.url})`).join(`\n`)
                    embed.setDescription(`${info}`)
                    embed.setTitle(`Top albums for ${userID ? `${message.guild.members.cache.get(userID).nickname ? `${message.guild.members.cache.get(userID).nickname} (${message.guild.members.cache.get(userID).user.username + '#' + message.guild.members.cache.get(userID).user.discriminator})` : message.guild.members.cache.get(userID).user.username + '#' + message.guild.members.cache.get(userID).user.discriminator}` : `${message.guild.members.cache.get(message.author.id).nickname ? `${message.guild.members.cache.get(message.author.id).nickname} (${message.guild.members.cache.get(message.author.id).user.username + '#' + message.guild.members.cache.get(message.author.id).user.discriminator})` : `${message.guild.members.cache.get(message.author.id).user.username + '#' + message.guild.members.cache.get(message.author.id).user.discriminator}`}`}`)
                    let cover;
                    await spotifyCred.searchArtists(current[0].name, {limit: 1}).then(function(data) {
                        cover = data
                    }, function (err) {
                        console.error(err);
                    })
                    embed.setThumbnail(cover.body.artists.items[0].images[0].url);
                    embed.setFooter(`Time period - ${period[0]} | Powered by last.fm`, 'https://www.last.fm/static/images/lastfm_avatar_twitter.52a5d69a85ac.png')
                    embeds.push(embed)
                }
                return embeds;
            }
        }

        async function recentTracks (message: Message, mentionedUser?: string) {
            initModels(database);

            let username: string;
            let usernameEmbed: any;
            let user: string;

            try {
                const theUser = message.mentions.members.first() || await message.guild.members.fetch(mentionedUser);
                if (theUser.user.bot === true) return message.channel.send(`A bot doesn't have a lastfm.`)
                user = theUser.id
                try {
                    const lastfmData = await lastfm.findOne({raw: true, where : {userID: user}})
                    if (!lastfmData) {
                        return message.channel.send(`This user doesn't have a last.fm account saved.`)
                    }
                    username = lastfmData.lastfm
                } catch {
                    return message.channel.send(`The mentioned user doesn't have a lastfm account saved.`)
                }
                } catch {
                    try {
                        let lastFmName = await lastfm.findOne({raw:true, where: {userID: message.author.id}});
                        username = lastFmName.lastfm
                    } catch {
                        const guildData = await guild.findOne({raw: true, where : {guildID: message.guild.id}})
                        return message.channel.send(`Please provide a LastFM username\n\`${guildData.prefix}fm set <lastfm account name>\`.`)
                    }
                }

            try {
                let response = await lastfmAPI.get('/', {params: { method: "user.getrecenttracks", user: username, limit: 50, page: 1}});
                usernameEmbed = response.data
            } catch {
                const guildData = await guild.findOne({raw: true, where : {guildID: message.guild.id}})
                return message.channel.send(`Request failed. Please provide a valid LastFM username\n\`${guildData.prefix}fm set <lastfm account name>\`.`)
            }

            let currentPage = 0;
            const embeds = generateRecentTracksEmbed(usernameEmbed, message, user)
            const queueEmbed = await message.channel.send(`Current Page: ${currentPage+1}/${(await embeds).length}`, (await embeds)[currentPage]);
            await queueEmbed.react('⬅️');
            await queueEmbed.react('➡️');
            await queueEmbed.react('❌');
            const filter = (reaction, user) => ['⬅️', '➡️', '❌'].includes(reaction.emoji.name) && (message.author.id === user.id);
            const collector = queueEmbed.createReactionCollector(filter);

            collector.on('collect', async (reaction, user) => {
                if (reaction.emoji.name === '➡️') {
                    if (currentPage < (await embeds).length-1) {
                      currentPage++;
                      reaction.users.remove(user);
                      queueEmbed.edit(`Current Page: ${currentPage+1}/${(await embeds).length}`, (await embeds)[currentPage]);
                    } 
                  } else if (reaction.emoji.name === '⬅️') {
                    if (currentPage !== 0) {
                      --currentPage;
                      reaction.users.remove(user);
                      queueEmbed.edit(`Current Page ${currentPage+1}/${(await embeds).length}`, (await embeds)[currentPage]);
                    }
                  } else {
                    collector.stop();
                    await queueEmbed.delete();
                  }
            })

            async function generateRecentTracksEmbed (input, message: Message, userID: string) {
                const lastfmAcc = input.recenttracks['@attr'].user
                const tracks = input.recenttracks.track
                const embeds = [];
                let k = 10;
                for(let i =0; i < tracks.length; i += 10) {
                    const current = tracks.slice(i, k);
                    let j = i;
                    k += 10;

                    const embed = new MessageEmbed()
                    embed.setAuthor(userID ? `${message.guild.members.cache.get(userID).nickname ? `${message.guild.members.cache.get(userID).nickname} (${message.guild.members.cache.get(userID).user.username + '#' + message.guild.members.cache.get(userID).user.discriminator})` : message.guild.members.cache.get(userID).user.username + '#' + message.guild.members.cache.get(userID).user.discriminator}` : `${message.guild.members.cache.get(message.author.id).nickname ? `${message.guild.members.cache.get(message.author.id).nickname} (${message.guild.members.cache.get(message.author.id).user.username + '#' + message.guild.members.cache.get(message.author.id).user.discriminator})` : `${message.guild.members.cache.get(message.author.id).user.username + '#' + message.guild.members.cache.get(message.author.id).user.discriminator}`}`, userID ? message.guild.members.cache.get(userID).user.displayAvatarURL() : message.guild.members.cache.get(message.author.id).user.displayAvatarURL(), `https://www.last.fm/user/${lastfmAcc}`)
                    embed.setColor('#e4141e')
                    embed.setTimestamp()
                    embed.setURL(`https://www.last.fm/user/${lastfmAcc}/library/`)
                    const info = current.map(track => `**${track['@attr'] ? `Now Playing` : moment.unix(track.date.uts).fromNow()}** | ${Util.escapeMarkdown(track.artist['#text'], {bold: false})} - [${Util.escapeMarkdown(track.name, {bold: false})}](${track.url})`).join(`\n`)
                    embed.setDescription(`${info}`)
                    embed.setTitle(`Recent tracks for ${userID ? `${message.guild.members.cache.get(userID).nickname ? `${message.guild.members.cache.get(userID).nickname} (${message.guild.members.cache.get(userID).user.username + '#' + message.guild.members.cache.get(userID).user.discriminator})` : message.guild.members.cache.get(userID).user.username + '#' + message.guild.members.cache.get(userID).user.discriminator}` : `${message.guild.members.cache.get(message.author.id).nickname ? `${message.guild.members.cache.get(message.author.id).nickname} (${message.guild.members.cache.get(message.author.id).user.username + '#' + message.guild.members.cache.get(message.author.id).user.discriminator})` : `${message.guild.members.cache.get(message.author.id).user.username + '#' + message.guild.members.cache.get(message.author.id).user.discriminator}`}`}`)
                    embed.setThumbnail(current[0].image[3]['#text']);
                    embed.setFooter(`Powered by last.fm`, 'https://www.last.fm/static/images/lastfm_avatar_twitter.52a5d69a85ac.png')
                    embeds.push(embed)
                }
                return embeds;
            }
        }

        async function lastfmProfile (message: Message, mentionedUser?: string) {
            // thumbnail is the lastfm profile pic if the API sends it back
            // author pic is the discord avatar
            initModels(database);

            let username: string;
            let usernameEmbed: any;
            let user: string;

            try {
                const theUser = message.mentions.members.first() || await message.guild.members.fetch(mentionedUser);
                if (theUser.user.bot === true) return message.channel.send(`A bot doesn't have a lastfm.`)
                user = theUser.id
                try {
                    const lastfmData = await lastfm.findOne({raw: true, where : {userID: user}})
                    if (!lastfmData) {
                        return message.channel.send(`This user doesn't have a last.fm account saved.`)
                    }
                    username = lastfmData.lastfm
                } catch {
                    return message.channel.send(`The mentioned user doesn't have a lastfm account saved.`)
                }
                } catch {
                    try {
                        let lastFmName = await lastfm.findOne({raw:true, where: {userID: message.author.id}});
                        username = lastFmName.lastfm
                    } catch {
                        const guildData = await guild.findOne({raw: true, where : {guildID: message.guild.id}})
                        return message.channel.send(`Please provide a LastFM username\n\`${guildData.prefix}fm set <lastfm account name>\`.`)
                    }
                }

            try {
                let response = await lastfmAPI.get('/', {params: { method: "user.getinfo", user: username}});
                usernameEmbed = response.data
            } catch {
                const guildData = await guild.findOne({raw: true, where : {guildID: message.guild.id}})
                return message.channel.send(`Request failed. Please provide a valid LastFM username\n\`${guildData.prefix}fm set <lastfm account name>\`.`)
            }

            const embed = new MessageEmbed()
            .setAuthor(user ? `${message.guild.members.cache.get(user).nickname ? `${message.guild.members.cache.get(user).nickname} (${message.guild.members.cache.get(user).user.username + '#' + message.guild.members.cache.get(user).user.discriminator})` : message.guild.members.cache.get(user).user.username + '#' + message.guild.members.cache.get(user).user.discriminator}` : `${message.guild.members.cache.get(message.author.id).nickname ? `${message.guild.members.cache.get(message.author.id).nickname} (${message.guild.members.cache.get(message.author.id).user.username + '#' + message.guild.members.cache.get(message.author.id).user.discriminator})` : `${message.guild.members.cache.get(message.author.id).user.username + '#' + message.guild.members.cache.get(message.author.id).user.discriminator}`}`, user ? message.guild.members.cache.get(user).user.displayAvatarURL() : message.guild.members.cache.get(message.author.id).user.displayAvatarURL(), `https://www.last.fm/user/${username}`)
            .setColor('#e4141e')
            .setTitle(`last.fm Profile for ${usernameEmbed.user.name}`)
            .setURL(usernameEmbed.user.url)
            .setThumbnail(usernameEmbed.user.image[3]['#text'])
            .addField(`Country`, `${usernameEmbed.user.country} ${flag(usernameEmbed.user.country)}`)
            .addField(`Track Plays`, `${usernameEmbed.user.playcount}`)
            .addField(`Account Created`, `${moment.unix(usernameEmbed.user.registered.unixtime).fromNow()}`)
            .setTimestamp()
            .setFooter(`Powered by last.fm`, 'https://www.last.fm/static/images/lastfm_avatar_twitter.52a5d69a85ac.png')
            
            return message.channel.send(embed)
        }

        async function lastfmWkt (message: Message, song?: string) {
            interface lastfmUsers {
                userid: bigint,
                lastfmaccountname: string
            }

            const lastfmUsersData: Array<lastfmUsers> = await database.query(`
            SELECT fm."userID" AS userID, fm.lastfm AS lastfmAccountName
            FROM lastfm as fm
            INNER JOIN "guildMember" gM on fm."userID" = gM."userID"
            WHERE gM."guildID" = :guild;`, {
                replacements: { guild: message.guild.id },
                type: QueryTypes.SELECT
            });

            let playData: object[] = []
            let artist: string;
            let track: string;
            let imageURL: string;

            if (song) {
                let songData = []
                songData = song.split('-')
                artist = songData[0]
                track = songData[1]
                try {
                    let getImageData = await lastfmAPI.get('/', {params: { method: "track.getInfo", artist: artist, track: track}});
                    let parseImageData = await getImageData.data
                    imageURL = parseImageData.track.album.image[3]['#text']
                    artist = parseImageData.track.artist.name
                    track = parseImageData.track.name
                    for (let user of lastfmUsersData) {
                        let response = await lastfmAPI.get('/', {params: { method: "track.getInfo", username: user.lastfmaccountname, artist: artist, track: track}});
                        let trackData = await response.data
                        playData.push({userID: user.userid, lastfm: user.lastfmaccountname, playCount: parseInt(trackData.track.userplaycount)})
                    }
                } catch {
                    return message.channel.send('Error! This is not a valid song. Remember the format is Artist - Track')
                }
            } else {
                try {
                    let lastFmName = await lastfm.findOne({raw:true, where: {userID: message.author.id}});
                    if (!lastFmName) {
                        return message.channel.send(`This user doesn't have a last.fm account saved.`)
                    }
                    const username = lastFmName.lastfm
                    const currentSongData = await lastfmAPI.get('/', {params: { method: "user.getrecenttracks", user: username, limit: 2, page: 1}});
                    const theCurrentSongData = await currentSongData.data
                    artist = theCurrentSongData.recenttracks.track[0].artist['#text']
                    track = theCurrentSongData.recenttracks.track[0].name
                    imageURL = theCurrentSongData.recenttracks.track[0].image[3]['#text']
                    for (let user of lastfmUsersData) {
                        let response = await lastfmAPI.get('/', {params: { method: "track.getInfo", username: user.lastfmaccountname, artist: artist, track: track}});
                        let trackData = await response.data
                        playData.push({userID: user.userid, lastfm: user.lastfmaccountname, playCount: parseInt(trackData.track.userplaycount)})
                    }
                } catch {
                    const guildData = await guild.findOne({raw: true, where : {guildID: message.guild.id}})
                    return message.channel.send(`Please provide a LastFM username\n\`${guildData.prefix}fm set <lastfm account name>\`.`)
                }
            }
 
            playData.sort(function (a, b) {
                return b.playCount - a.playCount
            });

            playData.slice(0, 9);

            const embeds = generateWktEmbed(playData)
            await message.channel.send(await embeds);

            async function generateWktEmbed (input) {
                const embeds = [];
                let k = 10;
                for(let i =0; i < input.length; i += 10) {
                    const current = input.slice(i, k);
                    let j = i;
                    k += 10;

                    const embed = new MessageEmbed()
                    let cover;
                    await spotifyCred.searchArtists(artist, {limit: 1}).then(function(data) {
                        cover = data
                    }, function (err) {
                        console.error(err);
                    })
                    embed.setAuthor(artist, cover.body.artists.items[0].images[0].url)
                    embed.setColor(`${await urlToColours(imageURL)}`)
                    embed.setTimestamp()
                    const info = current.map(user => `**${++j}.** ${message.guild.members.cache.get(user.userID).user} - **${user.playCount > 1 ? `${user.playCount} plays` : `${user.playCount} play`}**`).join(`\n`)
                    embed.setDescription(`${info}`)
                    embed.setThumbnail(imageURL)
                    embed.setTitle(`Who in ${message.guild.name} knows ${track}`)
                    embed.setFooter(`Powered by last.fm`, 'https://www.last.fm/static/images/lastfm_avatar_twitter.52a5d69a85ac.png')
                    embeds.push(embed)
                }
                return embeds;
            }
        }

        async function lastfmWka (message: Message, album?: string) {
            interface lastfmUsers {
                userid: bigint,
                lastfmaccountname: string
            }

            const lastfmUsersData: Array<lastfmUsers> = await database.query(`
            SELECT fm."userID" AS userID, fm.lastfm AS lastfmAccountName
            FROM lastfm as fm
            INNER JOIN "guildMember" gM on fm."userID" = gM."userID"
            WHERE gM."guildID" = :guild;`, {
                replacements: { guild: message.guild.id },
                type: QueryTypes.SELECT
            });

            let playData: object[] = []
            let artist: string;
            let artistAlbum: string;
            let imageURL: string;

            if (album) {
                let songData = []
                songData = album.split('-')
                artist = songData[0]
                artistAlbum = songData[1]
                try {
                    let getImageData = await lastfmAPI.get('/', {params: { method: "album.getInfo", artist: artist, album: artistAlbum}});
                    let parseImageData = await getImageData.data
                    imageURL = parseImageData.album.image[3]['#text']
                    artist = parseImageData.album.artist
                    artistAlbum = parseImageData.album.name
                    for (let user of lastfmUsersData) {
                        let response = await lastfmAPI.get('/', {params: { method: "album.getInfo", username: user.lastfmaccountname, artist: artist, album: artistAlbum}});
                        let albumData = await response.data
                        playData.push({userID: user.userid, lastfm: user.lastfmaccountname, playCount: parseInt(albumData.album.userplaycount)})
                    }
                } catch {
                    return message.channel.send('Error! This is not a valid album. Remember the format is Artist - Album')
                }
            } else {
                try {
                    let lastFmName = await lastfm.findOne({raw:true, where: {userID: message.author.id}});
                    if (!lastFmName) {
                        return message.channel.send(`This user doesn't have a last.fm account saved.`)
                    }
                    const username = lastFmName.lastfm
                    const currentSongData = await lastfmAPI.get('/', {params: { method: "user.getrecenttracks", user: username, limit: 2, page: 1}});
                    const theCurrentSongData = await currentSongData.data
                    artist = theCurrentSongData.recenttracks.track[0].artist['#text']
                    artistAlbum = theCurrentSongData.recenttracks.track[0].album['#text']
                    imageURL = theCurrentSongData.recenttracks.track[0].image[3]['#text']
                    for (let user of lastfmUsersData) {
                        let response = await lastfmAPI.get('/', {params: { method: "album.getInfo", username: user.lastfmaccountname, artist: artist, album: artistAlbum}});
                        let albumData = await response.data
                        playData.push({userID: user.userid, lastfm: user.lastfmaccountname, playCount: parseInt(albumData.album.userplaycount)})
                    }
                } catch {
                    const guildData = await guild.findOne({raw: true, where : {guildID: message.guild.id}})
                    return message.channel.send(`Please provide a LastFM username\n\`${guildData.prefix}fm set <lastfm account name>\`.`)
                }
            }
 
            playData.sort(function (a, b) {
                return b.playCount - a.playCount
            });

            playData.slice(0, 9);

            const embeds = generateWkaEmbed(playData)
            await message.channel.send(await embeds);

            async function generateWkaEmbed (input) {
                const embeds = [];
                let k = 10;
                for(let i =0; i < input.length; i += 10) {
                    const current = input.slice(i, k);
                    let j = i;
                    k += 10;

                    const embed = new MessageEmbed()
                    let cover;
                    await spotifyCred.searchArtists(artist, {limit: 1}).then(function(data) {
                        cover = data
                    }, function (err) {
                        console.error(err);
                    })
                    embed.setAuthor(artist, cover.body.artists.items[0].images[0].url)
                    embed.setColor(`${await urlToColours(imageURL)}`)
                    embed.setTimestamp()
                    const info = current.map(user => `**${++j}.** ${message.guild.members.cache.get(user.userID).user} - **${user.playCount > 1 ? `${user.playCount} plays` : `${user.playCount} play`}**`).join(`\n`)
                    embed.setDescription(`${info}`)
                    embed.setThumbnail(imageURL)
                    embed.setTitle(`Who in ${message.guild.name} knows ${artistAlbum}`)
                    embed.setFooter(`Powered by last.fm`, 'https://www.last.fm/static/images/lastfm_avatar_twitter.52a5d69a85ac.png')
                    embeds.push(embed)
                }
                return embeds;
            }
        }

        async function lastfmWk (message: Message, artist?: string) {
            interface lastfmUsers {
                userid: bigint,
                lastfmaccountname: string
            }

            const lastfmUsersData: Array<lastfmUsers> = await database.query(`
            SELECT fm."userID" AS userID, fm.lastfm AS lastfmAccountName
            FROM lastfm as fm
            INNER JOIN "guildMember" gM on fm."userID" = gM."userID"
            WHERE gM."guildID" = :guild;`, {
                replacements: { guild: message.guild.id },
                type: QueryTypes.SELECT
            });

            let playData: object[] = []
            let artistName: string;

            if (artist) {
                artistName = artist
                try {
                    let getImageData = await lastfmAPI.get('/', {params: { method: "artist.getInfo", artist: artistName}});
                    let parseImageData = await getImageData.data
                    artistName = parseImageData.artist.name
                    for (let user of lastfmUsersData) {
                        let response = await lastfmAPI.get('/', {params: { method: "artist.getInfo", username: user.lastfmaccountname, artist: artistName}});
                        let artistData = await response.data
                        playData.push({userID: user.userid, lastfm: user.lastfmaccountname, playCount: parseInt(artistData.artist.stats.userplaycount)})
                    }
                } catch {
                    return message.channel.send('Error! This is not a valid artist')
                }
            } else {
                try {
                    let lastFmName = await lastfm.findOne({raw:true, where: {userID: message.author.id}});
                    if (!lastFmName) {
                        return message.channel.send(`This user doesn't have a last.fm account saved.`)
                    }
                    const username = lastFmName.lastfm
                    const currentSongData = await lastfmAPI.get('/', {params: { method: "user.getrecenttracks", user: username, limit: 2, page: 1}});
                    const theCurrentSongData = await currentSongData.data
                    artistName = theCurrentSongData.recenttracks.track[0].artist['#text']
                    for (let user of lastfmUsersData) {
                        let response = await lastfmAPI.get('/', {params: { method: "artist.getInfo", username: user.lastfmaccountname, artist: artistName}});
                        let artistData = await response.data
                        playData.push({userID: user.userid, lastfm: user.lastfmaccountname, playCount: parseInt(artistData.artist.stats.userplaycount)})
                    }
                } catch {
                    const guildData = await guild.findOne({raw: true, where : {guildID: message.guild.id}})
                    return message.channel.send(`Please provide a LastFM username\n\`${guildData.prefix}fm set <lastfm account name>\`.`)
                }
            }
 
            playData.sort(function (a, b) {
                return b.playCount - a.playCount
            });

            playData.slice(0, 9);

            const embeds = generateWkEmbed(playData)
            await message.channel.send(await embeds);

            async function generateWkEmbed (input) {
                const embeds = [];
                let k = 10;
                for(let i =0; i < input.length; i += 10) {
                    const current = input.slice(i, k);
                    let j = i;
                    k += 10;

                    const embed = new MessageEmbed()
                    let cover;
                    await spotifyCred.searchArtists(artistName, {limit: 1}).then(function(data) {
                        cover = data
                    }, function (err) {
                        console.error(err);
                    })
                    embed.setColor(`${await urlToColours(cover.body.artists.items[0].images[0].url)}`)
                    embed.setTimestamp()
                    const info = current.map(user => `**${++j}.** ${message.guild.members.cache.get(user.userID).user} - **${user.playCount > 1 ? `${user.playCount} plays` : `${user.playCount} play`}**`).join(`\n`)
                    embed.setDescription(`${info}`)
                    embed.setThumbnail(cover.body.artists.items[0].images[0].url)
                    embed.setTitle(`Who in ${message.guild.name} knows ${artistName}`)
                    embed.setFooter(`Powered by last.fm`, 'https://www.last.fm/static/images/lastfm_avatar_twitter.52a5d69a85ac.png')
                    embeds.push(embed)
                }
                return embeds;
            }
        }

        async function lastfmGwkt (message: Message, song?: string) {
            interface lastfmUsers {
                userid: bigint,
                lastfm: string,
                username: string,
                discriminator: string
            }

            const lastfmUsersData: Array<lastfmUsers> = await database.query(`
            SELECT u."userID" AS userid, fm.lastfm, u.username, u.discriminator
            FROM lastfm as fm
            INNER JOIN "user" u on u."userID" = fm."userID";`, {
                type: QueryTypes.SELECT
            });

            let playData: object[] = []
            let artist: string;
            let track: string;
            let imageURL: string;

            if (song) {
                let songData = []
                songData = song.split('-')
                artist = songData[0]
                track = songData[1]
                try {
                    let getImageData = await lastfmAPI.get('/', {params: { method: "track.getInfo", artist: artist, track: track}});
                    let parseImageData = await getImageData.data
                    imageURL = parseImageData.track.album.image[3]['#text']
                    artist = parseImageData.track.artist.name
                    track = parseImageData.track.name
                    for (let user of lastfmUsersData) {
                        let response = await lastfmAPI.get('/', {params: { method: "track.getInfo", username: user.lastfm, artist: artist, track: track}});
                        let trackData = await response.data
                        playData.push({userID: user.userid, username: user.username, discriminator: user.discriminator, lastfm: user.lastfm, playCount: parseInt(trackData.track.userplaycount)})
                    }
                } catch {
                    return message.channel.send('Error! This is not a valid song. Remember the format is Artist - Track')
                }
            } else {
                try {
                    let lastFmName = await lastfm.findOne({raw:true, where: {userID: message.author.id}});
                    if (!lastFmName) {
                        return message.channel.send(`This user doesn't have a last.fm account saved.`)
                    }
                    const username = lastFmName.lastfm
                    const currentSongData = await lastfmAPI.get('/', {params: { method: "user.getrecenttracks", user: username, limit: 2, page: 1}});
                    const theCurrentSongData = await currentSongData.data
                    artist = theCurrentSongData.recenttracks.track[0].artist['#text']
                    track = theCurrentSongData.recenttracks.track[0].name
                    imageURL = theCurrentSongData.recenttracks.track[0].image[3]['#text']
                    for (let user of lastfmUsersData) {
                        let response = await lastfmAPI.get('/', {params: { method: "track.getInfo", username: user.lastfm, artist: artist, track: track}});
                        let trackData = await response.data
                        playData.push({userID: user.userid, username: user.username, discriminator: user.discriminator, lastfm: user.lastfm, playCount: parseInt(trackData.track.userplaycount)})
                    }
                } catch {
                    const guildData = await guild.findOne({raw: true, where : {guildID: message.guild.id}})
                    return message.channel.send(`Please provide a LastFM username\n\`${guildData.prefix}fm set <lastfm account name>\`.`)
                }
            }
 
            playData.sort(function (a, b) {
                return b.playCount - a.playCount
            });

            playData.slice(0, 9);

            const embeds = generateGwktEmbed(playData)
            await message.channel.send(await embeds);

            async function generateGwktEmbed (input) {
                const embeds = [];
                let k = 10;
                for(let i =0; i < input.length; i += 10) {
                    const current = input.slice(i, k);
                    let j = i;
                    k += 10;

                    const embed = new MessageEmbed()
                    let cover;
                    await spotifyCred.searchArtists(artist, {limit: 1}).then(function(data) {
                        cover = data
                    }, function (err) {
                        console.error(err);
                    })
                    embed.setAuthor(artist, cover.body.artists.items[0].images[0].url)
                    embed.setColor(`${await urlToColours(imageURL)}`)
                    embed.setTimestamp()
                    const info = current.map(user => `**${++j}.** ${user.username}#${user.discriminator} - **${user.playCount > 1 ? `${user.playCount} plays` : `${user.playCount} play`}**`).join(`\n`)
                    embed.setDescription(`${info}`)
                    embed.setThumbnail(imageURL)
                    embed.setTitle(`Who in ${client.user.username} knows ${track}`)
                    embed.setFooter(`Powered by last.fm`, 'https://www.last.fm/static/images/lastfm_avatar_twitter.52a5d69a85ac.png')
                    embeds.push(embed)
                }
                return embeds;
            }
        }

        async function lastfmGwka (message: Message, album?: string) {
            interface lastfmUsers {
                userid: bigint,
                lastfm: string,
                username: string,
                discriminator: string
            }

            const lastfmUsersData: Array<lastfmUsers> = await database.query(`
            SELECT u."userID" AS userid, fm.lastfm, u.username, u.discriminator
            FROM lastfm as fm
            INNER JOIN "user" u on u."userID" = fm."userID";`, {
                type: QueryTypes.SELECT
            });

            let playData: object[] = []
            let artist: string;
            let artistAlbum: string;
            let imageURL: string;

            if (album) {
                let songData = []
                songData = album.split('-')
                artist = songData[0]
                artistAlbum = songData[1]
                try {
                    let getImageData = await lastfmAPI.get('/', {params: { method: "album.getInfo", artist: artist, album: artistAlbum}});
                    let parseImageData = await getImageData.data
                    imageURL = parseImageData.album.image[3]['#text']
                    artist = parseImageData.album.artist
                    artistAlbum = parseImageData.album.name
                    for (let user of lastfmUsersData) {
                        let response = await lastfmAPI.get('/', {params: { method: "album.getInfo", username: user.lastfm, artist: artist, album: artistAlbum}});
                        let albumData = await response.data
                        playData.push({userID: user.userid, username: user.username, discriminator: user.discriminator, lastfm: user.lastfm, playCount: parseInt(albumData.album.userplaycount)})
                    }
                } catch {
                    return message.channel.send('Error! This is not a valid album. Remember the format is Artist - Album')
                }
            } else {
                try {
                    let lastFmName = await lastfm.findOne({raw:true, where: {userID: message.author.id}});
                    if (!lastFmName) {
                        return message.channel.send(`This user doesn't have a last.fm account saved.`)
                    }
                    const username = lastFmName.lastfm
                    const currentSongData = await lastfmAPI.get('/', {params: { method: "user.getrecenttracks", user: username, limit: 2, page: 1}});
                    const theCurrentSongData = await currentSongData.data
                    artist = theCurrentSongData.recenttracks.track[0].artist['#text']
                    artistAlbum = theCurrentSongData.recenttracks.track[0].album['#text']
                    imageURL = theCurrentSongData.recenttracks.track[0].image[3]['#text']
                    for (let user of lastfmUsersData) {
                        let response = await lastfmAPI.get('/', {params: { method: "album.getInfo", username: user.lastfm, artist: artist, album: artistAlbum}});
                        let albumData = await response.data
                        playData.push({userID: user.userid, username: user.username, discriminator: user.discriminator, lastfm: user.lastfm, playCount: parseInt(albumData.album.userplaycount)})
                    }
                } catch {
                    const guildData = await guild.findOne({raw: true, where : {guildID: message.guild.id}})
                    return message.channel.send(`Please provide a LastFM username\n\`${guildData.prefix}fm set <lastfm account name>\`.`)
                }
            }
 
            playData.sort(function (a, b) {
                return b.playCount - a.playCount
            });

            playData.slice(0, 9);

            const embeds = generateGwkaEmbed(playData)
            await message.channel.send(await embeds);

            async function generateGwkaEmbed (input) {
                const embeds = [];
                let k = 10;
                for(let i =0; i < input.length; i += 10) {
                    const current = input.slice(i, k);
                    let j = i;
                    k += 10;

                    const embed = new MessageEmbed()
                    let cover;
                    await spotifyCred.searchArtists(artist, {limit: 1}).then(function(data) {
                        cover = data
                    }, function (err) {
                        console.error(err);
                    })
                    embed.setAuthor(artist, cover.body.artists.items[0].images[0].url)
                    embed.setColor(`${await urlToColours(imageURL)}`)
                    embed.setTimestamp()
                    const info = current.map(user => `**${++j}.** ${user.username}#${user.discriminator} - **${user.playCount > 1 ? `${user.playCount} plays` : `${user.playCount} play`}**`).join(`\n`)
                    embed.setDescription(`${info}`)
                    embed.setThumbnail(imageURL)
                    embed.setTitle(`Who in ${client.user.username} knows ${artistAlbum}`)
                    embed.setFooter(`Powered by last.fm`, 'https://www.last.fm/static/images/lastfm_avatar_twitter.52a5d69a85ac.png')
                    embeds.push(embed)
                }
                return embeds;
            }
        }

        async function lastfmGwk (message: Message, artist?: string) {
            interface lastfmUsers {
                userid: bigint,
                lastfm: string,
                username: string,
                discriminator: string
            }

            const lastfmUsersData: Array<lastfmUsers> = await database.query(`
            SELECT u."userID" AS userid, fm.lastfm, u.username, u.discriminator
            FROM lastfm as fm
            INNER JOIN "user" u on u."userID" = fm."userID";`, {
                type: QueryTypes.SELECT
            });

            let playData: object[] = []
            let artistName: string;

            if (artist) {
                artistName = artist
                try {
                    let getImageData = await lastfmAPI.get('/', {params: { method: "artist.getInfo", artist: artistName}});
                    let parseImageData = await getImageData.data
                    artistName = parseImageData.artist.name
                    for (let user of lastfmUsersData) {
                        let response = await lastfmAPI.get('/', {params: { method: "artist.getInfo", username: user.lastfm, artist: artistName}});
                        let artistData = await response.data
                        playData.push({userID: user.userid, username: user.username, discriminator: user.discriminator, lastfm: user.lastfm, playCount: parseInt(artistData.artist.stats.userplaycount)})
                    }
                } catch {
                    return message.channel.send('Error! This is not a valid artist')
                }
            } else {
                try {
                    let lastFmName = await lastfm.findOne({raw:true, where: {userID: message.author.id}});
                    if (!lastFmName) {
                        return message.channel.send(`This user doesn't have a last.fm account saved.`)
                    }
                    const username = lastFmName.lastfm
                    const currentSongData = await lastfmAPI.get('/', {params: { method: "user.getrecenttracks", user: username, limit: 2, page: 1}});
                    const theCurrentSongData = await currentSongData.data
                    artistName = theCurrentSongData.recenttracks.track[0].artist['#text']
                    for (let user of lastfmUsersData) {
                        let response = await lastfmAPI.get('/', {params: { method: "artist.getInfo", username: user.lastfm, artist: artistName}});
                        let artistData = await response.data
                        playData.push({userID: user.userid, username: user.username, discriminator: user.discriminator, lastfm: user.lastfm, playCount: parseInt(artistData.artist.stats.userplaycount)})
                    }
                } catch {
                    const guildData = await guild.findOne({raw: true, where : {guildID: message.guild.id}})
                    return message.channel.send(`Please provide a LastFM username\n\`${guildData.prefix}fm set <lastfm account name>\`.`)
                }
            }
 
            playData.sort(function (a, b) {
                return b.playCount - a.playCount
            });

            playData.slice(0, 9);

            const embeds = generateGwkEmbed(playData)
            await message.channel.send(await embeds);

            async function generateGwkEmbed (input) {
                const embeds = [];
                let k = 10;
                for(let i =0; i < input.length; i += 10) {
                    const current = input.slice(i, k);
                    let j = i;
                    k += 10;

                    const embed = new MessageEmbed()
                    let cover;
                    await spotifyCred.searchArtists(artistName, {limit: 1}).then(function(data) {
                        cover = data
                    }, function (err) {
                        console.error(err);
                    })
                    embed.setColor(`${await urlToColours(cover.body.artists.items[0].images[0].url)}`)
                    embed.setTimestamp()
                    const info = current.map(user => `**${++j}.** ${user.username}#${user.discriminator} - **${user.playCount > 1 ? `${user.playCount} plays` : `${user.playCount} play`}**`).join(`\n`)
                    embed.setDescription(`${info}`)
                    embed.setThumbnail(cover.body.artists.items[0].images[0].url)
                    embed.setTitle(`Who in ${client.user.username} knows ${artistName}`)
                    embed.setFooter(`Powered by last.fm`, 'https://www.last.fm/static/images/lastfm_avatar_twitter.52a5d69a85ac.png')
                    embeds.push(embed)
                }
                return embeds;
            }
        }
    }
}