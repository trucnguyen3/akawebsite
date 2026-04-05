const express = require('express');
const app = express();

const port = 6595;
const host = '0.0.0.0'; // Bắt buộc phải là 0.0.0.0 để nhận traffic từ internet

app.use(express.static('public')); // Phục vụ các file tĩnh trong thư mục public

app.listen(port, host, () => {
    console.log(`Server is running at http://${host}:${port}`);
});