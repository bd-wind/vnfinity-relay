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

// Auto Keep-Alive: Giữ server luôn thức 24/24 trên Render Free
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;
if (RENDER_EXTERNAL_URL) {
    console.log(`[Keep-Alive] Đã kích hoạt cơ chế chống ngủ 24/24 cho: ${RENDER_EXTERNAL_URL}`);
    // Ping lần đầu sau 1 phút
    setTimeout(async () => {
        try {
            await fetch(`${RENDER_EXTERNAL_URL}/ping`);
            console.log('[Keep-Alive] Ping khởi động thành công!');
        } catch(e) {}
    }, 60000);

    // Tự động ping mỗi 10 phút để Render không bao giờ rơi vào chế độ ngủ (Sleep)
    setInterval(async () => {
        try {
            const res = await fetch(`${RENDER_EXTERNAL_URL}/ping`);
            if (res.ok) console.log('[Keep-Alive] Ping định kỳ thành công - Server thức 24/24!');
        } catch(e) {}
    }, 10 * 60 * 1000);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`VNFINITY Cloud Relay Server listening on port ${PORT}`);
});
