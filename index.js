require('dotenv').config(); // Nạp biến môi trường từ file .env

const express = require('express');
const app = express();
const path = require('path');
const http = require('http'); 
const { Server } = require('socket.io'); 
const crypto = require('crypto'); // Cần thiết để verify Zalo Signature
const axios = require('axios');
const Redis = require('ioredis');
const { Pool } = require('pg');

const port = 6595;
const host = '0.0.0.0'; 

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const { GoogleGenAI } = require('@google/genai');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); 

// ĐỌC CẤU HÌNH BẢO MẬT CHO CỔNG WEBHOOK CHÍNH
const WEBHOOK_SECRET_TOKEN = process.env.WEBHOOK_TOKEN || "SkyPremium_Secret_Token_2026"; 
const WEBHOOK_USER = process.env.WEBHOOK_USER || "skypra_partner";
const WEBHOOK_PASS = process.env.WEBHOOK_PASS || "SecurePassword2026!";

const ZALO_APP_ID = process.env.ZALO_APP_ID || "1234"; // 🔥 Đã sửa: Lấy đúng ZALO_APP_ID
const ZALO_APP_SECRET = process.env.ZALO_APP_SECRET || "lmaoez@1234!"; 
const ZALO_CODE_VERIFIER = process.env.ZALO_CODE_VERIFIER || ""; // Dùng nếu bạn cài Code Challenge (PKCE)

const WEBHOOK_CT_USER = process.env.WEBHOOK_CT_USER || "skypra_partner";
const WEBHOOK_CT_PASS = process.env.WEBHOOK_CT_PASS || "SecurePassword2026!";

const APPSFLYER_PUSHAPI_TOKEN = process.env.APPSFLYER_PUSHAPI_TOKEN || 'SecurePassword2026!';

const CLIENT_ID = 'aka_ct';
const CLIENT_SECRET = 'aka_banking_ct';
const DUMMY_ACCESS_TOKEN = 'Lmaoez';

// =================================================================
// CẤU HÌNH GOOGLE GENAI CLIENT MỚI
// =================================================================
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || 'Lmaoez'
});

// =================================================================
// CẤU HÌNH REDIS & DATABASE (POSTGRESQL) CHO CHATBOT
// =================================================================
const redis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
});

redis.on('connect', () => console.log('✅ Redis connected successfully'));
redis.on('error', (err) => console.error('❌ Redis Connection Error:', err));

const dbPool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/chatbot_db',
});

const initChatbotDb = async () => {
    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS chatbot_history (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(100) NOT NULL,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                is_cached BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await dbPool.query(createTableQuery);
        console.log('✅ Database chatbot_history table is ready');
    } catch (err) {
        console.error('❌ Database Initialization Error:', err.message);
    }
};
initChatbotDb();

// Mảng chung để gom tất cả lịch sử webhook hiển thị trên giao diện Center
let webhookPayloads = []; 

// =================================================================
// HELPER & LOGIC CHATBOT (REDIS CACHE + DB STORAGE)
// =================================================================

// Chuẩn hóa câu hỏi thành hash MD5 để làm Key trong Redis
function generateCacheKey(question) {
    const normalized = question.trim().toLowerCase();
    const hash = crypto.createHash('md5').update(normalized).digest('hex');
    return `chatbot:cache:${hash}`;
}

// Giả lập hoặc tích hợp AI API (OpenAI/Gemini/v.v.)
const COMPANY_FAQ = [
    {
        keywords: ['địa chỉ', 'ở đâu', 'trụ sở', 'văn phòng'],
        answer: 'Địa chỉ công ty SkyPremium / AKA Digital: 236/26C Điện Biên Phủ, Phường 17, Quận Bình Thạnh, TP. Hồ Chí Minh.'
    },
    {
        keywords: ['gói dịch vụ', 'dịch vụ'],
        answer: 'SkyPremium cung cấp các đặc quyền VIP cao cấp bao gồm: Đặt vé máy bay/khách sạn ưu đãi, ẩm thực sang trọng và hỗ trợ lifestyle 24/7.'
    },
    {
        keywords: ['ưu đãi', 'khuyến mãi'],
        answer: 'Hiện tại SkyPremium đang có chương trình ưu đãi giảm 20% phí gia hạn cho thành viên đăng ký gói Membership Năm!'
    }
];

function findFAQAnswer(question) {
    const q = question.toLowerCase();
    for (const item of COMPANY_FAQ) {
        if (item.keywords.some(kw => q.includes(kw))) {
            return item.answer;
        }
    }
    return null;
}

// 2. Cập nhật hàm gọi AI bằng ai.models.generateContent
async function fetchAIAnswer(question) {
    // Kiểm tra trong FAQ trước
    const faqAnswer = findFAQAnswer(question);
    if (faqAnswer) {
        return faqAnswer;
    }

    // Gọi Gemini AI thông qua SDK mới
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Bạn là trợ lý ảo SkyPremium Assistant. Hãy trả lời ngắn gọn, lịch sự câu hỏi sau của khách hàng: "${question}"`
        });

        // Trả về văn bản câu trả lời
        return response.text;
    } catch (error) {
        console.error("❌ Gemini AI Error:", error);
        return "Xin lỗi, hiện tại tôi đang gặp khó khăn khi xử lý câu hỏi này. Vui lòng thử lại sau!";
    }
}

// Lưu log hỏi đáp vào Database
async function saveChatToDB(userId, question, answer, isCached) {
    try {
        const query = `
            INSERT INTO chatbot_history (user_id, question, answer, is_cached) 
            VALUES ($1, $2, $3, $4)
        `;
        await dbPool.query(query, [userId, question, answer, isCached]);
    } catch (err) {
        console.error('❌ Error saving chat to DB:', err.message);
    }
}

// Function chính xử lý logic Chatbot
async function processChatbotRequest(userId, question) {
    const cacheKey = generateCacheKey(question);

    // 1. Kiểm tra cache từ Redis
    try {
        const cachedAnswer = await redis.get(cacheKey);
        if (cachedAnswer) {
            console.log(`⚡ [Redis Cache Hit] Key: ${cacheKey}`);
            // Ghi log vào DB (Asynchronous)
            saveChatToDB(userId, question, cachedAnswer, true);
            return { answer: cachedAnswer, source: 'cache' };
        }
    } catch (err) {
        console.error('⚠️ Redis Get Error:', err.message);
    }

    // 2. Cache Miss: Gọi AI Service
    console.log(`🤖 [Cache Miss] Fetching response from AI Engine...`);
    const answer = await fetchAIAnswer(question);

    // 3. Cache câu trả lời vào Redis (TTL 3600 giây = 1 giờ)
    try {
        await redis.set(cacheKey, answer, 'EX', 3600);
    } catch (err) {
        console.error('⚠️ Redis Set Error:', err.message);
    }

    // 4. Lưu câu hỏi + câu trả lời vào PostgreSQL
    saveChatToDB(userId, question, answer, false);

    return { answer, source: 'ai_engine' };
}

// =================================================================
// ENDPOINT CHATBOT API
// =================================================================
app.post('/api/chat', async (req, res) => {
    try {
        const { userId, question } = req.body;

        if (!userId || !question) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'userId và question không được để trống.' 
            });
        }

        const result = await processChatbotRequest(userId, question);

        return res.status(200).json({
            status: 'success',
            data: {
                userId,
                question,
                answer: result.answer,
                source: result.source
            }
        });
    } catch (err) {
        console.error('❌ Chatbot Endpoint Error:', err);
        return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
});

// Endpoint lấy lịch sử trò chuyện của User từ Database
app.get('/api/chat/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const query = `
            SELECT id, question, answer, is_cached, created_at 
            FROM chatbot_history 
            WHERE user_id = $1 
            ORDER BY created_at DESC 
            LIMIT 50
        `;
        const { rows } = await dbPool.query(query, [userId]);
        return res.status(200).json({ status: 'success', history: rows });
    } catch (err) {
        console.error('❌ Get History Error:', err);
        return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
});

app.post('/api/chat/clear-cache', async (req, res) => {
    try {
        const keys = await redis.keys('chatbot:cache:*');
        if (keys.length > 0) {
            await redis.del(keys);
        }
        return res.status(200).json({ status: 'success', message: 'Đã xóa toàn bộ Redis Cache Chatbot!' });
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message });
    }
});

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
    console.log(`[AppsFlyer] IP: ${req.ip}`);
    console.log(`[AppsFlyer] Headers:`, req.headers);
    console.log(`[AppsFlyer] Request:`, req.body);
    console.log(`[AppsFlyer] Response:`, res);

    // Lấy token từ header "authorization" do AppsFlyer gửi sang
    const authHeader = req.headers['x-af-v2-token'];

    // Kiểm tra token có khớp với "Lmaoez" không
    if (!authHeader || authHeader !== APPSFLYER_PUSHAPI_TOKEN) {
        console.warn(`[AppsFlyer] Token không hợp lệ từ IP: ${req.ip}`);
        return res.status(401).json({ status: 'error', message: 'Unauthorized: Invalid token' });
    }

    // Đúng token thì tiếp tục xử lý
    processAndEmitWebhook(req, "APPSFLYER");

    res.status(200).json({ status: 'success', message: 'AppsFlyer push data received successfully' });
});


// =================================================================
// 3. ENDPOINT WEBHOOK ZALO & OAUTH CALLBACK
// =================================================================
app.post('/webhook-zalo', (req, res) => {
    console.log(`[Zalo] Nhận event webhook từ IP: ${req.ip}`);

    // OPTIONAL: Kiểm tra chữ ký bảo mật từ Zalo (Signature Verification)
    if (ZALO_APP_SECRET) {
        const zaloMac = req.headers['x-zevent-signature'] || req.body.mac;
        if (zaloMac) {
            const rawData = JSON.stringify(req.body);
            const expectedMac = crypto.createHmac('sha256', ZALO_APP_SECRET).update(rawData).digest('hex');
            
            if (zaloMac !== expectedMac) {
                console.log(`[Zalo - CẢNH BÁO] Sai chữ ký Zalo Signature!`);
            }
        }
    }

    processAndEmitWebhook(req, "ZALO");
    res.status(200).json({ status: 'success', message: 'Zalo webhook received successfully' });
});

// =================================================================
// 4. ENDPOINT WEBHOOK CleverTap (HOÀN TOÀN KHÔNG CẦN AUTHEN)
// =================================================================
app.post('/webhook-clevertap', (req, res) => {
    // 1. Khai báo thông tin xác thực mong muốn

    // 2. Lấy header Authorization từ request
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
        console.warn(`[CleverTap] Từ chối truy cập (Thiếu Auth Header) từ IP: ${req.ip}`);
        return res.status(401).json({ status: 'error', message: 'Unauthorized: Missing Authentication Header' });
    }

    // 3. Giải mã chuỗi Base64
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    // 4. Kiểm tra Username & Password
    if (username !== WEBHOOK_CT_USER || password !== WEBHOOK_CT_PASS) {
        console.warn(`[CleverTap] Sai thông tin xác thực từ IP: ${req.ip}`);
        return res.status(401).json({ status: 'error', message: 'Unauthorized: Invalid credentials' });
    }

    // 5. Xác thực thành công -> Xử lý dữ liệu
    console.log(`[CleverTap] Xác thực thành công. Nhận webhook event từ IP: ${req.ip}`);
    processAndEmitWebhook(req, "CLEVERTAP");

    return res.status(200).json({ status: 'success', message: 'CleverTap push data received successfully' });
});

// ROUTE ĐÓN CALLBACK ĐỔI ACCESS TOKEN TỪ ZALO OAUTH V4
app.get('/zalo/callback', async (req, res) => {
    const { code, oa_id } = req.query;

    if (!code) {
        return res.status(400).send('❌ Không tìm thấy authorization code từ Zalo!');
    }

    console.log(`[Zalo OAuth] Nhận được code: ${code} cho OA ID: ${oa_id}`);

    try {
        // Chuẩn bị payload lấy Access Token
        const params = new URLSearchParams({
            code: code,
            app_id: ZALO_APP_ID,
            grant_type: 'authorization_code'
        });

        // Nếu có cài đặt PKCE Code Verifier
        if (ZALO_CODE_VERIFIER) {
            params.append('code_verifier', ZALO_CODE_VERIFIER);
        }

        const response = await axios.post(
            'https://oauth.zaloapp.com/v4/oa/access_token',
            params,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'secret_key': ZALO_APP_SECRET
                }
            }
        );

        const { access_token, refresh_token, expires_in, error, message } = response.data;

        if (error) {
            console.error('[Zalo OAuth Error]', response.data);
            return res.status(400).json({ status: 'error', message, details: response.data });
        }

        console.log('✅ LẤY TOKEN ZALO OA THÀNH CÔNG!');
        console.log('Access Token:', access_token);
        console.log('Refresh Token:', refresh_token);

        // Trả về giao diện HTML phản hồi trực tiếp cho Admin
        res.send(`
            <div style="font-family: Arial, sans-serif; padding: 30px; line-height: 1.6;">
                <h2 style="color: #4CAF50;">✅ Kết nối Zalo OA với App thành công!</h2>
                <p><b>OA ID:</b> ${oa_id}</p>
                <p><b>Thời hạn Access Token:</b> ${expires_in} giây</p>
                <hr>
                <p>App của bạn đã có đủ quyền tương tác API và nhận Webhook Events từ OA này.</p>
            </div>
        `);

    } catch (err) {
        console.error('[Zalo OAuth Exception]', err.response?.data || err.message);
        res.status(500).send('Lỗi trong quá trình trao đổi token với Zalo OAuth API.');
    }
});


// =================================================================
// XỬ LÍ BEARER TOKEN CLEVERTAP WEBHOOK OA2.0
// =================================================================
app.post('/oauth/token', (req, res) => {
    console.log("[CleverTap] request token thành công!", req.body)
    const { grant_type, client_id, client_secret } = req.body;

    // Validate grant type and client credentials
    if (grant_type === 'client_credentials' && 
        client_id === CLIENT_ID && 
        client_secret === CLIENT_SECRET) {
        
        return res.status(200).json({
            access_token: DUMMY_ACCESS_TOKEN,
            token_type: 'Bearer',
            expires_in: 60 // Token lifetime in seconds
        });
    }

    return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Client authentication failed'
    });
});

// =================================================================
// TẠO WEBHOOK OA2.0
// =================================================================
app.post('/clevertap-webhook-v2', (req, res) => {
    console.log("[CleverTap] request webhook thành công!", req.body)
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or malformed authorization token' });
    }

    const token = authHeader.split(' ')[1];

    // Validate the token
    if (token !== DUMMY_ACCESS_TOKEN) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Process the CleverTap payload securely
    const eventData = req.body;
    console.log('Received CleverTap Webhook Event:', JSON.stringify(eventData, null, 2));

    // Acknowledge receipt immediately (CleverTap expects a 2xx response)
    return res.status(200).json({ status: 'success', message: 'Webhook processed' });
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

// =================================================================
// HÀM XỬ LÝ XÓA TÀI KHOẢN
// =================================================================
app.get('/delete-account', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'delete-account.html'));
});

app.post('/api/request-delete-account', (req, res) => {
    const { accountInfo, reason } = req.body;

    if (!accountInfo) {
        return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp thông tin tài khoản.' });
    }

    console.log(`[YÊU CẦU XÓA TÀI KHOẢN] Account: ${accountInfo} | Lý do: ${reason || 'Không có'} | IP: ${req.ip}`);

    // Tùy chọn: Đẩy event trực tiếp lên giao diện Webhook Center để bạn quản lý realtime
    const deleteRequestPayload = {
        type: "ACCOUNT_DELETE_REQUEST",
        accountInfo: accountInfo,
        reason: reason,
        requestedAt: new Date().toISOString()
    };
    
    // Đẩy tín hiệu qua socket lên trang webhook-center nếu muốn theo dõi
    io.emit('new-webhook', {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        headers: req.headers,
        body: deleteRequestPayload,
        method: "DELETE_REQ"
    });

    res.status(200).json({ status: 'success', message: 'Yêu cầu xóa tài khoản đã được ghi nhận thành công.' });
});

app.get('/api/webhooks', (req, res) => {
    res.json(webhookPayloads);
});

server.listen(port, host, () => {
    console.log(`🚀 Node.js đang chạy trên cổng ${port}:`);
    console.log(`   - Chatbot API:       POST /api/chat`);
    console.log(`   - Chatbot History:   GET /api/chat/history/:userId`);
    console.log(`   - Main Webhook:      POST /webhook`);
    console.log(`   - AppsFlyer Push:     POST /webhook-appsflyer`);
    console.log(`   - Zalo Webhook:       POST /webhook-zalo`);
    console.log(`   - CleverTap Basic:    POST /webhook-clevertap`);
    console.log(`   - CleverTap OAuth:    POST /oauth/token & /clevertap-webhook-v2`);
    console.log(`   - Webhook Center UI:  GET /webhook-center`);
});