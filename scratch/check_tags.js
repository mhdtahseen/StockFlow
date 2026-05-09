
import fs from 'fs';

const content = fs.readFileSync(process.argv[2], 'utf8');
const stack = [];
const regex = /<\/?([a-zA-Z0-9]+)(?:\s+[^>]*?)?>/g;
let match;

while ((match = regex.exec(content)) !== null) {
    const [full, tag] = match;
    const isClosing = full.startsWith('</');
    const isSelfClosing = full.endsWith('/>');

    if (isSelfClosing) continue;

    if (isClosing) {
        if (stack.length === 0) {
            console.log(`Extra closing tag: ${full} at index ${match.index}`);
        } else {
            const last = stack.pop();
            if (last.tag !== tag) {
                console.log(`Mismatched tags: opened ${last.tag} (index ${last.index}), closed ${tag} (index ${match.index})`);
            }
        }
    } else {
        stack.push({ tag, index: match.index, full });
    }
}

while (stack.length > 0) {
    const last = stack.pop();
    console.log(`Unclosed tag: ${last.full} at index ${last.index}`);
}
