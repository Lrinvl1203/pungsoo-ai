import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
const envPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) process.env[match[1]] = match[2];
    });
}

// Ensure api module is loaded
import handler from './api/analyze-location.ts';

const app = express();
app.use(express.json({ limit: '50mb' }));

app.post('/api/analyze-location', async (req, res) => {
    try {
        await handler(req, res);
    } catch (e) {
        console.error("UNHANDLED API ERROR:", e);
        res.status(500).send("A server error has occurred");
    }
});

app.listen(8080, () => {
    console.log("Test server running on port 8080");
});
