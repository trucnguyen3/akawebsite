const express = require('express');
const app = express();
const path = require('path');

const port = 6595;
const host = '0.0.0.0'; // Bắt buộc phải là 0.0.0.0 để nhận traffic từ internet

app.use(express.static('public')); // Phục vụ các file tĩnh trong thư mục public

app.get('/download', (req, res) => {
    const userAgent = req.headers['user-agent'] || '';
    const oneLinkUrl = 'https://uat.akadigital.net/ek7m/fecdemo';

    // 1. Kiểm tra chính xác xem có phải là Bot của các mạng xã hội không
    const isSocialBot = /Zalo|facebookexternalhit|Facebot|Messenger|TelegramBot/i.test(userAgent);

    if (isSocialBot) {
        // Nếu là Bot: Trả về Metadata ngay lập tức, KHÔNG Redirect.
        // Bot sẽ dừng lại ở đây để lấy ảnh và thông tin hiển thị.
        return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta property="og:title" content="SkyPremium - Trải nghiệm bay đẳng cấp" />
                <meta property="og:description" content="Khám phá ngay ứng dụng đặt vé máy bay SkyPremium!" />
                <meta property="og:image" content="https://uat1.akadigital.net/assets/images/share-thumbnail.jpg" />
                <meta property="og:type" content="website" />
            </head>
            <body></body>
            </html>
        `);
    }

    // 2. Nếu là Người dùng (Browser): Redirect 302 ngay lập tức ở tầng Header.
    // Cách này sẽ KHÔNG load bất kỳ HTML nào, trình duyệt nhảy thẳng sang Onelink.
    res.set('Cache-Control', 'no-store'); // Đảm bảo không dính cache redirect cũ
    return res.redirect(302, oneLinkUrl);
});

app.listen(port, host, () => {
    console.log(`Server is running at http://${host}:${port}`);
});