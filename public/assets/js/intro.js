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

    // 4. CHỜ 2 CÁNH THIỆP MỞ XONG HẲN (1000ms), sau đó BẮT ĐẦU TỰ ĐỘNG LĂN MƯỢT MÀ
    setTimeout(() => {
        startAutoScrollToFooter();
    }, 1050);

    // 5. Ẩn hẳn lớp phủ phong bì
    setTimeout(() => {
        envelope.classList.add('open-done');
    }, 1100);
}

// Hàm chạy tự động lăn sử dụng requestAnimationFrame (cực kỳ mượt và chắc chắn chạy)
function startAutoScrollToFooter() {
    isAutoScrolling = true;
    const btnIcon = document.getElementById('scrollIcon');
    if (btnIcon) btnIcon.className = "fas fa-pause text-xs";

    // Hủy animation cũ nếu đang chạy
    if (scrollAnimationId) cancelAnimationFrame(scrollAnimationId);

    function step() {
        // Nếu người dùng chủ động lăn chuột hoặc đã tới gần cuối trang thì dừng lại
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (!isAutoScrolling || window.scrollY >= maxScroll - 10) {
            stopAutoScroll();
            return;
        }

        // Tốc độ lăn (tăng số 1.2 lên nếu muốn lăn nhanh hơn, giảm xuống nếu muốn lăn chậm)
        window.scrollBy({ top: 1.2, behavior: 'linear' });
        
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
    const btnIcon = document.getElementById('scrollIcon');
    if (btnIcon) btnIcon.className = "fas fa-chevron-down text-xs";
}

// Bấm nút ở góc màn hình để Bật/Tắt
function toggleAutoScroll() {
    if (isAutoScrolling) {
        stopAutoScroll();
    } else {
        startAutoScrollToFooter();
    }
}

// Nếu người dùng chạm/lăn chuột tay vào màn hình thì tự động ngắt chế độ auto-scroll để tránh kẹt tay
window.addEventListener('wheel', () => {
    if (isAutoScrolling) stopAutoScroll();
}, { passive: true });

window.addEventListener('touchstart', () => {
    if (isAutoScrolling) stopAutoScroll();
}, { passive: true });

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