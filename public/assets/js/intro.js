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

    // 4. CHỜ 2 CÁNH THIỆP MỞ XONG HẲN (1000ms), sau đó BẮT ĐẦU TỰ ĐỘNG LĂN
    setTimeout(() => {
        startAutoScrollToFooter();
    }, 1100);

    // 5. Ẩn hẳn lớp phủ phong bì
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

        currentScroll += 2; // Tốc độ lăn (tăng/giảm số này để điều chỉnh tốc độ)
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

// BẤM VÀO BẤT CỨ ĐÂU TRÊN MÀN HÌNH ĐỂ BẬT/TẮT AUTO-SCROLL
document.addEventListener('click', (e) => {
    // Không kích hoạt nếu đang trong màn hình mở thiệp hoặc bấm vào nút nhạc / form RSVP / Lightbox ảnh
    if (document.body.classList.contains('envelope-locked')) return;
    if (e.target.closest('#musicToggle') || e.target.closest('form') || e.target.closest('.lightbox')) return;

    if (isAutoScrolling) {
        stopAutoScroll();
    } else {
        startAutoScrollToFooter();
    }
});

// Ngắt tự động lăn ngay khi người dùng chủ động lăn chuột tay hoặc chạm vuốt
window.addEventListener('wheel', () => { if (isAutoScrolling) stopAutoScroll(); }, { passive: true });
window.addEventListener('touchstart', () => { if (isAutoScrolling) stopAutoScroll(); }, { passive: true });

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