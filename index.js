const express = require('express');
const app = express();
const path = require('path');

const port = 6595;
const host = '0.0.0.0'; // Bắt buộc phải là 0.0.0.0 để nhận traffic từ internet

app.use(express.static('public')); // Phục vụ các file tĩnh trong thư mục public

app.get('/download', (req, res) => {
    const userAgent = req.headers['user-agent'] || '';
    
    // Kiểm tra xem có phải là Bot của Zalo, Facebook, Messenger hay Telegram không
    const isSocialBot = /Zalo|facebookexternalhit|Facebot|Messenger|TelegramBot/i.test(userAgent);

    if (isSocialBot) {
        // TRƯỜNG HỢP LÀ BOT: Trả về HTML chứa Meta Data (Hardcoded)
        // Không cần file .html, trả về chuỗi String HTML luôn
        return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta property="og:title" content="SkyPremium - Trải nghiệm bay đẳng cấp" />
                <meta property="og:description" content="Khám phá ngay ứng dụng đặt vé máy bay SkyPremium với nhiều ưu đãi hấp dẫn!" />
                <meta property="og:image" content="https://static.wixstatic.com/media/09c7dc_1d2f30ffb15d452ab8cd7b006339d86a~mv2.png/v1/fill/w_286,h_371,al_c,q_95,enc_avif,quality_auto/09c7dc_1d2f30ffb15d452ab8cd7b006339d86a~mv2.png" />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://uat1.akadigital.net/download" />
            </head>
            <body></body>
            </html>
        `);
    } else {
        // TRƯỜNG HỢP LÀ NGƯỜI DÙNG: Redirect thẳng tới AppsFlyer
        // 302 Redirect giúp trình duyệt nhảy ngay lập tức mà không hiện trang trắng
        return res.redirect(302, 'https://uat.akadigital.net/ek7m/fecdemo');
    }
});

app.listen(port, host, () => {
    console.log(`Server is running at http://${host}:${port}`);
});