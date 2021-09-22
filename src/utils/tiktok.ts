import { MessageEmbed, MessageAttachment, Util } from "discord.js";
import moment from "moment";
import fetch from "node-fetch";
import { getVideoMeta } from "tiktok-scraper";

export async function tiktokEmbedding(URL: string): Promise<any> {
    try {
    const query: RegExpMatchArray = URL.match(/\bhttps?:\/\/\S+/gi);
    const finalQuery: string = query.toString();
    const videoMeta = await getVideoMeta(finalQuery);
    const video = videoMeta.collector[0];
    const videoURL = video.videoUrl;
    const headers = videoMeta.headers;
    const response = await fetch(videoURL, {
        method: 'GET', headers: {
            'user-agent': headers["user-agent"],
            referer: headers.referer,
            cookie: headers.cookie
        }
    });
    const buffer = await response.buffer()
    console.log(buffer)
    try {
        const embed = new MessageEmbed()
        .setTitle(`${Util.escapeMarkdown(video.text)}`)
        .setFooter(moment.unix(video.createTime).format("dddd, MMMM Do YYYY, h:mm A Z"))
        //.setTimestamp(moment.unix(video.createTime).toDate())
        .setColor('#000000')
        .setAuthor(video.authorMeta.name, video.authorMeta.avatar, `https://www.tiktok.com/@${video.authorMeta.name}?`)
        let finalVideo = new MessageAttachment(buffer, 'video.mp4')
        return [finalVideo, embed];
    } catch {
        return;
    };
    } catch {
        return
    }
};