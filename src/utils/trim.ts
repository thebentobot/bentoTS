export function trim(str: string, max: number) {
    const trimmed = str.length > max ? `${str.slice(0, max - 3)}...` : str
    return trimmed
};