import axios from 'axios'
import * as dotenv from 'dotenv'
dotenv.config()

// localhost when on windows
// 0.0.0.0 when on mac
export async function getHTMLImage(html: string, width: string, height: string, type = `png`): Promise<Buffer> {
	return await axios({
		method: `post`,
		url: `http://${process.env.imageserverhost}:3000/html`,
		data: {
			html: html,
			width: width,
			height: height,
			imageFormat: type,
			quality: 100,
		},
		responseType: `arraybuffer`,
	}).then((res) => Buffer.from(res.data))
}
