import axios from "axios";

export async function getHTMLImage (html: string, width: string, height: string, type="png") {
    let image = await axios({
        method: 'post',
        url: "http://localhost:3000/html",
        data: {
            html: html, 
            width: width, 
            height: height,
            imageFormat: type,
            quality: 100
        },
        responseType: "stream"
    })
    
    return image.data;
} 