const fs = require('fs');
const execSync = require('child_process').execSync;

try {
    execSync('git diff --check', { encoding: 'utf-8' });
} catch (e) {
    const output = e.stdout || '';
    const files = [];
    const lines = output.split('\n');
    for (const line of lines) {
        const match = line.match(/^(.*?):\d+: new blank line at EOF\./);
        if (match) {
            if (!files.includes(match[1])) files.push(match[1]);
        }
    }

    for (const file of files) {
        let content = fs.readFileSync(file, 'utf-8');
        const hasCRLF = content.includes('\r\n');
        content = content.replace(/[\r\n]+$/, '');
        content += hasCRLF ? '\r\n' : '\n';
        fs.writeFileSync(file, content);
    }
    console.log(files.length);
}
