// Khóa cuộn trang khi vừa vào web
document.body.classList.add('envelope-locked');

function openWeddingInvitation() {
    const envelope = document.getElementById('introEnvelope');
    if (!envelope) return;

    // 1. Thêm class fade out để làm mờ phong bì
    envelope.classList.add('fade-out');

    // 2. Mở khóa cuộn trang cho website bên dưới
    document.body.classList.remove('envelope-locked');

    // (Tùy chọn) Nếu bạn có nhạc nền (BGM) cho website, có thể kích hoạt phát nhạc ngay tại đây:
    // const bgMusic = document.getElementById('bgMusic');
    // if (bgMusic) bgMusic.play().catch(e => console.log("Autoplay blocked"));
}