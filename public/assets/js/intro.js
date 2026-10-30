let isAutoScrolling = false;
let scrollInterval;

// Khóa cuộn trang khi vừa vào web
document.body.classList.add('envelope-locked');

function openWeddingInvitation() {
    const envelope = document.getElementById('introEnvelope');
    if (!envelope || envelope.classList.contains('opening')) return;

    // 1. Kích hoạt hiệu ứng mở 2 cánh thiệp
    envelope.classList.add('opening');
    
    // 2. Mở khóa cuộn trang ngay lập tức
    document.body.classList.remove('envelope-locked');

    // 3. Tự động phát nhạc
    const audio = document.getElementById('weddingAudio');
    const musicIcon = document.getElementById('musicIcon');
    if (audio) {
        audio.play().then(() => {
            if (musicIcon) musicIcon.className = "fas fa-compact-disc fa-spin";
        }).catch(err => {
            console.log("Trình duyệt chặn autoplay audio:", err);
        });
    }

    // 4. CHỜ 2 CÁNH THIỆP MỞ XONG HẲN (1000ms) rồi mới thực hiện tự động trượt mượt mà xuống dưới
    setTimeout(() => {
        // Tìm section nội dung chính (bạn có thể thay #story bằng ID của section đầu tiên trên web của bạn)
        const targetSection = document.getElementById('story') || document.getElementById('couple') || document.querySelector('section');
        
        if (targetSection) {
            // Lấy tọa độ chính xác của section đó so với đỉnh trang
            const targetPosition = targetSection.getBoundingClientRect().top + window.pageYOffset;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        } else {
            // Nếu không tìm thấy ID, mặc định trượt xuống đúng 1 màn hình rưỡi
            window.scrollTo({
                top: window.innerHeight * 0.9,
                behavior: 'smooth'
            });
        }
    }, 1050); // Chờ đúng 1.05 giây (sau khi hiệu ứng trượt cửa kết thúc)

    // 5. Ẩn hẳn lớp phủ phong bì
    setTimeout(() => {
        envelope.classList.add('open-done');
    }, 1100);
}

// Hàm bật/tắt Auto-Scroll khi bấm nút mũi tên ở góc màn hình
function toggleAutoScroll() {
    isAutoScrolling = !isAutoScrolling;
    const btnIcon = document.getElementById('scrollIcon');

    if (isAutoScrolling) {
        // Đang chạy auto-scroll thì đổi icon thành nút Pause (tạm dừng)
        if (btnIcon) btnIcon.className = "fas fa-pause text-xs";
        
        scrollInterval = setInterval(() => {
            // Nếu trượt tới cuối trang thì tự ngắt
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 10) {
                toggleAutoScroll();
                return;
            }
            window.scrollBy({ top: 1, behavior: 'linear' });
        }, 30); // Tốc độ trượt đều đặn mượt mà
    } else {
        // Dừng lại thì đổi icon về mũi tên hướng xuống
        if (btnIcon) btnIcon.className = "fas fa-chevron-down text-xs";
        clearInterval(scrollInterval);
    }
}

// Hàm bật/tắt nhạc thủ công khi bấm nút nốt nhạc
function toggleAudio() {
    const audio = document.getElementById('weddingAudio');
    const musicIcon = document.getElementById('musicIcon');
    if (!audio) return;

    if (audio.paused) {
        audio.play();
        if (musicIcon) musicIcon.className = "fas fa-compact-disc fa-spin";
    } else {
        audio.pause();
        if (musicIcon) musicIcon.className = "fas fa-music";
    }
}