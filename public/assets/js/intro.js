let isAutoScrolling = false;
let scrollAnimationId = null;

// Khóa cuộn trang khi vừa vào web
document.body.classList.add('envelope-locked');

function openWeddingInvitation() {
    const envelope = document.getElementById('introEnvelope');
    if (!envelope || envelope.classList.contains('opening')) return;

    // 1. Kích hoạt hiệu ứng mở 2 cánh thiệp
    envelope.classList.add('opening');
    
    // 2. Mở khóa cuộn trang ngay lập tức
    document.body.classList.remove('envelope-locked');

    // 3. Kích hoạt lớp phủ bắt sự kiện chạm màn hình (Kích hoạt pointer-events)
    const shield = document.getElementById('clickShield');
    if (shield) shield.style.pointerEvents = 'auto';

    // 4. Tự động phát nhạc
    const audio = document.getElementById('weddingAudio');
    const musicIcon = document.getElementById('musicIcon');
    if (audio) {
        audio.play().then(() => {
            if (musicIcon) musicIcon.className = "fas fa-compact-disc fa-spin";
        }).catch(err => {
            console.log("Trình duyệt chặn autoplay audio:", err);
        });
    }

    // 5. CHỜ 2 CÁNH THIỆP MỞ XONG HẲN (1000ms), sau đó BẮT ĐẦU TỰ ĐỘNG LĂN
    setTimeout(() => {
        startAutoScrollToFooter();
    }, 1100);

    // 6. Ẩn hẳn lớp phủ phong bì
    setTimeout(() => {
        envelope.classList.add('open-done');
    }, 1200);
}

// Hàm tự động lăn
function startAutoScrollToFooter() {
    isAutoScrolling = true;
    if (scrollAnimationId) cancelAnimationFrame(scrollAnimationId);

    let currentScroll = window.pageYOffset || document.documentElement.scrollTop;

    function step() {
        if (!isAutoScrolling) return;

        currentScroll += 2; // Tốc độ lăn (tăng/giảm tùy ý)
        window.scrollTo(0, currentScroll);

        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (currentScroll >= maxScroll || (window.innerHeight + window.scrollY) >= document.body.scrollHeight - 5) {
            stopAutoScroll();
            return;
        }

        scrollAnimationId = requestAnimationFrame(step);
    }

    scrollAnimationId = requestAnimationFrame(step);
}

// Dừng tự động lăn
function stopAutoScroll() {
    isAutoScrolling = false;
    if (scrollAnimationId) {
        cancelAnimationFrame(scrollAnimationId);
        scrollAnimationId = null;
    }
}

// BẬM / TẮT khi chạm vào bất cứ đâu trên màn hình (thông qua lớp phủ shield)
function toggleAutoScroll() {
    if (isAutoScrolling) {
        stopAutoScroll(); // Đang lăn -> Bấm vào là DỪNG NGAY
    } else {
        startAutoScrollToFooter(); // Đang dừng -> Bấm vào là LĂN TIẾP
    }
}

// Ngắt tự động lăn ngay khi người dùng chủ động lăn chuột tay hoặc vuốt màn hình
window.addEventListener('wheel', () => { if (isAutoScrolling) stopAutoScroll(); }, { passive: true });
window.addEventListener('touchmove', () => { if (isAutoScrolling) stopAutoScroll(); }, { passive: true });

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