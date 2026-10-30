async function loadLatestWishes() {
    const container = document.getElementById('wishesContainer');
    if (!container) return;

    try {
        console.log('Đang gọi API lấy danh sách RSVP...');
        const response = await fetch('https://uat1.akadigital.net/api/rsvp-list');
        const result = await response.json();
        
        // In dữ liệu ra Console để kiểm tra cấu trúc chính xác
        console.log('Dữ liệu thô nhận từ API:', result);

        // Xử lý linh hoạt mọi cấu trúc trả về từ API (dù là mảng trực tiếp hay nằm trong object)
        let guestList = [];
        if (Array.isArray(result)) {
            guestList = result;
        } else if (result.data && Array.isArray(result.data)) {
            guestList = result.data;
        } else if (result.list && Array.isArray(result.list)) {
            guestList = result.list;
        }

        if (guestList.length > 0) {
            // Sắp xếp theo thời gian mới nhất (hỗ trợ cả trường created_at hoặc thời gian khác)
            const sortedGuests = guestList.sort((a, b) => {
                const timeA = new Date(a.created_at || a.createdAt || a.id || 0);
                const timeB = new Date(b.created_at || b.createdAt || b.id || 0);
                return timeB - timeA;
            });
            
            const latestThree = sortedGuests.slice(0, 3);
            container.innerHTML = ''; 

            latestThree.forEach(guest => {
                // Hỗ trợ linh hoạt tên trường dữ liệu từ database (guest_name hoặc name, note hoặc message)
                const noteText = guest.note || guest.message || guest. lời_chúc || 'Đã gửi lời chúc phúc đến dâu rể!';
                const timeRaw = guest.created_at || guest.createdAt || new Date();
                const timeAgo = formatTimeAgo(timeRaw);
                const guestName = (guest.guest_name || guest.name || guest.fullname || 'Khách mời').trim();

                const isPinned = guestName.toLowerCase() === 'gemma pham';

                const pinBadge = isPinned ? `
                    <span class="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-[#F8E1E7] text-[#8B4A62] px-2.5 py-0.5 rounded-full border border-[#d4b8cc]">
                        <i class="fas fa-thumbtack"></i> Pinned
                    </span>
                ` : '';

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
                        <p class="text-gray-700 text-sm italic">"${escapeHtml(noteText)}"</p>
                    </div>
                `;
                container.innerHTML += wishCard;
            });
        } else {
            container.innerHTML = `<div class="p-4 text-center text-gray-500 text-sm">Chưa có lời chúc nào được gửi. Hãy là người đầu tiên gửi lời chúc nhé!</div>`;
        }
    } catch (error) {
        console.error('Lỗi khi fetch API lời chúc:', error);
        // Fallback hiển thị mẫu nếu fetch lỗi hoặc mạng treo
        container.innerHTML = `
            <div class="p-4 rounded-2xl bg-[#FFF9FA] border-2 border-[#8B4A62]/50 shadow-md transition">
                <div class="flex justify-between items-center mb-1">
                    <div class="flex items-center gap-2">
                        <span class="font-bold text-[#8B4A62] text-sm">Gemma Pham</span>
                        <span class="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-[#F8E1E7] text-[#8B4A62] px-2.5 py-0.5 rounded-full border border-[#d4b8cc]">
                            <i class="fas fa-thumbtack"></i> Pinned
                        </span>
                    </div>
                    <span class="text-xs text-gray-400">Vừa xong</span>
                </div>
                <p class="text-gray-700 text-sm italic">"Chúc hai em trăm năm hạnh phúc, sớm sinh quý tử nhé!"</p>
            </div>
        `;
    }
}

function formatTimeAgo(dateString) {
    if (!dateString) return 'Vừa xong';
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (isNaN(diffInSeconds) || diffInSeconds < 60) return 'Vừa xong';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} ngày trước`;
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

document.addEventListener('DOMContentLoaded', loadLatestWishes);