const express = require('express');
const app = express();
const path = require('path');
const http = require('http'); // Quay lại dùng http thuần vì Nginx đã lo SSL
const { Server } = require('socket.io'); 

const port = 6595;
const host = '0.0.0.0'; 

// Khởi tạo HTTP Server nội bộ
const server = http.createServer(app);

// Cấu hình Socket.io nhận traffic chuyển tiếp từ Nginx
const io = new Server(server, {
    cors: {
        origin: "*", // Cho phép mọi origin hoặc điền domain chính xác của bạn
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Phục vụ file tĩnh (Trang đặt vé máy bay SkyPremium)
app.use(express.static('public')); 

// --- ROUTE GIAO DIỆN ---
app.get('/download', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'download.html'));
});

app.get('/webhook-center', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'webhook.html'));
});

// --- LOGIC HỨNG WEBHOOK ---
let webhookPayloads = []; 

app.post('/webhook', (req, res) => {
    const newPayload = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        headers: req.headers,
        body: req.body,
        query: req.query,
        method: req.method
    };

    webhookPayloads.unshift(newPayload);
    if (webhookPayloads.length > 50) webhookPayloads.pop();

    // Bắn realtime xuống giao diện webhook.html
    io.emit('new-webhook', newPayload);

    res.status(200).json({ status: 'success', message: 'Webhook received via Nginx Proxy' });
});

app.get('/api/webhooks', (req, res) => {
    res.json(webhookPayloads);
});

io.on('connection', (socket) => {
    console.log(`[Socket] Thiết bị kết nối qua Nginx: ${socket.id}`);
});

server.listen(port, host, () => {
    console.log(`🚀 Node.js đang chạy HTTP nội bộ tại cổng ${port}`);
});