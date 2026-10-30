// Khóa cuộn ngay khi tải trang
document.body.classList.add('envelope-locked');

function openWeddingInvitation() {
    const envelope = document.getElementById('introEnvelope');
    if (!envelope || envelope.classList.contains('opening')) return;

    // Kích hoạt class opening để 2 cánh trượt ra 2 bên
    envelope.classList.add('opening');
    
    // Mở khóa cuộn trang cho web bên dưới
    document.body.classList.remove('envelope-locked');

    // Sau 1 giây (đúng bằng thời gian animation trượt), ẩn hẳn lớp phủ đi
    setTimeout(() => {
        envelope.classList.add('open-done');
    }, 1000);
}