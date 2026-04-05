const express = require('express');
const app = express();

app.use(express.static('public')); // Phục vụ các file tĩnh trong thư mục public

app.listen(6595, () => console.log('Server chạy tại http://localhost:6595'));