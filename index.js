require('dotenv').config(); // Nạp biến môi trường từ file .env

const express = require('express');
const app = express();
const path = require('path');
const http = require('http'); 
const { Server } = require('socket.io'); 

const port = 6595;
const host = '0.0.0.0'; 

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); 

// ĐỌC CẤU HÌNH BẢO MẬT TỪ FILE .ENV
const WEBHOOK_SECRET_TOKEN = process.env.WEBHOOK_TOKEN || "SkyPremium_Secret_Token_2026"; 
const WEBHOOK_USER = process.env.WEBHOOK_USER || "skypra_partner";
const WEBHOOK_PASS = process.env.WEBHOOK_PASS || "SecurePassword2026!";

// --- CÁC ROUTE GIAO DIỆN ---
app.get('/download', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'download.html'));
});

app.get('/webhook-center', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'webhook.html'));
});


// --- ENDPOINT NHẬN WEBHOOK (HỖ TRỢ CẢ BEARER VÀ BASIC AUTH) ---
let webhookPayloads = []; 

app.post('/webhook', (req, res) => {
    const authHeader = req.headers['authorization'];
    const customTokenHeader = req.headers['x-webhook-token'];
    
    let isAuthenticated = false;

    // 1. KIỂM TRA NẾU KHÁCH HÀNG GỬI HEADER AUTHORIZATION
    if (authHeader) {
        // Trường hợp A: Khách hàng dùng Bearer Token tiêu chuẩn
        if (authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            if (token === WEBHOOK_SECRET_TOKEN) {
                isAuthenticated = true;
            }
        } 
        // Trường hợp B: Khách hàng dùng Basic Auth tiêu chuẩn
        else if (authHeader.startsWith('Basic ')) {
            try {
                const base64Credentials = authHeader.split(' ')[1];
                const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
                const [username, password] = credentials.split(':');

                if (username === WEBHOOK_USER && password === WEBHOOK_PASS) {
                    isAuthenticated = true;
                }
            } catch (err) {
                return res.status(400).json({ status: 'error', message: 'Bad Request: Định dạng Basic Auth lỗi.' });
            }
        }
    } 
    // Trường hợp C: Khách hàng dùng Custom Header tự chế (x-webhook-token)
    else if (customTokenHeader && customTokenHeader === WEBHOOK_SECRET_TOKEN) {
        isAuthenticated = true;
    }

    // 2. CHẶN ĐỨNG NẾU KHÔNG VƯỢT QUA BẤT KỲ CƠ CHẾ NÀO
    if (!isAuthenticated) {
        console.log(`[CẢNH BÁO] Truy cập trái phép bị chặn từ IP: ${req.ip}`);
        return res.status(401).json({ 
            status: 'error', 
            message: 'Unauthorized: Bạn cần cung cấp Bearer Token hoặc Basic Auth hợp lệ.' 
        });
    }

    // 3. BIỆN PHÁP AN TOÀN: XÓA SẠCH MỌI DẤU VẾT TOKEN/PASSWORD TRƯỚC KHI EMIT SANG SOCKET
    const safeHeaders = { ...req.headers };
    delete safeHeaders['authorization'];
    delete safeHeaders['x-webhook-token'];

    const newPayload = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        headers: safeHeaders, // Chỉ đẩy header an toàn lên màn hình hiển thị
        body: req.body,
        query: req.query,
        method: req.method
    };

    webhookPayloads.unshift(newPayload);
    if (webhookPayloads.length > 50) webhookPayloads.pop();

    // Bắn dữ liệu Realtime cực kỳ an toàn
    io.emit('new-webhook', newPayload);

    res.status(200).json({ status: 'success', message: 'Webhook received and authenticated successfully' });
});

app.get('/api/webhooks', (req, res) => {
    res.json(webhookPayloads);
});

server.listen(port, host, () => {
    console.log(`🚀 Node.js đang chạy song song hai lớp bảo mật (Bearer & Basic Auth) tại cổng ${port}`);
});