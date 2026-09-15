const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { TikTokLiveConnection } = require('tiktok-live-connector');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.get('/', (req, res) => {
    res.send('VNFINITY Cloud Relay Server is ONLINE and READY! 🚀');
});

app.get('/ping', (req, res) => {
    res.send('pong');
});

wss.on('connection', (ws, req) => {
    let url;
    try {
        url = new URL(req.url, 'http://localhost');
    } catch(e) {
        ws.close();
        return;
    }

    const room = url.searchParams.get('room');
    if (!room) {
        ws.send(JSON.stringify({ type: 'error', message: 'Thiếu tham số room (TikTok ID)' }));
        ws.close();
        return;
    }

    const cleanUsername = room.replace(/^@/, '').trim();
    console.log(`[Relay] Đang kết nối TikTok Live cho @${cleanUsername}...`);

    let tiktok = null;
    try {
        tiktok = new TikTokLiveConnection(cleanUsername, {
            processInitialData: false,
            fetchRoomInfoOnConnect: true
        });
    } catch (e) {
        ws.send(JSON.stringify({ type: 'error', message: e.message }));
        ws.close();
        return;
    }

    const forwardEvents = ['gift', 'chat', 'like', 'member', 'follow', 'share', 'envelope', 'subscribe'];
    forwardEvents.forEach(evt => {
        tiktok.on(evt, data => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: evt, data }));
            }
        });
    });

    tiktok.on('disconnected', () => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'disconnected' }));
        }
    });

    tiktok.on('streamEnd', () => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'streamEnd' }));
        }
    });

    tiktok.connect()
        .then(state => {
            console.log(`[Relay] Kết nối thành công tới @${cleanUsername} (Room: ${state.roomId})`);
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'connected', roomId: state.roomId }));
            }
        })
        .catch(err => {
            console.error(`[Relay Error] @${cleanUsername}:`, err.message);
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'error', message: err.message }));
                ws.close();
            }
        });

    ws.on('close', () => {
        console.log(`[Relay] Client ngắt kết nối cho @${cleanUsername}`);
        try {
            if (tiktok) tiktok.disconnect();
        } catch(e) {}
    });
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`VNFINITY Cloud Relay Server listening on port ${PORT}`);
});
