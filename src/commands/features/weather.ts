import { Command } from '../../interfaces';
import axios from 'axios';
import database from '../../database/database';
import tzlookup from 'tz-lookup';
import moment from 'moment';
import { tz } from 'moment-timezone';
import { initModels, guild, weather, weatherCreationAttributes } from '../../database/models/init-models';
import * as dotenv from "dotenv";
import { Message, MessageEmbed, GuildMember } from 'discord.js';
import { capitalize } from '../../utils/capitalize';
import { flag } from 'country-emoji';
import { codeToName } from 'country-emoji/dist/lib';
dotenv.config();

const openWeatherAPI = axios.create({
    baseURL: "https://api.openweathermap.org/data/2.5",
});

export const command: Command = {
    name: 'weather',
    aliases: [],
    category: 'features',
    description: 'Displays info about the weather at the city saved for the user, or at the specified city.\nIf it shows a city from another country than the one you expected, try to add a country code (e.g. US, GB, DE) beside the city (remember a comma after city), as shown below\nIf it does not show up either, it may not be included in the OpenWeather API.',
    usage: 'weather [save] <city>, [country code]',
    run: async (client, message, args): Promise<Message> => {
        if (args[0] === 'save') {
            return saveWeather (message, args.slice(1).join(" "))
        }

        if (args[0]) {
            return weatherFunction (message, args.slice(0).join(" "))
        }

        if (!args.length) {
            return weatherFunction (message)
        }

        async function weatherFunction (message: Message, input?: GuildMember | any) {
            initModels(database);

            let userID: string;
            let city: string;

            if (input) {
                try {
                    const mentionedUser = message.mentions.members.first() || await message.guild.members.fetch(input);
                    if (mentionedUser.user.bot === true) return message.channel.send(`Bots doesn't care about the weather.`)
                    userID = mentionedUser.id
                    const weatherData = await weather.findOne({raw: true, where : {userID: userID}})
                    city = weatherData.city
                    } catch {
                        city = input
                    }
            } else {
                try {
                    userID = message.author.id
                    const weatherData = await weather.findOne({raw: true, where : {userID: userID}})
                    city = weatherData.city
                } catch {
                    const guildData = await guild.findOne({raw: true, where: {guildID: message.guild.id}})
                    return message.channel.send(`Your request was invalid. You haven't saved a city for the weather command.\nUse \`${guildData.prefix}help weather\` for help with your request.`)
                }
            }

            interface weatherAPIWeatherObjectInterface {
              id: number,
              main: string,
              description: string,
              icon: string
            }

            interface weatherAPISysObjectInterface {
              country: string,
              sunrise: number,
              sunset: number
            }

            interface weatherAPIMainObjectInterface {
              temp: number,
              feels_like: number,
              temp_min: number,
              temp_max: number,
              pressure: number,
              humidity: number
            }

            interface weatherAPICloudsObjectInterface {
              all: number
            }

            interface weatherAPIWindObjectInterface {
              speed: number,
              deg: number
            }

            interface weatherAPICoordObjectInterface {
              lon: number,
              lat: number
            }

            interface weatherAPIObjectInterface {
              name: string,
              id: number,
              weather: Array<weatherAPIWeatherObjectInterface>
              sys: weatherAPISysObjectInterface,
              main: weatherAPIMainObjectInterface,
              dt: number,
              timezone: number,
              clouds: weatherAPICloudsObjectInterface,
              wind: weatherAPIWindObjectInterface,
              coord: weatherAPICoordObjectInterface
            }

            let response: weatherAPIObjectInterface; 
            try {
                const fetch = await openWeatherAPI.get('/weather?', {params: {q: city, units: 'metric', appid: process.env.WEATHERKEY, lang: 'en'}});
                response = fetch.data
            } catch {
                const guildData = await guild.findOne({raw: true, where: {guildID: message.guild.id}})
                return message.channel.send(`No results found for the location \`${city}\`.\nIf you've saved the location you can change the location to something else by using \`${guildData.prefix}weather save <city>\`.\nIf you tried to check the weather by ID and it failed, it's either because the user hasn't saved a city or the user isn't on this server.\nIf you searched for the location, perhaps add the country code for the location or you've misspelled.\nUse \`${guildData.prefix}help weather\` to get help.`)
            }

            const Embed = new MessageEmbed()
                .setColor('#EB6E4B')
                .setAuthor(userID ? (message.guild.members.cache.get(userID).nickname ? `${message.guild.members.cache.get(userID).nickname} (${message.guild.members.cache.get(userID).user.username + '#' + message.guild.members.cache.get(userID).user.discriminator})` : message.guild.members.cache.get(userID).user.username + '#' + message.guild.members.cache.get(userID).user.discriminator) : 'OpenWeather', userID ? message.guild.members.cache.get(userID).user.displayAvatarURL({format: 'png', dynamic: true}) : 'https://pbs.twimg.com/profile_images/1173919481082580992/f95OeyEW_400x400.jpg', userID ? null : 'https://openweathermap.org/')
                .setTitle(`${response.weather[0].main} ${await weatherEmote(response.weather[0].id)} in ${response.name}, ${codeToName(response.sys.country)} ${flag(response.sys.country)}`)
                .setURL(`https://openweathermap.org/city/${response.id}`)
                .setThumbnail(`http://openweathermap.org/img/w/${response.weather[0].icon}.png`)
                .setFooter(userID ? `Powered by OpenWeather` : '', userID ? `https://pbs.twimg.com/profile_images/1173919481082580992/f95OeyEW_400x400.jpg` : null)
                .setTimestamp()
                .addFields(
                { name: 'Currently', value: `${capitalize(response.weather[0].description)} ${await weatherEmote(response.weather[0].id)}`},
                { name: 'Temperature', value: `${Math.round(response.main.temp)}°C (${Math.round(response.main.temp * 9/5 + 32)}°F)\n Feels like ${Math.round(response.main.feels_like)}°C (${Math.round(response.main.feels_like * 9/5 + 32)}°F)`, inline: true },
                { name: 'Minimum Temperature.', value: `${Math.round(response.main.temp_min)}°C (${Math.round(response.main.temp_min * 9/5 + 32)}°F)`, inline: true },
                { name: 'Maximum Temperature.', value: `${Math.round(response.main.temp_max)}°C (${Math.round(response.main.temp_max * 9/5 + 32)}°F)`, inline: true },
    
                { name: 'Cloudiness', value: `${response.clouds.all}%`, inline: true },
                { name: 'Humidity', value: `${response.main.humidity}%`, inline: true },
                { name: 'Last updated at', value: await toTimeZone((moment.unix(response.dt)), await location((response.coord.lat), (response.coord.lon))), inline: true },
    
                { name: 'Local time', value: await localTime(response.timezone), inline: true },
                { name: 'Sunrise', value: await toTimeZone((moment.unix(response.sys.sunrise)), await location((response.coord.lat), (response.coord.lon))), inline: true },
                { name: 'Sunset', value: await toTimeZone((moment.unix(response.sys.sunset)), await location((response.coord.lat), (response.coord.lon))), inline: true },
    
                { name: 'Pressure', value: `${response.main.pressure} hPa`, inline: true },
                { name: 'Wind Speed', value: `${response.wind.speed} m/s`, inline: true },
                { name: 'Wind Direction', value: await windDirection(response.wind.deg), inline: true },
                )
            return await message.channel.send(Embed)
        }

        async function saveWeather (message: Message, city: string) {
            initModels(database);

            let userID: string;
            userID = message.author.id

            const weatherAttr: weatherCreationAttributes = {
                userID: BigInt(userID),
                city: city
            }

            const createWeather = await weather.findOrCreate({raw: true, where: {userID: userID}, defaults: weatherAttr})

            if (createWeather[1] === false) {
              await weather.update({city: city}, {where: {userID: userID}})
              return message.channel.send(`${message.author} your weather city was updated to \`${city}\`!\n`)
            } else {
              return message.channel.send(`${message.author} your weather city \`${city}\` was saved!\nYou can now use weather commands without mentioning cities, to check the weather in your saved city.`)
            }
        }

        async function windDirection (degree: number) {
            if (degree == 90) {
                return `⬆️ (${degree}°)`
              }
              else if  (degree == 270) {
                return `⬇️ (${degree}°)`
              }
              else if  (degree == 180) {
                return `⬅️ (${degree}°)`
              }
              else if  (degree == 360 || 0) {
                return `➡️ (${degree}°)`
              }
              else if  (degree > 0 && degree < 90) {
                return `↗️ (${degree}°)`
              }
              else if  (degree > 270 && degree < 360) {
                return `↘️ (${degree}°)`
              }
              else if  (degree > 180 && degree < 270) {
                return `↙️ (${degree}°)`
              }
              else if  (degree > 90 && degree < 180) {
                return `↖️ (${degree}°)`
              }
        }

        async function weatherEmote (weather: number) {
            if (weather >= 210 && weather <= 221) {
                return '⛈️'
              }
              else if  (weather >= 200 && weather <= 202) {
                return '🌩️'
              }
              else if  (weather >= 230 && weather <= 232) {
                return '⛈️'
              }
              else if  (weather >= 300 && weather <= 321) {
                return '🌧️'
              }
              else if  (weather >= 500 && weather <= 504) {
                return '🌦️'
              }
              else if  (weather == 511) {
                return '🌨️'
              }
              else if  (weather >= 520 && weather <= 531) {
                return '🌧️'
              }
              else if  (weather >= 600 && weather <= 622) {
                return '❄️'
              }
              else if  (weather >= 701 && weather <= 781) {
                return '🌫️'
              }
              else if  (weather == 800) {
                return '☀️'
              }
              else if  (weather == 801) {
                return '⛅'
              }
              else if  (weather >= 802 && weather <= 804) {
                return '☁️'
            }
        }

        async function location (x: number, y:number) {
            let loc = tzlookup(x, y)
            return loc
        }

        async function toTimeZone(time, zone) {
            return moment(time, 'LT').tz(zone).format('LT');
        }

        async function localTime(x: number) {
            let d = new Date()
            let localTimeVar = d.getTime()
            let localOffset = d.getTimezoneOffset() * 60000
            let utc = localTimeVar + localOffset
            let time = utc + (1000 * x)
            let nd = new Date(time)
            let ex = moment(nd).format ('lll')
            return ex
        }

    }
}