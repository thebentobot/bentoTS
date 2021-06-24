export function markdownEscape(text: string): string {
    if (text.includes('_' || '*' || '~')) {
        return `\`\`\`${text}\`\`\``
      } else {
        return text
    };
};