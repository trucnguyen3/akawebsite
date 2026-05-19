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

// ==========================================
// CẤU HÌNH TOKEN BẢO MẬT CỦA BẠN
// ==========================================
// Hãy thay chuỗi này bằng một mã bí mật khó đoán của riêng bạn
const WEBHOOK_SECRET_TOKEN = "SkyPremium_Secret_Token_2026_lmaoez6969_phasmophobia_topplayerinside_2602"; 


// --- ROUTE GIAO DIỆN ---
app.get('/download', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'download.html'));
});

app.get('/webhook-center', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'webhook.html'));
});


// --- LOGIC HỨNG WEBHOOK CÓ BẢO MẬT ---
let webhookPayloads = []; 

app.post('/webhook', (req, res) => {
    // 1. LẤY TOKEN TỪ HEADER KHÁCH HÀNG GỬI LÊN
    // Hỗ trợ cả 2 cách đặt tên header phổ biến: 'Authorization' hoặc 'x-webhook-token'
    const authHeader = req.headers['authorization'];
    const customTokenHeader = req.headers['x-webhook-token'];
    
    let clientToken = "";

    if (authHeader && authHeader.startsWith('Bearer ')) {
        clientToken = authHeader.substring(7); // Cắt bỏ chữ "Bearer " để lấy token thuần
    } else {
        clientToken = customTokenHeader || "";
    }

    // 2. KIỂM TRA ĐỐI CHIẾU TOKEN
    if (!clientToken || clientToken !== WEBHOOK_SECRET_TOKEN) {
        console.log(`[CẢNH BÁO] Có request không hợp pháp cố tình truy cập Webhook từ IP: ${req.ip}`);
        // Trả về lỗi 401 ngay lập tức, ngắt kết nối luôn để tiết kiệm tài nguyên
        return res.status(401).json({ 
            status: 'error', 
            message: 'Unauthorized: Mã Token xác thực không hợp lệ hoặc đã hết hạn.' 
        });
    }

    // 3. NẾU TOKEN ĐÚNG -> TIẾP TỤC XỬ LÝ LOGIC NHƯ CŨ
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

    io.emit('new-webhook', newPayload);

    res.status(200).json({ status: 'success', message: 'Webhook received securely via Nginx Proxy' });
});

app.get('/api/webhooks', (req, res) => {
    res.json(webhookPayloads);
});

server.listen(port, host, () => {
    console.log(`🚀 Node.js đang chạy bảo mật Token tại cổng ${port}`);
});