// Khóa cuộn ngay khi tải trang
document.body.classList.add('envelope-locked');

function openWeddingInvitation() {
    const envelope = document.getElementById('introEnvelope');
    if (!envelope || envelope.classList.contains('opening')) return;

    // 1. Kích hoạt hiệu ứng mở 2 cánh thiệp
    envelope.classList.add('opening');
    
    // 2. Mở khóa cuộn trang
    document.body.classList.remove('envelope-locked');

    // 3. Sau 600ms (khi cửa đang mở ra), tự động trượt mượt mà xuống phần nội dung chính
    setTimeout(() => {
        // Tìm đến section nội dung chính (ví dụ: id="story" hoặc section đầu tiên sau header)
        const targetSection = document.getElementById('story') || document.getElementById('couple') || document.querySelector('section');
        
        if (targetSection) {
            targetSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        } else {
            // Hoặc trượt xuống đúng bằng chiều cao màn hình nếu không tìm thấy ID
            window.scrollBy({ 
                top: window.innerHeight * 0.8, 
                behavior: 'smooth' 
            });
        }
    }, 600);

    // 4. Ẩn hẳn lớp phủ phong bì sau khi hoàn tất animation
    setTimeout(() => {
        envelope.classList.add('open-done');
    }, 1000);
}

let isAutoScrolling = false;
let scrollInterval;

function toggleAutoScroll() {
    isAutoScrolling = !isAutoScrolling;
    const btnIcon = document.getElementById('scrollIcon');

    if (isAutoScrolling) {
        if (btnIcon) btnIcon.className = "fas fa-pause";
        scrollInterval = setInterval(() => {
            // Kiểm tra nếu trượt đến cuối trang thì dừng lại
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 10) {
                toggleAutoScroll();
                return;
            }
            window.scrollBy({ top: 1, behavior: 'linear' });
        }, 25); // Tốc độ trượt (số ms càng nhỏ trượt càng nhanh)
    } else {
        if (btnIcon) btnIcon.className = "fas fa-play";
        clearInterval(scrollInterval);
    }
}