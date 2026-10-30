let isAutoScrolling = false;
let scrollInterval;

// Khóa cuộn trang khi vừa vào web
document.body.classList.add('envelope-locked');

function openWeddingInvitation() {
    const envelope = document.getElementById('introEnvelope');
    if (!envelope || envelope.classList.contains('opening')) return;

    // 1. Kích hoạt hiệu ứng mở 2 cánh thiệp
    envelope.classList.add('opening');
    
    // 2. Mở khóa cuộn trang
    document.body.classList.remove('envelope-locked');

    // 3. TỰ ĐỘNG PHÁT NHẠC (Do người dùng vừa bấm click mở thiệp nên trình duyệt sẽ cho phép phát)
    const audio = document.getElementById('weddingAudio');
    const musicIcon = document.getElementById('musicIcon');
    if (audio) {
        audio.play().then(() => {
            if (musicIcon) {
                musicIcon.className = "fas fa-compact-disc fa-spin"; // Đổi icon thành đĩa nhạc đang xoay
            }
        }).catch(err => {
            console.log("Trình duyệt chặn autoplay audio:", err);
        });
    }

    // 4. TỰ ĐỘNG TRƯỢT (Auto-scroll) xuống phần nội dung sau 600ms khi cửa mở
    setTimeout(() => {
        // Tìm chính xác section đầu tiên (như #story hoặc #couple hoặc class chứa nội dung)
        const targetSection = document.getElementById('story') || document.getElementById('couple') || document.querySelector('section');
        
        if (targetSection) {
            targetSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        } else {
            window.scrollBy({ 
                top: window.innerHeight * 0.85, 
                behavior: 'smooth' 
            });
        }
    }, 600);

    // 5. Ẩn hẳn lớp phủ phong bì sau khi hoàn tất animation (1 giây)
    setTimeout(() => {
        envelope.classList.add('open-done');
    }, 1000);
}

// Hàm bật/tắt Auto-Scroll khi bấm nút icon Play/Pause ở góc màn hình
function toggleAutoScroll() {
    isAutoScrolling = !isAutoScrolling;
    const btnIcon = document.getElementById('scrollIcon');

    if (isAutoScrolling) {
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
        if (btnIcon) btnIcon.className = "fas fa-play text-xs";
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