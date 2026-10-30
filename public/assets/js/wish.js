async function loadLatestWishes() {
    const container = document.getElementById('wishesContainer');
    if (!container) return;

    try {
        const response = await fetch('https://uat1.akadigital.net/api/rsvp-list');
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            // Sắp xếp danh sách theo thời gian tạo mới nhất lên đầu
            const sortedGuests = result.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            // Lấy ra 3 lời chúc mới nhất
            const latestThree = sortedGuests.slice(0, 3);

            container.innerHTML = ''; 

            latestThree.forEach(guest => {
                const noteText = guest.note ? escapeHtml(guest.note) : 'Đã gửi lời chúc phúc đến dâu rể!';
                const timeAgo = formatTimeAgo(guest.created_at);
                const guestName = guest.guest_name ? guest.guest_name.trim() : '';

                // Kiểm tra nếu tên là "Gemma Pham" (không phân biệt hoa thường) thì gán nhãn Pinned
                const isPinned = guestName.toLowerCase() === 'gemma pham';

                // Giao diện và huy hiệu Pinned nếu là Gemma Pham
                const pinBadge = isPinned ? `
                    <span class="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-[#F8E1E7] text-[#8B4A62] px-2.5 py-0.5 rounded-full border border-[#d4b8cc]">
                        <i class="fas fa-thumbtack"></i> Pinned
                    </span>
                ` : '';

                // Viền và màu nền nổi bật hơn nếu được ghim
                const cardStyle = isPinned 
                    ? 'bg-[#FFF9FA] border-2 border-[#8B4A62]/50 shadow-md' 
                    : 'bg-white/90 border border-[#d4b8cc]/60 shadow-sm';

                const wishCard = `
                    <div class="p-4 rounded-2xl ${cardStyle} transition hover:shadow-md">
                        <div class="flex justify-between items-center mb-1">
                            <div class="flex items-center gap-2">
                                <span class="font-bold text-[#8B4A62] text-sm">${escapeHtml(guestName)}</span>
                                ${pinBadge}
                            </div>
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

// Các hàm phụ trợ (formatTimeAgo, escapeHtml) giữ nguyên như cũ
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

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}