const crypto = require('crypto');

const codeVerifier = 'trucnguyenakadigitalvn26';

// Mã hóa SHA256 -> Base64Url
const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

console.log('👉 Copy chuỗi này dán vào ô Code Challenge trên Zalo Portal:');
console.log(codeChallenge);