// 수동 배포 전 점검용입니다. 빌드 결과에 vercel.json의 CSP를 적용해 Chrome 위반 로그를 검사합니다.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const projectRoot = process.cwd();
const distRoot = path.resolve(projectRoot, 'dist');
const profilePath = path.resolve(projectRoot, '.csp-chrome-profile');
const chromeCandidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean);
const chromePath = chromeCandidates.find(candidate => fs.existsSync(candidate));

if (!chromePath) {
    throw new Error('Chrome/Edge를 찾을 수 없습니다. CHROME_PATH를 지정하세요.');
}
if (!fs.existsSync(path.join(distRoot, 'index.html'))) {
    throw new Error('dist/index.html이 없습니다. 먼저 npm run build를 실행하세요.');
}

const vercelConfig = JSON.parse(
    fs.readFileSync(path.resolve(projectRoot, 'vercel.json'), 'utf8'),
);
const securityHeaders = Object.fromEntries(
    vercelConfig.headers
        .find(entry => entry.source === '/(.*)')
        .headers
        .map(({ key, value }) => [key, value]),
);
const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
};

const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (pathname === '/_vercel/insights/script.js') {
        res.writeHead(200, {
            ...securityHeaders,
            'Content-Type': 'text/javascript; charset=utf-8',
        });
        res.end('/* Local CSP check stub for Vercel Analytics. */');
        return;
    }
    if (pathname.startsWith('/_vercel/')) {
        res.writeHead(204, securityHeaders);
        res.end();
        return;
    }

    let target = path.resolve(distRoot, `.${pathname}`);
    if (
        !target.startsWith(distRoot)
        || !fs.existsSync(target)
        || fs.statSync(target).isDirectory()
    ) {
        target = path.join(distRoot, 'index.html');
    }

    res.writeHead(200, {
        ...securityHeaders,
        'Content-Type': contentTypes[path.extname(target)] || 'application/octet-stream',
    });
    fs.createReadStream(target).pipe(res);
});

try {
    fs.rmSync(profilePath, { recursive: true, force: true });
    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(4199, '127.0.0.1', resolve);
    });

    const chrome = spawn(chromePath, [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-breakpad',
        '--disable-crash-reporter',
        '--noerrdialogs',
        '--no-first-run',
        '--no-default-browser-check',
        `--user-data-dir=${profilePath}`,
        '--enable-logging=stderr',
        '--v=1',
        '--virtual-time-budget=8000',
        '--dump-dom',
        'http://127.0.0.1:4199/',
    ], { windowsHide: true });

    let stderr = '';
    chrome.stderr.setEncoding('utf8');
    chrome.stderr.on('data', chunk => {
        stderr += chunk;
    });

    const exitCode = await new Promise((resolve, reject) => {
        chrome.once('error', reject);
        chrome.once('exit', resolve);
    });
    const violations = stderr
        .split(/\r?\n/)
        .filter(line => /content security policy|refused to|violat.*directive/i.test(line));

    if (violations.length) {
        console.error(violations.join('\n'));
        process.exitCode = 1;
    } else if (exitCode !== 0) {
        const diagnostic = stderr.split(/\r?\n/).filter(Boolean).slice(-20).join('\n');
        throw new Error(`Headless browser exited with code ${exitCode}.\n${diagnostic}`);
    } else {
        console.log('No CSP violation messages detected during local headless runtime check.');
    }
} finally {
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(profilePath, { recursive: true, force: true });
}
