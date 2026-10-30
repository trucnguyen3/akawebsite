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
    }, 50);
}

// Hàm tự động lăn bằng tọa độ tuyệt đối (Cực kỳ mạnh và chắc chắn chạy)
function startAutoScrollToFooter() {
    isAutoScrolling = true;
    const btnIcon = document.getElementById('scrollIcon');
    if (btnIcon) btnIcon.className = "fas fa-pause text-xs";

    if (scrollAnimationId) cancelAnimationFrame(scrollAnimationId);

    // Lấy vị trí cuộn hiện tại
    let currentScroll = window.pageYOffset || document.documentElement.scrollTop;

    function step() {
        if (!isAutoScrolling) return;

        // Tăng tọa độ lên 2 pixel mỗi khung hình (tăng số này nếu muốn lăn nhanh hơn)
        currentScroll += 2;
        window.scrollTo(0, currentScroll);

        // Tính toán điểm dừng khi đã tới gần đáy trang
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

// Ngắt tự động lăn ngay khi người dùng chạm tay hoặc lăn chuột
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