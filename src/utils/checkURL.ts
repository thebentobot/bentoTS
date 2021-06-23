export function checkURL(URL: string) {
    let finalURL: string;
    let checkUrl: RegExp = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/
    if (checkUrl.test(URL) == false) {
        return
    } else {
        finalURL = URL
    };
    return finalURL;
};