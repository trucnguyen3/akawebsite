async function loadLatestWishes() {
    const container = document.getElementById('wishesContainer');
    if (!container) return;

    try {
        // Gọi đến API lấy danh sách RSVP của bạn (thay URL này bằng API thực tế của bạn)
        const response = await fetch('https://uat1.akadigital.net/api/rsvp-list');
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            // Sắp xếp danh sách theo thời gian tạo mới nhất lên đầu (descending)
            const sortedGuests = result.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            // Lấy ra đúng 3 lời chúc mới nhất
            const latestThree = sortedGuests.slice(0, 3);

            container.innerHTML = ''; // Xóa trạng thái loading

            latestThree.forEach(guest => {
                // Chỉ hiển thị lời chúc nếu khách có nhập note/lời chúc
                const noteText = guest.note ? escapeHtml(guest.note) : 'Đã gửi lời chúc phúc đến dâu rể!';
                const timeAgo = formatTimeAgo(guest.created_at);

                const wishCard = `
                    <div class="p-4 rounded-2xl bg-white/90 border border-[#d4b8cc]/60 shadow-sm transition hover:shadow-md">
                        <div class="flex justify-between items-center mb-1">
                            <span class="font-bold text-[#8B4A62] text-sm">${escapeHtml(guest.guest_name)}</span>
                            <span class="text-xs text-gray-400">${timeAgo}</span>
                        </div>
                        <p class="text-gray-700 text-sm italic">"${noteText}"</p>
                    </div>
                `;
                container.innerHTML += wishCard;
            });
        } else {
            container.innerHTML = `<div class="p-4 text-center text-gray-500 text-sm">Chưa có lời chúc nào được gửi. Hãy là người đầu tiên gửi lời chúc nhé!</div>`;
        }
    } catch (error) {
        console.error('Lỗi khi tải lời chúc:', error);
        container.innerHTML = `<div class="p-4 text-center text-red-700 text-sm">Không thể tải danh sách lời chúc từ máy chủ.</div>`;
    }
}

// Hàm hỗ trợ tính thời gian tương đối (ví dụ: "5 phút trước", "Vừa xong")
function formatTimeAgo(dateString) {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return 'Vừa xong';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} ngày trước`;
}

// Hàm chống XSS bảo mật cơ bản khi render text
function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// Gọi hàm load khi trang được tải xong
document.addEventListener('DOMContentLoaded', loadLatestWishes);