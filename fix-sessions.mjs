import fs from 'fs';
import path from 'path';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('src/app/api');
for (const f of files) {
    let content = fs.readFileSync(f, 'utf8');
    let changed = false;
    
    if (content.includes('if (!session) return NextResponse.json')) {
        content = content.replace(/if \(!session\) return NextResponse\.json\(\{ error: 'Unauthorized' \}, \{ status: 401 \}\);/g, "if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });");
        changed = true;
    }
    
    if (content.includes('session.user.id')) {
        content = content.replace(/session\.user\.id/g, "(session.user as any).id");
        changed = true;
    }

    if (content.includes('session.user.name')) {
        content = content.replace(/session\.user\.name/g, "(session.user as any).name");
        changed = true;
    }
    
    if (changed) {
        fs.writeFileSync(f, content);
        console.log('Fixed', f);
    }
}
