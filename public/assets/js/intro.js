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

    // 4. CHỜ 2 CÁNH THIỆP MỞ XONG HẲN (1000ms) rồi tự động trượt mượt mà xuống phần "Chuyện Tình Yêu"
    setTimeout(() => {
        // Tìm trực tiếp section Chuyện tình yêu (có id="about" trong menu của bạn) hoặc section nội dung đầu tiên
        const targetSection = document.getElementById('about') || document.querySelector('section:nth-of-type(2)');
        
        if (targetSection) {
            targetSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        } else {
            // Dự phòng: Trượt xuống một khoảng bằng chiều cao màn hình nếu không tìm thấy ID
            window.scrollBy({ 
                top: window.innerHeight, 
                behavior: 'smooth' 
            });
        }
    }, 1050);

    // 5. Ẩn hẳn lớp phủ phong bì sau khi hoàn tất animation
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