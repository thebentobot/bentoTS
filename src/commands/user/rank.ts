// @ts-nocheck
import { Command } from '../../interfaces';
import { trim, urlToColours } from '../../utils/index';
import database from '../../database/database';
import { initModels, guild, lastfm } from '../../database/models/init-models';
import { Message, MessageEmbed, GuildMember, User, MessageAttachment } from 'discord.js';
import { QueryTypes } from 'sequelize';
import { stringify } from 'qs';
import { getHTMLImage } from '../../utils/sushii-html';
import axios from 'axios';
import moment from 'moment';
import { tz } from 'moment-timezone';
import * as dotenv from "dotenv";
dotenv.config();

const api_key = process.env.lastfm

const lastfmAPI = axios.create({
    baseURL: "https://ws.audioscrobbler.com/2.0",
    params: { api_key: api_key, format: 'json' }
});

export const command: Command = {
    name: 'rank',
    aliases: ['profile', 'level'],
    category: 'user',
    description: 'Shows your rank level, xp and praises',
    usage: 'rank [userID/mention a user]',
    website: 'https://www.bentobot.xyz/commands#rank',
    run: async (client, message, args): Promise<Message> => {
        
        return userFunction(message, args[0])
        // rank og profile merges sammen, hvor den anden bruges til at se user info, ligesom robyul gør med userinfo

        async function userFunction (message: Message, user: User | GuildMember) {
            // we need to make it possible to add users as an argument and then make it adjust the userid
            function usernameSizeFunction (username: string) {
                if (username.length < 15) return "24px"
                if (username.length < 20) return "18px"
                if (username.length < 25) return "15px"
                return "11px"
            }

            interface Rankings {
                rank: string,
                level?: number,
                xp?: number,
                bento?: number,
                userID: string
            }

            const serverRank: Array<Rankings> = await database.query(`
            SELECT row_number() over () as rank, t.level, t.xp, t."userID"
            FROM "guildMember" AS t
            WHERE t."guildID" = :guild
            GROUP BY t.level, t.xp, t."userID"
            ORDER BY t.level DESC, t.xp DESC`, {
                replacements: { guild: message.guild.id },
                type: QueryTypes.SELECT
            });
            
            // does this database fetch cost too much?
            const globalRank: Array<Rankings> = await database.query(`
            SELECT row_number() over (ORDER BY t.level DESC, t.xp DESC) AS rank, t.level, t.xp, t."userID"
            FROM "user" AS t
            GROUP BY t.level, t.xp, t."userID"
            ORDER BY t.level DESC, t.xp DESC`, {type: QueryTypes.SELECT});

            const bentoRank: Array<Rankings> = await database.query(`
            SELECT row_number() over (ORDER BY t.bento DESC) AS rank, t.bento, t."userID"
            FROM bento AS t
            GROUP BY t."userID"
            ORDER BY t.bento DESC`, {type: QueryTypes.SELECT});

            initModels(database)
            const userData = await guild.sum('memberCount')

            let userID: string;
            let username: string;
            let usernameEmbed: any;
            let lastfmStatus: string;

            try {
                const theUser = message.mentions.members.has(client.user.id) ? (message.mentions.members.size > 1 ? message.mentions.members.last() : message.member) : message.mentions.members.first() || await message.guild.members.fetch(user);
                if (theUser.user.bot === true) return message.channel.send(`A bot doesn't have a profile.`)
                userID = theUser.id
                const lastfmData = await lastfm.findOne({raw: true, where : {userID: userID}})
                if (lastfmData) {
                    username = lastfmData.lastfm
                }
            } catch {
                userID = message.author.id
                let lastFmName = await lastfm.findOne({raw:true, where: {userID: userID}});
                if (lastFmName) {
                    username = lastFmName.lastfm
                }
            }

            let serverRankUser: object[] = [];
            let globalRankUser: object[] = [];
            let bentoRankUser: object[] = [];

            for (let serverUser of serverRank) {
                if (serverUser.userID == userID) {
                    serverRankUser.push(serverUser)
                }
            }

            for (let globalUser of globalRank) {
                if (globalUser.userID == userID) {
                    globalRankUser.push(globalUser)
                }
            }

            for (let bentoUser of bentoRank) {
                if (bentoUser.userID == userID) {
                    bentoRankUser.push(bentoUser)
                }
            }

            if (username) {
                let response = await lastfmAPI.get('/', {params: { method: "user.getrecenttracks", user: username, limit: 2, page: 1}});
                usernameEmbed = response.data
                lastfmStatus = usernameEmbed.recenttracks.track[0]['@attr'] ? `Currently listening to ${usernameEmbed.recenttracks.track[0].name} by ${usernameEmbed.recenttracks.track[0].artist['#text']}.` : `Listened to ${usernameEmbed.recenttracks.track[0].name} by ${usernameEmbed.recenttracks.track[0].artist['#text']} ${moment.unix(usernameEmbed.recenttracks.track[0].date.uts).fromNow()}`
            }
            // vi skal gøre mange af elementerne customisable
            // kinda prøve at holde i hvert fald standard stilen (indtil folk har customised) det samme som hjemmesiden
            // indsæt bento, lastfm (toggable), timezone, horoscope (toggable)
            // evt. gøre description justerbar ligesom username
            // husk vi skal lave en db hvor vi kan gemme ting for en user
            // vis rank ud af antal på serveren
            // vis messages i stedet for xp
            // evt. prøv at implementer patreon somehow (indsæt et nyt table som godt kan være null)
            // vælge en random emote fra et emote array
            // unicode.
            // gøre så man kan ændre skriftfarve også

            // we need to disable the bento ranking if the user isn't to be found in the Bento table
            // we need to make it possible to disable and enable the xp board thing
            // we need to error handle lastfm and make it possible to enable/disable

            // in the future if the css ever gets better LOL we could do cover and like a separate div for the lastfm
            // or use the xp div?

            const discordUser = await message.guild.members.fetch(userID)

            const bg = ""
            // colour needs to validate that it's hex somehow, look up on google
            const usernameColour = '#ffffff'
            const descriptionColour = '#ffffff'
            const discriminatorColour ='#9CA3AF'
            const backgroundColor = "#1F2937"
            const avatar = discordUser.user.avatarURL({size: 128, format: 'png'}) ? discordUser.user.avatarURL({size: 128, format: 'png'}) : `https://cdn.discordapp.com/embed/avatars/${Number(discordUser.user.discriminator) % 5}.png`
            const usernameSlot = discordUser.nickname ? discordUser.nickname : discordUser.user.username
            const discriminatorSlot = discordUser.nickname ? `${discordUser.user.username}#${discordUser.user.discriminator}` : `#${discordUser.user.discriminator}`
            const usernameSize = usernameSizeFunction(usernameSlot)
            const xpServer = serverRankUser[0].xp as number
            const xpGlobal = globalRankUser[0].xp as number
            const sidebarBlur = '3'
            const userTimezone = moment().tz('Europe/Copenhagen').format('ddd, h:mmA')
            const userBirthdayDate: Date = new Date('25 Nov')
            const userBirthday = userTimezone ? `, ${moment(userBirthdayDate).format('MMM D')} 🎂` : `${moment(userBirthdayDate).format('MMM D')} 🎂`
            // rgba colours
            // 0, 0, 0, 0.3
            const sidebarOpacity = Math.round(0.3 * 255).toString(16);
            // #000000 is fully transparent
            const sidebarColour = `#000000${sidebarOpacity}`
            const overlayOpacity = Math.round(0.2 * 255).toString(16);
            const overlayColour = `#000000${overlayOpacity}`
            const replacements = {
                "BACKGROUND_IMAGE": bg,
                "WRAPPER_CLASS": bg.length > 0 ? "custom-bg" : '',
                "SIDEBAR_CLASS": bg.length > 0 ? "blur" : '',
                "OVERLAY_CLASS": bg.length > 0 ? "overlay" : '',
                "USER_COLOR": backgroundColor,
                "AVATAR_URL": avatar,
                "USERNAME": usernameSlot,
                "DISCRIMINATOR": discriminatorSlot,
                "DESCRIPTION": "Close to being done with the design, for now 👀",
                "SERVER_LEVEL": serverRankUser[0] ? serverRankUser[0].rank as number : 0,
                "GLOBAL_LEVEL": globalRankUser[0] ? globalRankUser[0].rank as number : 0,
                "USERNAME_SIZE": usernameSize,
                "DESCRIPTION_HEIGHT": "350px",
            }
            // without lastfm and other shit - description limit is 294 characters
            // you can make it adjust according to if lastfm or other shit is there or nah
            
            // vi mangler at indsætte noget af det planlagte data
            // vi skal reformatere koden samt lave commands, så man kan assign shit.
            // + lave db

            /*
            UPDATE from 16th of sep:
            Design should be mostly done.
            - We need to somehow make the text adjust upwards, so it starts at the bottom line and goes up
            We need to make a lot of colours customisable (including the xp/fm boards)
            We need to make it possible to disable the boards without shit fucking up, either by
            - turning opacity down in total
            - replacing lastfm with the xp board if xp board is disabled and lastfm is enabled
            - somehow adjust the margin of the description according to the boards (it's the first px value of the margin in the description css class)
            We need to add ways of adding badges
            - first badge is based on a random value from an array of emotes (or pictures? hmm)
            - Then add a badge if the person is in the bento support server (is this possible to do? check in the guildmember table?)
            - then add a badge if the person is a patreon
            Make all the customisation organised in variables
            - Both so it's a good overview in the code, but also so it's easier to make the database tables
            Make a placeholder for lastfm if the person hasn't assigned lastfm
            */

            let xpBoard = true

            const css = `:root {
                --bgimage: url('${replacements.BACKGROUND_IMAGE}');
                --user-color: ${replacements.USER_COLOR};
            }
            
            body {
                margin: 0;
                padding: 0;
                font-family: 'Urbanist', sans-serif;
            }
            
            .wrapper {
                width: 600px;
                height: 400px;
                background-color: var(--user-color);
                overflow: hidden;
                border-radius: 10px;
            }
            
            .custom-bg {
                background-size: cover;
                background-position: center;
                background-image: var(--bgimage);
            }
            
            /* e.g. the sidebar */
            .sidebar {
                position: absolute;
                left: 400px;
                top: 0px;
                z-index: 3;
                background-color: ${sidebarColour};
                width: 200px;
                height: inherit;
                border-radius: 0 10px 10px 0;
                font-family: 'Urbanist', sans-serif;
            }
            
            .blur {
                overflow: hidden;
                backdrop-filter: blur(${sidebarBlur}px);
            }
            
            .avatar {
                width: 96px;
                height: auto;
            }
            
            .avatar-container {
                position: absolute;
                overflow: hidden;
                transform: translate(-50%, 16px);
                left: 100px;
                width: 96px;
                height: 96px;
                border-radius: 50%;
                border-width: 0px;
                border-style: solid;
                border-color: white;
                z-index: 2;
            }
            
            .sidebar-list {
                list-style: none;
                text-align: center;
                position: absolute;
                top: 170px;
                right: 0px;
                width: 200px;
                color: white;
                line-height: 1.1;
                margin: auto;
                font-family: 'Urbanist', sans-serif;
            }
            
            /* e.g. level text */
            .sidebar-item {
                padding-top: 13px;
                height: auto;
                color: lightgray;
                font-family: 'Urbanist', sans-serif;
            }
            /* e.g. level value */
            .sidebar-value {
                font-size: 24px;
                color: white;
                font-family: 'Urbanist', sans-serif;
            }
            
            .name-container {
                position: absolute;
                top: 120px;
                width: 200px;
                font-family: 'Urbanist', sans-serif;
            }
            
            .badges {
                list-style: none;
                padding: 0;
                margin: 10px 10px 5px 20px;
                color: ${descriptionColour};
            }
            
            .badge-container {
                display: inline-block;
                margin-right: 0;
            }
            
            .corner-logo {
                width: 30px;
                height: 30px;
                color: white;
                padding: 3px;
                font-size: 30px;
                z-index: 5;
            }
            
            svg {
                width: 100%;
                height: 100%;
            }
            
            .username {
                font-family: 'Urbanist', sans-serif;
                font-size: ${replacements.USERNAME_SIZE};
                fill: ${usernameColour};
            }
            
            .discriminator {
                font-family: 'Urbanist', sans-serif;
                font-size: 17px;
                fill: ${discriminatorColour};
            }
            
            .footer {
                position: absolute;
                width: 400px;
                height: 150px;
                top: 250px;
                border-radius: 0 0 10px 10px;
            }
            
            .center-area {
                position: absolute;
                top: 20px;
                width: 400px;
                height: ${replacements.DESCRIPTION_HEIGHT};
                margin: 0;
                padding: 0;
                overflow: hidden;
                color: ${descriptionColour};
                font-family: 'Urbanist', sans-serif;
            }
            
            .description {
                margin: 195px 40px 20px;
                font-size: 20px;
                height: auto;
                max-height: 95%;
                width: 300px;
                word-wrap: break-word;
                font-family: 'Urbanist', sans-serif;
            }
            
            .description-text {
                margin: 0;
                font-family: 'Urbanist', sans-serif;
            }
            
            .inner-wrapper {
                width: inherit;
                height: inherit;
                overflow: hidden;
            }

            .xpDivBGBGBG {
                padding-top: 5px;
            }

            .xpDivBGBGBG2 {
                padding-left: 20px;
                padding-top: 32.5px;
            }

            .xpDivBGBG {
                position: relative;
            }

            /* rgba(17, 24, 39, var(--tw-bg-opacity)) */
            .xpDivBG {
                flex-grow: 0.5;
                width: 85%;
                overflow: hidden;
                display: flex;
                align-items: center;
                background-color: #111827;
                border-radius: 0.5rem/* 8px */;
                padding-left: 25px;
                padding-right: 15px;
            }

            .xpDiv {
                flex-grow: 1;
                padding: 0.5rem/* 16px */;
                width: 75%;
                overflow: hidden;

            }

            .fmDiv {
                flex-grow: 1;
                padding: 0.5rem/* 16px */;
                width: 75%;
                overflow: hidden;
            }

            .xpText {
                --tw-text-opacity: 1;
                color: rgba(255, 255, 255, var(--tw-text-opacity));
                text-align: right;
                overflow: hidden;
                font-family: 'Urbanist', sans-serif;
                font-size: medium;
            }

            .fmText {
                --tw-text-opacity: 1;
                color: rgba(255, 255, 255, var(--tw-text-opacity));
                text-align: left;
                overflow: hidden;
                font-family: 'Urbanist', sans-serif;
                font-size: medium;
                padding-left: 10px;
                display: flex;
                align-items: center;
            }

            .fmBar {
                width: 100%;
                --tw-bg-opacity: 1;
                background-color: rgba(55, 65, 81, var(--tw-bg-opacity));
                overflow: hidden;
                opacity: 0%;
            }

            .fmDoneServer {
                background: linear-gradient(to left, #FCD34D, #F59E0B, #EF4444);
                box-shadow: 0 3px 3px -5px #EF4444, 0 2px 5px #EF4444;
                border-radius: 20px;
                color: #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                width: 100%;
                opacity: 0%;
            }

            .xpBar {
                margin-top: 0.25rem/* 4px */;
                margin-bottom: 0.25rem/* 4px */;
                width: 100%;
                height: 0.25rem/* 4px */;
                --tw-bg-opacity: 1;
                background-color: rgba(55, 65, 81, var(--tw-bg-opacity));
                border-radius: 0.25rem/* 4px */;
                overflow: hidden;
            }

            .xpDoneServer {
                background: linear-gradient(to left, #FCD34D, #F59E0B, #EF4444);
                box-shadow: 0 3px 3px -5px #EF4444, 0 2px 5px #EF4444;
                border-radius: 20px;
                color: #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                width: ${(xpServer / (serverRankUser[0].level as number * serverRankUser[0].level as number * 100)) * 100}%;
            }

            .xpDoneGlobal {
                background: linear-gradient(to left, #FCD34D, #F59E0B, #EF4444);
                box-shadow: 0 3px 3px -5px #EF4444, 0 2px 5px #EF4444;
                border-radius: 20px;
                color: #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                width: ${(xpGlobal / (globalRankUser[0].level as number * globalRankUser[0].level as number * 100)) * 100}%;
            }

            .overlay {
                background-color: ${overlayColour};
            }`

            let htmlString: string = ''
            htmlString = `<div class="wrapper ${replacements.WRAPPER_CLASS}">
            <div class="inner-wrapper ${replacements.OVERLAY_CLASS}">

                <div class="center-area">
                    <div class="description">
                        <p class="description-text">${replacements.DESCRIPTION}</p>
                    </div>
                </div>
    
                <div class="sidebar ${replacements.SIDEBAR_CLASS}">
    
                    <div class='avatar-container'>
                        <img class='avatar' src='${replacements.AVATAR_URL}'>
                    </div>
    
                    <div class="name-container">
                        <svg width="200" height="50">
                <text class="username" x="50%" y="30%" dominant-baseline="middle" text-anchor="middle">${replacements.USERNAME}</text>
                <text class="discriminator " x="50%" y="75%" dominant-baseline="middle"
                  text-anchor="middle">${replacements.DISCRIMINATOR}</text>
              </svg>
                    </div>
    
                    <ul class='sidebar-list'>
                        <li class='sidebar-item'><span class="sidebar-value">Rank ${replacements.SERVER_LEVEL}</span><br>Of ${message.guild.members.cache.get(userID).guild.memberCount} Users</li>
                        <li class='sidebar-item'><span class="sidebar-value">Rank ${replacements.GLOBAL_LEVEL}</span><br>Of ${Math.floor(userData / 100) / 10.0 + "k"} Users</li>
                        ${bentoRankUser[0] ? `<li class='sidebar-item'><span class="sidebar-value">Rank ${bentoRankUser[0].rank}</span><br>Of ${bentoRank[bentoRank.length - 1].rank} 🍱 Users</li>` : ''}
                        <li class='sidebar-item'><span class="sidebar-value">😎 <img src="https://cdn.discordapp.com/emojis/864322844342222858.gif?v=1" width="24" height="24"></span><br>${userTimezone}${userBirthday}</li>
                    </ul>
    
                </div>
                <div class="footer">
                <div class="xpDivBGBGBG2">
                    <div class="xpDivBGBG">
                        <div class="xpDivBG">
                            <div class="fmDiv">
                                <img src="${usernameEmbed.recenttracks.track[0].image[0]['#text']}" width="36" height="36" style="float:left">
                                <div class="fmText">
                                ${usernameEmbed.recenttracks.track[0].name} <br /> ${usernameEmbed.recenttracks.track[0].artist['#text']}
                                </div>
                                <div class="fmBar">
                                    <div class ="fmDoneServer"
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                    ${xpBoard ? `<div class="xpDivBGBGBG">
                    <div class="xpDivBGBG">
                        <div class="xpDivBG">
                            <div class="xpDiv">
                                <div class="xpText">
                                🏠 Level ${serverRankUser[0].level}
                                </div>
                                <div class="xpBar">
                                    <div class ="xpDoneServer"
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="xpDivBG">
                            <div class="xpDiv">
                                <div class="xpText">
                                🌍 Level ${globalRankUser[0].level}
                                </div>
                                <div class="xpBar">
                                    <div class ="xpDoneGlobal"
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>` : ''}
                </div>
            </div>
        </div>`
            htmlString = [
                `<html>\n`,
                `<head>\n`,
                `<link href="https://fonts.googleapis.com/css2?family=Urbanist:wght@400;700&display=swap" rel="stylesheet">\n`,
                `<meta charset="UTF-8">\n`,
                `</head>\n\n`,
                `<style>\n`,
                `${css}\n`,
                `</style>\n\n`,
                `<body>\n`,
                `${htmlString}\n`,
                `</body>\n\n`,
                `</html>\n`
            ].join(``);
            const image = await getHTMLImage(htmlString, '600', '400').catch(console.error);
            const imageAttachment = new MessageAttachment(image, `${discordUser.user.username}_profile.png`)
            return await message.channel.send(imageAttachment)
        }

        async function rankFunction (message: Message, user?: GuildMember | any) {
            initModels(database);

            let userID: string;
            let guildID: string = message.guild.id;

            if (user) {
                try {
                    const mentionedUser = message.mentions.members.has(client.user.id) ? (message.mentions.members.size > 1 ? message.mentions.members.last() : message.member) : message.mentions.members.first() || await message.guild.members.fetch(user);
                    if (mentionedUser.user.bot === true) return message.channel.send(`A bot doesn't have a rank. That would be unfair for users ;-)`)
                    userID = mentionedUser.id
                } catch {
                    return message.channel.send(`Error couldn't find a valid user based on your input: \`${user}\`.`)
                }
            } else {
                userID = message.author.id
            }

            const theRank = findRankByID(guildID, userID)
            return await message.channel.send(await theRank)
        }

        async function findRankByID (guildID: string, userID?: string, ) {

            interface Rankings {
                rank: string,
                level?: number,
                xp?: number,
                bento?: number,
                userID: string
            }

            const serverRank: Array<Rankings> = await database.query(`
            SELECT row_number() over () as rank, t.level, t.xp, t."userID"
            FROM "guildMember" AS t
            WHERE t."guildID" = :guild
            GROUP BY t.level, t.xp, t."userID"
            ORDER BY t.level DESC, t.xp DESC`, {
                replacements: { guild: guildID },
                type: QueryTypes.SELECT
            });
            
            const globalRank: Array<Rankings> = await database.query(`
            SELECT row_number() over (ORDER BY t.level DESC, t.xp DESC) AS rank, t.level, t.xp, t."userID"
            FROM "user" AS t
            GROUP BY t.level, t.xp, t."userID"
            ORDER BY t.level DESC, t.xp DESC`, {type: QueryTypes.SELECT});

            const bentoRank: Array<Rankings> = await database.query(`
            SELECT row_number() over (ORDER BY t.bento DESC) AS rank, t.bento, t."userID"
            FROM bento AS t
            GROUP BY t."userID"
            ORDER BY t.bento DESC`, {type: QueryTypes.SELECT});

            let serverRankUser: object[] = [];
            let globalRankUser: object[] = [];
            let bentoRankUser: object[] = [];
            let embeds: object[] = [];

            for (let serverUser of serverRank) {
                if (serverUser.userID == userID) {
                    serverRankUser.push(serverUser)
                }
            }

            for (let globalUser of globalRank) {
                if (globalUser.userID == userID) {
                    globalRankUser.push(globalUser)
                }
            }

            for (let bentoUser of bentoRank) {
                if (bentoUser.userID == userID) {
                    bentoRankUser.push(bentoUser)
                }
            }

            const embed = new MessageEmbed()
            .setColor(`${await urlToColours(message.guild.members.cache.get(userID).user.displayAvatarURL({ format: 'png'}))}`)
            .setAuthor(message.guild.members.cache.get(userID).guild.name, message.guild.members.cache.get(userID).guild.iconURL({format: 'png', dynamic: true}) ? message.guild.members.cache.get(userID).guild.iconURL({format: 'png', dynamic: true}) : client.user.displayAvatarURL({ format: 'png', dynamic: true }))
            .setTitle(`Rankings for ${message.guild.members.cache.get(userID).nickname ? `${message.guild.members.cache.get(userID).nickname} (${message.guild.members.cache.get(userID).user.username + '#' + message.guild.members.cache.get(userID).user.discriminator})` : message.guild.members.cache.get(userID).user.username + '#' + message.guild.members.cache.get(userID).user.discriminator}`)
            .setThumbnail(message.guild.members.cache.get(userID).user.displayAvatarURL({ format: 'png', dynamic: true }))
            .setTimestamp()
            .addFields(
                { name: 'Total Bento 🍱', value: bentoRankUser[0] ? bentoRankUser[0].bento : '0', inline: true},
                { name: 'Bento Box 🍱 rank', value: `${bentoRankUser[0] ? bentoRankUser[0].rank : 'You don\'t have any Bento 🍱 yet 😭'}/${bentoRank[bentoRank.length - 1].rank} users`, inline: true},
                { name: 'Server rank', value: `${serverRankUser[0] ? serverRankUser[0].rank : '0'}/${message.guild.members.cache.get(userID).guild.memberCount} users`},
                { name: 'Server Level', value: serverRankUser[0] ? serverRankUser[0].level : '0', inline: true},
                { name: 'Server XP', value: trim(`${serverRankUser[0] ? serverRankUser[0].xp : '0'} XP\n${serverRankUser[0] ? ((serverRankUser[0].level * serverRankUser[0].level * 100) - serverRankUser[0].xp) : '0'} XP ⬆️`, 1024), inline: true},
                { name: 'Global rank', value: `${globalRankUser[0] ? globalRankUser[0].rank : '0'}/${globalRank[globalRank.length - 1].rank} users`},
                { name: 'Global level', value: globalRankUser[0] ? globalRankUser[0].level : '0', inline: true},
                { name: 'Server XP', value: trim(`${globalRankUser[0] ? globalRankUser[0].xp : '0'} XP\n${globalRankUser[0] ? ((globalRankUser[0].level * globalRankUser[0].level * 100) - globalRankUser[0].xp) : '0'} XP ⬆️`, 1024), inline: true},
            )
            embeds.push(embed);
            return embeds
        }
    }
}