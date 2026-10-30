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

    // 4. CHỜ 2 CÁNH THIỆP MỞ XONG HẲN (1000ms), sau đó BẮT ĐẦU TỰ ĐỘNG LĂN TỪ TỪ XUỐNG DƯỚI
    setTimeout(() => {
        startAutoScrollToFooter();
    }, 1050);

    // 5. Ẩn hẳn lớp phủ phong bì
    setTimeout(() => {
        envelope.classList.add('open-done');
    }, 1100);
}

// Hàm thực hiện lăn từ từ xuống footer
function startAutoScrollToFooter() {
    isAutoScrolling = true;
    const btnIcon = document.getElementById('scrollIcon');
    if (btnIcon) btnIcon.className = "fas fa-pause text-xs"; // Đổi icon thành nút Pause

    // Xóa interval cũ nếu có để tránh bị chồng chéo
    if (scrollInterval) clearInterval(scrollInterval);

    scrollInterval = setInterval(() => {
        // Kiểm tra nếu đã lăn tới gần cuối trang (footer) thì dừng lại và đổi icon
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 10) {
            stopAutoScroll();
            return;
        }
        
        // Lăn xuống 1 pixel mỗi lần (số càng lớn lăn càng nhanh, ví dụ: 1.5 hoặc 2)
        window.scrollBy({ top: 1.2, behavior: 'linear' });
    }, 25); // Tốc độ mượt mà (milisecond)
}

// Hàm dừng tự động lăn
function stopAutoScroll() {
    isAutoScrolling = false;
    const btnIcon = document.getElementById('scrollIcon');
    if (btnIcon) btnIcon.className = "fas fa-chevron-down text-xs";
    clearInterval(scrollInterval);
}

// Nút bấm ở góc màn hình để Bật / Tắt chế độ lăn thủ công
function toggleAutoScroll() {
    if (isAutoScrolling) {
        stopAutoScroll();
    } else {
        startAutoScrollToFooter();
    }
}

// Hàm bật/tắt nhạc thủ công
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