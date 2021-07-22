import axios from "axios";
import getColors from 'get-image-colors';

export async function urlToColours (url: string) {
    if (url === null) return
    let colours: any;
    try {
        const response = await axios.get(url, {responseType: 'arraybuffer'});
        colours = await getColors(response.data, response.headers['content-type']).then(colors => colors.map(color => color.saturate(3).hex('rgb')))
    } catch (error) {
        colours = null
        console.error(error)
    }
    return colours[0]
} 