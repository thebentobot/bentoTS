// @ts-nocheck
import { Command } from '../../interfaces';
import { trim, urlToColours } from '../../utils/index';
import database from '../../database/database';
import { initModels } from '../../database/models/init-models';
import { Message, MessageEmbed, GuildMember, User, MessageAttachment } from 'discord.js';
import { QueryTypes } from 'sequelize';
import { stringify } from 'qs';
import { getHTMLImage } from '../../utils/sushii-html';

export const command: Command = {
    name: 'rank',
    aliases: ['profile', 'level'],
    category: 'user',
    description: 'Shows your rank level, xp and praises',
    usage: 'rank [userID/mention a user]',
    website: 'https://www.bentobot.xyz/commands#rank',
    run: async (client, message, args): Promise<Message> => {
        
            return userFunction(message)
        // rank og profile merges sammen, hvor den anden bruges til at se user info, ligesom robyul gør med userinfo

        async function userFunction (message: Message, user?: GuildMember | User) {
            function usernameSizeFunction (username: string) {
                if (username.length < 15) return "24px"
                if (username.length < 20) return "18px"
                if (username.length < 25) return "15px"
                return "11px"
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
            const bg = ""
            // colour needs to validate that it's hex somehow, look up on google
            const usernameColour = '#ffffff'
            const descriptionColour = '#ffffff'
            const discriminatorColour ='#9CA3AF'
            const backgroundColor = "#1F2937"
            const avatar = message.author.avatarURL({size: 128, format: 'png'}) ? message.author.avatarURL({size: 128, format: 'png'}) : `https://cdn.discordapp.com/embed/avatars/${Number(message.author.discriminator) % 5}.png`
            const usernameSlot = message.member.nickname ? message.member.nickname : message.author.username
            const discriminatorSlot = message.member.nickname ? `${message.author.username}#${message.author.discriminator}` : message.author.discriminator
            const usernameSize = usernameSizeFunction(usernameSlot)
            const xpServer = 3795
            const xpGlobal = 3795
            const sidebarBlur = '3'
            // rgba colours
            // 0, 0, 0, 0.3
            const sidebarOpacity = Math.round(0.3 * 255).toString(16);
            // #000000 is fully transparent
            const sidebarColour = `#000000${sidebarOpacity}`
            const replacements = {
                "BACKGROUND_IMAGE": bg,
                "WRAPPER_CLASS": bg.length > 0 ? "custom-bg" : '',
                "SIDEBAR_CLASS": bg.length > 0 ? "blur" : '',
                "OVERLAY_CLASS": bg.length > 0 ? "overlay" : '',
                "USER_COLOR": backgroundColor,
                "AVATAR_URL": avatar,
                "USERNAME": usernameSlot,
                "DISCRIMINATOR": discriminatorSlot,
                "DESCRIPTION": "insert command to update text here lmao",
                "SERVER_LEVEL": 17,
                "GLOBAL_LEVEL": 22,
                "USERNAME_SIZE": usernameSize,
                "DESCRIPTION_HEIGHT": "350px",
            }
            // without lastfm and other shit - description limit is 294 characters
            // you can make it adjust according to if lastfm or other shit is there or nah
            
            // vi mangler at indsætte noget af det planlagte data
            // vi skal reformatere koden samt lave commands, så man kan assign shit.
            // + lave db

            const css = `:root {
                --bgimage: url('${replacements.BACKGROUND_IMAGE}');
                --user-color: ${replacements.USER_COLOR};
            }
            
            body {
                margin: 0;
                padding: 0;
                font-family: "Segoe UI";
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
                line-height: 1;
                margin: auto;
            }
            
            /* e.g. level text */
            .sidebar-item {
                padding-top: 13px;
                height: auto;
                color: lightgray;
            }
            /* e.g. level value */
            .sidebar-value {
                font-size: 24px;
                color: white;
            }
            
            .name-container {
                position: absolute;
                top: 120px;
                width: 200px;
            }
            
            .badges {
                list-style: none;
                padding: 5px 0 0 7px;
                margin: 0;
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
                font-family: "Segoe UI";
                font-size: ${replacements.USERNAME_SIZE};
                fill: ${usernameColour};
            }
            
            .discriminator {
                font-family: "Segoe UI";
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
                top: 40px;
                width: 400px;
                height: ${replacements.DESCRIPTION_HEIGHT};
                margin: 0;
                padding: 0;
                overflow: hidden;
                color: ${descriptionColour};
            }
            
            .description {
                margin: 10px 10px 5px 20px;
                font-size: 20px;
                height: auto;
                max-height: 95%;
                width: 350px;
                word-wrap: break-word;
            }
            
            .description-text {
                margin: 0;
            }
            
            .inner-wrapper {
                width: inherit;
                height: inherit;
                overflow: hidden;
            }

            .xpDivBGBGBG {
                margin-left: auto;
                margin-right: auto;
                padding-left: 0.75rem/* 12px */;
                padding-right: 0.75rem/* 12px */;
                padding-top: 0.5rem/* 8px */;
                width: 100%;
            }

            .xpDivBGBG {
                position: relative;
            }

            /* rgba(17, 24, 39, var(--tw-bg-opacity)) */
            .xpDivBG {
                flex-grow: 1;
                padding: 1rem/* 16px */;
                width: 85%;
                overflow: hidden;
                display: flex;
                align-items: center;
                padding: 0.5rem/* 8px */;
                background-color: #111827;
                padding-left: 1rem/* 16px */;
                padding-right: 1rem/* 16px */;
                border-radius: 0.5rem/* 8px */;
            }

            .xpDiv {
                flex-grow: 1;
                padding: 1rem/* 16px */;
                width: 75%;
                overflow: hidden;
            }

            .xpText {
                --tw-text-opacity: 1;
                color: rgba(255, 255, 255, var(--tw-text-opacity));
                text-align: left;
                overflow: hidden;
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
                width: ${(xpServer / (replacements.SERVER_LEVEL * replacements.SERVER_LEVEL * 100)) * 100}%;
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
                width: ${(xpGlobal / (replacements.GLOBAL_LEVEL * replacements.GLOBAL_LEVEL * 100)) * 100}%;
            }
            
            .overlay {
                background-color: rgba(0, 0, 0, 0.2);
            }`

            let htmlString: string = ''
            htmlString = `<div class="wrapper ${replacements.WRAPPER_CLASS}">
            <div class="inner-wrapper ${replacements.OVERLAY_CLASS}">

                <ul class="badges">
                    br
                </ul>
    
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
                        <li class='sidebar-item'><span class="sidebar-value">${replacements.SERVER_LEVEL}</span><br>Server level</li>
                        <li class='sidebar-item'><span class="sidebar-value">${replacements.GLOBAL_LEVEL}</span><br>Global level</li>
                        <li class='sidebar-item'><span class="sidebar-value">${replacements.GLOBAL_LEVEL}</span><br>Bento 🍱</li>
                    </ul>
    
                </div>
                <div class="footer">
                    <div class="xpDivBGBGBG">
                        <div class="xpDivBGBG">
                            <div class="xpDivBG">
                                <div class="xpDiv">
                                    <div class="xpText">
                                        ${Math.round(((replacements.SERVER_LEVEL * replacements.SERVER_LEVEL * 100) - xpServer) / 46)} messages to level ${replacements.SERVER_LEVEL + 1}
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
                                        ${Math.round(((replacements.GLOBAL_LEVEL * replacements.GLOBAL_LEVEL * 100) - xpGlobal) / 46)} messages to level ${replacements.GLOBAL_LEVEL + 1}
                                    </div>
                                    <div class="xpBar">
                                        <div class ="xpDoneGlobal"
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`
            htmlString = [
                `<html>\n`,
                `<head>\n`,
                `    <meta charset="UTF-8">\n`,
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
            const imageAttachment = new MessageAttachment(image, `${message.author.username}_profile.png`)
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