import { MessageEmbed, MessageAttachment } from "discord.js";
import moment from "moment";
import fetch from "node-fetch";
import { getVideoMeta } from "tiktok-scraper";
import { markdownEscape } from "./markdownEscape";

export async function tiktokEmbedding(URL: string): Promise<any> {
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
    try {
        const embed = new MessageEmbed()
        .setTitle(`${markdownEscape(video.text)}`)
        .setFooter(moment.unix(video.createTime).format("dddd, MMMM Do YYYY, h:mm A"))
        .setColor('#000000')
        .setAuthor(video.authorMeta.name, video.authorMeta.avatar, `https://www.tiktok.com/@${video.authorMeta.name}?`)
        let finalVideo = new MessageAttachment(buffer, 'video.mp4')
        return [embed, finalVideo];
    } catch {
        return;
    };
};