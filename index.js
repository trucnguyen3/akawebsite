require('dotenv').config(); // Nạp biến môi trường từ file .env

const express = require('express');
const app = express();
const path = require('path');
const http = require('http'); 
const { Server } = require('socket.io'); 
const crypto = require('crypto'); // Cần thiết để verify Zalo Signature

const port = 6595;
const host = '0.0.0.0'; 

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); 

// ĐỌC CẤU HÌNH BẢO MẬT CHO CỔNG WEBHOOK CHÍNH
const WEBHOOK_SECRET_TOKEN = process.env.WEBHOOK_TOKEN || "SkyPremium_Secret_Token_2026"; 
const WEBHOOK_USER = process.env.WEBHOOK_USER || "skypra_partner";
const WEBHOOK_PASS = process.env.WEBHOOK_PASS || "SecurePassword2026!";
const ZALO_APP_SECRET = process.env.ZALO_APP_SECRET || "lmaoez@1234!"; // Điền App Secret từ Zalo Developer Portal nếu muốn verify signature

// Mảng chung để gom tất cả lịch sử webhook hiển thị trên giao diện Center
let webhookPayloads = []; 

// --- CÁC ROUTE GIAO DIỆN ---
app.get('/download', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'download.html'));
});

app.get('/webhook-center', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'webhook.html'));
});


// =================================================================
// 1. ENDPOINT WEBHOOK CHÍNH (YÊU CẦU BẢO MẬT KÉP: BEARER / BASIC AUTH)
// =================================================================
app.post('/webhook', (req, res) => {
    const authHeader = req.headers['authorization'];
    const customTokenHeader = req.headers['x-webhook-token'];
    let isAuthenticated = false;

    if (authHeader) {
        if (authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            if (token === WEBHOOK_SECRET_TOKEN) isAuthenticated = true;
        } 
        else if (authHeader.startsWith('Basic ')) {
            try {
                const base64Credentials = authHeader.split(' ')[1];
                const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
                const [username, password] = credentials.split(':');
                if (username === WEBHOOK_USER && password === WEBHOOK_PASS) isAuthenticated = true;
            } catch (err) {
                return res.status(400).json({ status: 'error', message: 'Bad Request: Định dạng Basic Auth lỗi.' });
            }
        }
    } 
    else if (customTokenHeader && customTokenHeader === WEBHOOK_SECRET_TOKEN) {
        isAuthenticated = true;
    }

    if (!isAuthenticated) {
        console.log(`[CẢNH BÁO] Từ chối truy cập không Authen tại cổng chính từ IP: ${req.ip}`);
        return res.status(401).json({ status: 'error', message: 'Unauthorized: Endpoint này bắt buộc phải cấu hình Token hoặc Basic Auth.' });
    }

    // Làm sạch và xử lý dữ liệu
    processAndEmitWebhook(req, "SECURE_WEBHOOK");
    res.status(200).json({ status: 'success', message: 'Secure webhook received and processed.' });
});


// =================================================================
// 2. ENDPOINT WEBHOOK APPSFLYER (HOÀN TOÀN KHÔNG CẦN AUTHEN)
// =================================================================
app.post('/webhook-appsflyer', (req, res) => {
    console.log(`[AppsFlyer] Nhận push API event từ IP: ${req.ip}`);

    // Đẩy thẳng vào bộ xử lý dữ liệu mà không cần thông qua bất kỳ vòng kiểm tra token nào
    processAndEmitWebhook(req, "APPSFLYER");

    // Phản hồi mã 200 OK để server AppsFlyer biết đã nhận thông tin thành công
    res.status(200).json({ status: 'success', message: 'AppsFlyer push data received successfully without authentication' });
});


// =================================================================
// 3. ENDPOINT WEBHOOK ZALO (CẬP NHẬT KIỂM TRA CHỮ KÝ ĐA PHƯƠNG THỨC)
// =================================================================
app.post('/webhook-zalo', (req, res) => {
    console.log(`[Zalo] Nhận event webhook từ IP: ${req.ip}`);

    if (ZALO_APP_SECRET) {
        // 1. Lấy header chữ ký từ Zalo (Dạng: "mac=2000a53f...")
        const rawSignature = req.headers['x-zevent-signature'] || req.body.mac || "";
        const zaloMac = rawSignature.startsWith("mac=") ? rawSignature.replace("mac=", "") : rawSignature;

        if (zaloMac) {
            const { app_id, timestamp, data } = req.body;
            
            // Lấy timestamp từ body hoặc header x-zevent-timestamp nếu có
            const ts = timestamp || req.headers['x-zevent-timestamp'] || '';

            // Phương án 1: HMAC SHA-256 trên Raw Body String
            const rawBodyStr = JSON.stringify(req.body);
            const macHmacBody = crypto
                .createHmac('sha256', ZALO_APP_SECRET)
                .update(rawBodyStr)
                .digest('hex');

            // Phương án 2: SHA-256 (app_id + data_str + timestamp + app_secret)
            const dataStr = (typeof data === 'object' && data !== null) ? JSON.stringify(data) : (data || '');
            const rawChecksumCombo = `${app_id || ''}${dataStr}${ts}${ZALO_APP_SECRET}`;
            const macCombo = crypto
                .createHash('sha256')
                .update(rawChecksumCombo)
                .digest('hex');

            // Phương án 3: HMAC SHA-256 (app_id + timestamp + body) - Dành cho nút Test Webhook
            const macHmacAppTs = crypto
                .createHmac('sha256', ZALO_APP_SECRET)
                .update(`${app_id || ''}${ts}${rawBodyStr}`)
                .digest('hex');

            // So sánh với 1 trong các phương án
            const isValid = (zaloMac === macHmacBody) || (zaloMac === macCombo) || (zaloMac === macHmacAppTs);

            if (!isValid) {
                console.log(`[Zalo - CẢNH BÁO] Sai chữ ký Zalo Signature!`);
                console.log(`   - Zalo MAC nhận được: ${zaloMac}`);
                console.log(`   - MAC PA1 (HMAC Body): ${macHmacBody}`);
                console.log(`   - MAC PA2 (SHA256 Combo): ${macCombo}`);
            } else {
                console.log(`[Zalo] ✅ Xác thực chữ ký Zalo Signature THÀNH CÔNG!`);
            }
        }
    }

    // Đẩy dữ liệu vào hệ thống hiển thị Realtime Webhook Center
    processAndEmitWebhook(req, "ZALO");

    // BẮT BỤC: Phản hồi 200 OK ngay cho Zalo
    res.status(200).json({ status: 'success', message: 'Zalo webhook received successfully' });
});


// =================================================================
// HÀM XỬ LÝ CHUNG VÀ BẮN REALTIME LÊN GIAO DIỆN CENTER
// =================================================================
function processAndEmitWebhook(req, type) {
    const safeHeaders = { ...req.headers };
    
    // Luôn xóa thông tin nhạy cảm của hệ thống trước khi hiển thị ra giao diện
    delete safeHeaders['authorization'];
    delete safeHeaders['x-webhook-token'];
    delete safeHeaders['cookie'];

    const newPayload = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        headers: safeHeaders,
        body: req.body,
        query: req.query,
        // Phân loại nguồn dữ liệu đến để giao diện Webhook Center hiển thị nhãn phù hợp
        method: type === "APPSFLYER" ? "APPSFLYER" : (type === "ZALO" ? "ZALO" : req.method)
    };

    webhookPayloads.unshift(newPayload);
    if (webhookPayloads.length > 50) webhookPayloads.pop();

    // Phát tín hiệu Realtime xuống webhook.html qua Socket.io
    io.emit('new-webhook', newPayload);
}

app.get('/api/webhooks', (req, res) => {
    res.json(webhookPayloads);
});

server.listen(port, host, () => {
    console.log(`🚀 Node.js đang chạy:`);
    console.log(`   - Cổng bảo mật (Bearer & Basic): https://uat1.akadigital.net/webhook`);
    console.log(`   - Cổng công cộng cho AppsFlyer: https://uat1.akadigital.net/webhook-appsflyer`);
    console.log(`   - Cổng công cộng cho Zalo:      https://uat1.akadigital.net/webhook-zalo`);
});