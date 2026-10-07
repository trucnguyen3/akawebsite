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

const bcrypt = require('bcrypt');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); 

const dbPool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/chatbot_db',
});

app.set('trust proxy', 1);

app.use(session({
    store: new pgSession({ pool: dbPool, tableName: 'user_sessions' }),
    secret: process.env.SESSION_SECRET || 'Lmaoez',
    resave: false,
    saveUninitialized: false,
    name: 'connect.sid',
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: true,
        sameSite: 'lax', // Hoặc 'none' nếu gọi cross-domain hoàn toàn
        domain: '.akadigital.net' // 🌟 Cho phép tất cả subdomain chia sẻ cookie này
    }
}));

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

const initDb = async () => {
    try {
        await dbPool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                mobile VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS chatbot_history (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(100) NOT NULL,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                is_cached BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Bảng Database đã sẵn sàng');
    } catch (err) {
        console.error('❌ Lỗi khởi tạo Database:', err.message);
    }
};
initDb();

// =================================================================
// ENDPOINTS AUTHENTICATION & SESSION
// =================================================================

// 1. Đăng ký tài khoản
app.post('/api/auth/signup', async (req, res) => {
    const { fullName, email, password, mobile } = req.body;

    if (!email || !password) {
        return res.status(400).json({ status: 'error', message: 'Vui lòng nhập Email và Mật khẩu.' });
    }

    try {
        // ... (Logic mã hóa password và lưu vào DB của bạn) ...
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await dbPool.query(
            'INSERT INTO users (full_name, email, password_hash, mobile) VALUES ($1, $2, $3, $4) RETURNING id, full_name, email, mobile',
            [fullName, email.toLowerCase(), hashedPassword, mobile || null]
        );

        const newUser = result.rows[0];

        // 🌟 TỰ ĐỘNG ĐĂNG NHẬP: Gán thông tin user vào Session ngay lập tức
        req.session.user = {
            id: newUser.id,
            fullName: newUser.full_name,
            email: newUser.email,
            mobile: newUser.mobile
        };

        // Lưu Session vào PostgreSQL
        req.session.save((err) => {
            if (err) {
                return res.status(500).json({ status: 'error', message: 'Lỗi khởi tạo phiên đăng nhập' });
            }
            return res.json({
                status: 'success',
                message: 'Đăng ký thành công!',
                data: req.session.user
            });
        });

    } catch (err) {
        console.error(err);
        return res.status(400).json({ status: 'error', message: 'Email đã tồn tại hoặc dữ liệu không hợp lệ' });
    }
});

// 2. Đăng nhập
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng nhập Email và Mật khẩu.' });
        }

        const result = await dbPool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
        if (result.rows.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Email hoặc mật khẩu không chính xác.' });
        }

        const user = result.rows[0];

        // Kiểm tra mật khẩu
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(400).json({ status: 'error', message: 'Email hoặc mật khẩu không chính xác.' });
        }

        // Lưu session
        req.session.user = {
            id: user.id,
            fullName: user.full_name,
            email: user.email,
            mobile: user.mobile
        };

        return res.status(200).json({
            status: 'success',
            message: 'Đăng nhập thành công!',
            data: req.session.user
        });
    } catch (err) {
        console.error('❌ Login Error:', err);
        return res.status(500).json({ status: 'error', message: 'Lỗi hệ thống khi đăng nhập.' });
    }
});

// 3. Lấy thông tin phiên hiện tại (Session Check)
app.get('/api/auth/me', (req, res) => {
    if (req.session && req.session.user) {
        return res.status(200).json({ status: 'success', data: req.session.user });
    }
    return res.status(401).json({ status: 'unauthorized', message: 'Chưa đăng nhập' });
});

// 4. Đăng xuất
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ status: 'error', message: 'Không thể đăng xuất.' });
        }
        res.clearCookie('connect.sid');
        return res.status(200).json({ status: 'success', message: 'Đăng xuất thành công!' });
    });
});

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
            model: 'gemini-3.5-flash',
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
        const currentUser = req.session?.user;
        const isLogin = !!currentUser?.email;
        const userId = isLogin ? currentUser.email : (req.session?.guestId || 'guest');
        
        const { question, action } = req.body;

        // Chấp nhận request có question HOẶC action
        if (!question && !action) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'question hoặc action không được để trống.' 
            });
        }

        // 1. Khởi tạo State Machine cho Lead Form trong Session
        if (!req.session.supportFlow) {
            req.session.supportFlow = { step: 'IDLE', data: {} };
        }
        const flow = req.session.supportFlow;

        const inputMessage = (question || '').trim();
        const inputLower = inputMessage.toLowerCase();

        // Từ khóa kích hoạt Form hỗ trợ
        const triggerKeywords = ['hỗ trợ', 'support', 'tư vấn', 'liên hệ', 'gặp nhân viên', '/support', '/help'];
        const isTriggerSupport = action === 'TRIGGER_SUPPORT_FORM' || triggerKeywords.some(kw => inputLower.includes(kw));

        // ----------------------------------------------------
        // A. LUỒNG SUPPORT LEAD FORM (FSM)
        // ----------------------------------------------------
        
        // Step 0: Kích hoạt Form
        if (isTriggerSupport && flow.step === 'IDLE') {
            flow.step = 'AWAITING_NAME';
            flow.data = {
                userId: userId,
                email: isLogin ? currentUser.email : null
            };

            return res.status(200).json({
                status: 'success',
                data: {
                    userId,
                    question,
                    answer: 'Bạn vui lòng cho Support Team biết Họ và Tên của bạn nhé:',
                    source: 'support_form'
                }
            });
        }

        // Step 1: Nhập Họ tên
        if (flow.step === 'AWAITING_NAME') {
            flow.data.fullName = inputMessage;

            if (flow.data.email) {
                // Đã login -> Chuyển thẳng sang hỏi Số điện thoại
                flow.step = 'AWAITING_MOBILE';
                return res.status(200).json({
                    status: 'success',
                    data: {
                        userId,
                        question,
                        answer: `Cảm ơn ${flow.data.fullName}. Cho mình xin Số điện thoại liên hệ của bạn nhé:`,
                        source: 'support_form'
                    }
                });
            } else {
                // Chưa login -> Hỏi Email
                flow.step = 'AWAITING_EMAIL';
                return res.status(200).json({
                    status: 'success',
                    data: {
                        userId,
                        question,
                        answer: `Cảm ơn ${flow.data.fullName}. Cho mình xin Địa chỉ Email của bạn:`,
                        source: 'support_form'
                    }
                });
            }
        }

        // Step 2: Nhập Email (Guest)
        if (flow.step === 'AWAITING_EMAIL') {
            flow.data.email = inputMessage;
            flow.step = 'AWAITING_MOBILE';
            return res.status(200).json({
                status: 'success',
                data: {
                    userId,
                    question,
                    answer: 'Cảm ơn bạn. Cho mình xin thêm Số điện thoại liên hệ nhé:',
                    source: 'support_form'
                }
            });
        }

        // Step 3: Nhập SĐT & Yêu cầu Confirm
        if (flow.step === 'AWAITING_MOBILE') {
            flow.data.mobile = inputMessage;
            flow.step = 'AWAITING_CONFIRMATION';

            const confirmMsg = `Vui lòng xác nhận lại thông tin yêu cầu hỗ trợ:\n` +
                `- Họ tên: ${flow.data.fullName}\n` +
                `- Email: ${flow.data.email}\n` +
                `- Số điện thoại: ${flow.data.mobile}\n` +
                `- User ID: ${flow.data.userId}\n\n` +
                `Thông tin trên đã chính xác chưa bạn?`;

            return res.status(200).json({
                status: 'success',
                data: {
                    userId,
                    question,
                    answer: confirmMsg,
                    source: 'support_form',
                    options: [
                        { label: 'Yes (Chính xác)', action: 'CONFIRM_YES' },
                        { label: 'No (Nhập lại)', action: 'CONFIRM_NO' }
                    ]
                }
            });
        }

        // Step 4: Xử lý Bấm / Gõ Yes / No
        if (flow.step === 'AWAITING_CONFIRMATION') {
            const isYes = action === 'CONFIRM_YES' || ['yes', 'có', 'dung', 'đúng', 'chính xác'].includes(inputLower);
            const isNo = action === 'CONFIRM_NO' || ['no', 'không', 'sai', 'nhập lại'].includes(inputLower);

            if (isYes) {
                // Insert vào Postgres bảng lead_form
                const query = `
                    INSERT INTO lead_form (user_id, full_name, email, mobile, status)
                    VALUES ($1, $2, $3, $4, 'confirmed')
                    RETURNING id;
                `;
                const values = [flow.data.userId, flow.data.fullName, flow.data.email, flow.data.mobile];
                await dbPool.query(query, values);

                // Reset state
                req.session.supportFlow = { step: 'IDLE', data: {} };

                return res.status(200).json({
                    status: 'success',
                    data: {
                        userId,
                        question,
                        answer: 'Cảm ơn bạn! Thông tin đã được gửi đến Support Team. Đội ngũ hỗ trợ sẽ liên hệ với bạn trong thời gian sớm nhất.',
                        source: 'support_form'
                    }
                });
            }

            if (isNo) {
                // Nhập lại từ đầu
                flow.step = 'AWAITING_NAME';
                flow.data = {
                    userId: userId,
                    email: isLogin ? currentUser.email : null
                };

                return res.status(200).json({
                    status: 'success',
                    data: {
                        userId,
                        question,
                        answer: 'Thông tin chưa chính xác. Chúng ta làm lại nhé!\n\nĐầu tiên, vui lòng nhập lại Họ và Tên của bạn:',
                        source: 'support_form'
                    }
                });
            }
        }

        // ----------------------------------------------------
        // B. LUỒNG CHATBOT GEMINI / CACHE BÌNH THƯỜNG
        // ----------------------------------------------------
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

app.delete('/api/auth/delete-account', async (req, res) => {
    try {
        // Kiểm tra xem người dùng đã đăng nhập chưa
        if (!req.session || !req.session.user) {
            return res.status(401).json({ status: 'error', message: 'Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn.' });
        }

        const userId = req.session.user.id;

        // Xóa user khỏi bảng users trong PostgreSQL
        const deleteResult = await dbPool.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);

        if (deleteResult.rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Tài khoản không tồn tại hoặc đã bị xóa.' });
        }

        // Hủy session đăng nhập
        req.session.destroy((err) => {
            if (err) {
                console.error('❌ Session Destroy Error:', err);
                return res.status(500).json({ status: 'error', message: 'Đã xóa tài khoản nhưng lỗi khi hủy phiên đăng nhập.' });
            }

            // Xóa cookie session ở phía client
            res.clearCookie('connect.sid'); // Thay 'connect.sid' bằng tên cookie session của bạn nếu có tùy chỉnh

            return res.status(200).json({
                status: 'success',
                message: 'Tài khoản đã được xóa vĩnh viễn khỏi hệ thống.'
            });
        });

    } catch (err) {
        console.error('❌ Delete Account Error:', err);
        return res.status(500).json({ status: 'error', message: 'Lỗi hệ thống khi xóa tài khoản.' });
    }
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