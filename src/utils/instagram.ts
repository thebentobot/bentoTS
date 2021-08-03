import { getPostMeta } from "instatouch";

export async function instagramEmbedding(URL: string): Promise<any> {
    try {
        const query = URL.match(/\bhttps?:\/\/\S+/gi);
        const finalQuery = query[0]
        const sliceQuery = finalQuery.substr(0, finalQuery.lastIndexOf("/") + 1);
        let data;
        try {
          data = await getPostMeta(sliceQuery, 
          {session: `sessionid=${process.env.IGsessionID}`, proxy: [`${process.env.IG1}`, `${process.env.IG2}`, `${process.env.IG3}`, `${process.env.IG4}`, `${process.env.IG5}`]})
        } catch (err) {
          console.log(err)
        }
        const openData = data.graphql.shortcode_media
        return openData
    } catch (err) {
        return console.log(err);
    };
};