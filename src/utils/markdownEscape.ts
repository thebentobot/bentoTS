export function markdownEscape(text: string) {
    if (text.includes('_' || '*' || '~')) {
        return `\`\`\`${text}\`\`\``
      } else {
        return text
    };
};