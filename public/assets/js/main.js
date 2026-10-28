smartech('create', 'ADGMOT35CHFLVDHBJNIG50K96BSUH1PDDQFBSPLEV97HGG26AH0G');
smartech('register', '183e1413a1409529a3359628eac41949');
smartech('identify', '');        

var clevertap = { event: [], profile: [], account: [], onUserLogin: [], notifications: [], privacy: [] };
        // replace with the CLEVERTAP_ACCOUNT_ID with the actual ACCOUNT ID value from your Dashboard -> Settings page
        clevertap.account.push({ "id": "6Z4-44W-667Z" }, "sg1");
        clevertap.privacy.push({ optOut: false }); //set the flag to true, if the user of the device opts out of sharing their data
        clevertap.privacy.push({ useIP: false }); //set the flag to true, if the user agrees to share their IP data
        clevertap.privacy.push({ serviceWorkerPath: "/sw.js" });
        clevertap.notifications.push({
            "titleText": "Would you like to receive Push Notifications?",
            "bodyText": "We promise to only send you relevant content and give you updates on your transactions",
            "okButtonText": "Sign me up!",
            "rejectButtonText": "No thanks",
            "okButtonColor": "#F28046",
            "askAgainTimeInSeconds": 5,
            "serviceWorkerPath": "/sw.js" // path to your custom service worker file
        });
        (function () {
            var wzrk = document.createElement('script');
            wzrk.type = 'text/javascript';
            wzrk.async = true;
            wzrk.src = ('https:' == document.location.protocol ? 'https://d2r1yp2w7bby2u.cloudfront.net' : 'http://static.clevertap.com') + '/js/clevertap.min.js';
            var s = document.getElementsByTagName('script')[0];
            s.parentNode.insertBefore(wzrk, s);
})();
        

let currentBookingState = {};

// Dữ liệu mock các chuyến xe khách & máy bay theo tuyến
const MOCK_TRIPS = [
    // Tuyến Hồ Chí Minh -> Long An (Xe khách)
    {
        type: 'bus',
        from: 'Hồ Chí Minh (SGN)',
        to: 'Long An',
        brand: 'Xe Khách Limousine',
        code: 'BUS-LA01',
        depTime: '08:00',
        arrTime: '09:30',
        duration: '1h 30m',
        fromName: 'Hồ Chí Minh',
        toName: 'Long An',
        price: 180000,
        oldPrice: 250000,
        badge: 'Đưa đón tận nơi'
    },
    {
        type: 'bus',
        from: 'Hồ Chí Minh (SGN)',
        to: 'Long An',
        brand: 'Phương Trang Limousine',
        code: 'FUTA-LA02',
        depTime: '14:00',
        arrTime: '15:30',
        duration: '1h 30m',
        fromName: 'Hồ Chí Minh',
        toName: 'Long An',
        price: 160000,
        oldPrice: null,
        badge: 'Xuất bến mỗi 30p'
    },
    // Tuyến Hà Nội -> Đà Nẵng (Máy bay)
    {
        type: 'flight',
        from: 'Hà Nội (HAN)',
        to: 'Đà Nẵng (DAD)',
        brand: 'Bamboo Airways',
        code: 'QH-201',
        depTime: '09:45',
        arrTime: '11:15',
        duration: '1h 30m',
        fromName: 'HAN',
        toName: 'DAD',
        price: 2500000,
        oldPrice: 3700000,
        badge: 'Giá tốt nhất'
    },
    {
        type: 'flight',
        from: 'Hà Nội (HAN)',
        to: 'Đà Nẵng (DAD)',
        brand: 'Vietjet Air',
        code: 'VJ-512',
        depTime: '20:15',
        arrTime: '21:40',
        duration: '1h 25m',
        fromName: 'HAN',
        toName: 'DAD',
        price: 1900000,
        oldPrice: null,
        badge: 'Eco'
    },
    // Tuyến Hồ Chí Minh -> Phú Quốc (Máy bay)
    {
        type: 'flight',
        from: 'Hồ Chí Minh (SGN)',
        to: 'Phú Quốc (PQC)',
        brand: 'Vietnam Airlines',
        code: 'VN-1823',
        depTime: '10:00',
        arrTime: '11:05',
        duration: '1h 05m',
        fromName: 'SGN',
        toName: 'PQC',
        price: 2100000,
        oldPrice: 2800000,
        badge: 'Chuyến bay phổ biến'
    }
];

document.addEventListener('DOMContentLoaded', () => {
    if (typeof checkSession === 'function') checkSession();
    if (typeof initChatEvents === 'function') initChatEvents();

    const searchBtn = document.querySelector('.hero-gradient button');
    if (searchBtn) {
        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            performSearch();
        });
    }
});

// Hàm thực hiện tìm kiếm và render dữ liệu động
function performSearch() {
    const fromVal = document.getElementById('searchFrom').value;
    const toVal = document.getElementById('searchTo').value;
    const searchResultsSection = document.getElementById('searchResultsSection');
    const resultsList = document.getElementById('resultsList');
    const resultTitle = document.getElementById('searchResultsTitle');

    if (fromVal === toVal) {
        alert("Điểm đi và Điểm đến không được trùng nhau!");
        searchResultsSection?.classList.add('hidden');
        return;
    }

    // Lọc chuyến đi thỏa điều kiện từ danh sách MOCK_TRIPS
    let matchedTrips = MOCK_TRIPS.filter(trip => 
        trip.from.toLowerCase().includes(fromVal.toLowerCase().split(' ')[0]) &&
        trip.to.toLowerCase().includes(toVal.toLowerCase().split(' ')[0])
    );

    // Nếu không có chuyến cố định trong mock data, tự tạo 1 chuyến động linh hoạt
    if (matchedTrips.length === 0) {
        const isBusRoute = toVal.includes('Long An') || fromVal.includes('Long An');
        matchedTrips = [
            {
                type: isBusRoute ? 'bus' : 'flight',
                from: fromVal,
                to: toVal,
                brand: isBusRoute ? 'Xe Khách Chất Lượng Cao' : 'SkyPremium Airlines',
                code: isBusRoute ? 'BUS-EXPRESS' : 'SP-888',
                depTime: '09:00',
                arrTime: '11:00',
                duration: '2h 00m',
                fromName: fromVal.split(' ')[0],
                toName: toVal.split(' ')[0],
                price: isBusRoute ? 200000 : 1850000,
                oldPrice: isBusRoute ? 250000 : 2200000,
                badge: isBusRoute ? 'Đưa đón tận nơi' : 'Bay thẳng'
            }
        ];
    }

    // Cập nhật tiêu đề & Render danh sách HTML động
    if (resultTitle) {
        resultTitle.innerText = `Kết quả tìm kiếm: ${fromVal} ➔ ${toVal} (${matchedTrips.length} kết quả)`;
    }

    resultsList.innerHTML = matchedTrips.map(trip => renderTripCardHTML(trip)).join('');
    searchResultsSection.classList.remove('hidden');
    searchResultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Hàm sinh mã HTML cho từng card chuyến đi
function renderTripCardHTML(trip) {
    const isBus = trip.type === 'bus';
    const isLongAnRoute = trip.to.toLowerCase().includes('long an'); // Kiểm tra nếu chuyến xe/bay về Long An

    const iconClass = isBus ? 'fa-bus' : 'fa-plane';
    const iconBg = isBus ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600';
    const badgeBg = isBus ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700';
    const borderClass = isBus ? 'border-amber-200' : 'border-slate-100';
    const priceColor = isBus ? 'text-amber-600' : 'text-blue-600';
    const btnHover = isBus ? 'hover:bg-amber-600' : 'hover:bg-blue-600';
    const btnText = isBus ? 'Chọn vé xe' : 'Chọn chuyến';

    // Đã thêm nút bấm qua trang khác cho tuyến Long An
    const externalLinkBtnHTML = isLongAnRoute ? `
        <a href="https://uat1.akadigital.net/tr-wedding" target="_blank" class="w-full">
            <button class="w-full py-2 px-4 bg-amber-100 text-amber-800 hover:bg-amber-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1">
                <i class="fas fa-external-link-alt"></i> Thông tin lịch trình Long An
            </button>
        </a>
    ` : '';

    return `
    <div class="flight-card bg-white p-6 rounded-[1.5rem] border ${borderClass} transition-all duration-300 shadow-sm">
        <div class="flex flex-col md:flex-row items-center gap-8">
            <div class="flex items-center gap-4 min-w-[180px]">
                <div class="w-12 h-12 ${iconBg} rounded-full flex items-center justify-center">
                    <i class="fas ${iconClass} text-xl"></i>
                </div>
                <div>
                    <h4 class="font-bold text-slate-800 uppercase tracking-tight">${escapeHTML(trip.brand)}</h4>
                    <span class="text-xs font-medium px-2 py-1 ${badgeBg} rounded-md">${escapeHTML(trip.code)} • ${escapeHTML(trip.badge)}</span>
                </div>
            </div>

            <div class="flex-1 flex items-center justify-between gap-4 w-full">
                <div class="text-center">
                    <span class="text-2xl font-black text-slate-800 leading-none">${trip.depTime}</span>
                    <p class="text-sm font-bold text-slate-400 mt-1 uppercase">${escapeHTML(trip.fromName)}</p>
                </div>

                <div class="flex-1 flex flex-col items-center">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">${trip.duration}</span>
                    <div class="w-full flex items-center">
                        <div class="w-2 h-2 rounded-full border-2 border-slate-400 bg-white"></div>
                        <div class="flex-1 h-[2px] border-t-2 border-dashed border-slate-300"></div>
                        <i class="fas ${iconClass} text-slate-400 mx-2 text-sm"></i>
                        <div class="flex-1 h-[2px] border-t-2 border-dashed border-slate-300"></div>
                        <div class="w-2 h-2 rounded-full bg-slate-400"></div>
                    </div>
                </div>

                <div class="text-center">
                    <span class="text-2xl font-black text-slate-800 leading-none">${trip.arrTime}</span>
                    <p class="text-sm font-bold text-slate-400 mt-1 uppercase">${escapeHTML(trip.toName)}</p>
                </div>
            </div>

            <div class="flex flex-col items-end min-w-[170px] border-l border-slate-100 pl-6 gap-2">
                ${trip.oldPrice ? `<span class="text-xs font-bold text-slate-400 line-through">${Number(trip.oldPrice).toLocaleString('vi-VN')}đ</span>` : ''}
                <span class="text-2xl font-black ${priceColor} tracking-tight">${Number(trip.price).toLocaleString('vi-VN')}đ</span>
                
                <!-- Nút Đặt vé mặc định -->
                <button onclick="selectFlight('${escapeHTML(trip.brand)}', '${escapeHTML(trip.code)}', ${trip.price})"
                    class="w-full py-3 px-6 bg-slate-900 ${btnHover} text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-slate-200">
                    ${btnText}
                </button>

                <!-- Hiển thị nút Chuyển trang riêng nếu chuyến đi tới Long An -->
                ${externalLinkBtnHTML}
            </div>
        </div>
    </div>
    `;
}

// Giữ nguyên các hàm selectFlight, goToPayment, confirmPurchase (gửi API PostgreSQL) như trước...
function selectFlight(flightName, flightCode, price) {
    const tripType = document.querySelector('input[name="trip"]:checked')?.value || 'roundtrip';
    const from = document.getElementById('searchFrom').value;
    const to = document.getElementById('searchTo').value;
    const depDate = document.getElementById('searchDepDate').value;
    const retDate = tripType === 'roundtrip' ? document.getElementById('searchRetDate').value : null;

    currentBookingState = {
        tripType,
        flightName,
        flightCode,
        departureCity: from,
        arrivalCity: to,
        departureDate: depDate,
        returnDate: retDate,
        totalAmount: price,
        passengers: []
    };

    const flightInfoEl = document.getElementById('selectedFlightInfo');
    if (flightInfoEl) {
        flightInfoEl.innerText = `${flightName} (${flightCode}) • ${from} ➔ ${to} • ${tripType === 'roundtrip' ? 'Khứ hồi' : 'Một chiều'}`;
    }

    document.getElementById('stepPassengers')?.classList.remove('hidden');
    document.getElementById('stepPayment')?.classList.add('hidden');
    document.getElementById('stepSuccess')?.classList.add('hidden');
    document.getElementById('bookingModal')?.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function goToPayment(e) {
    e.preventDefault();

    currentBookingState.passengers = [
        {
            fullName: document.getElementById('p1_name').value.trim(),
            gender: document.getElementById('p1_gender').value,
            dob: document.getElementById('p1_dob').value,
            passportId: document.getElementById('p1_passport').value.trim()
        },
        {
            fullName: document.getElementById('p2_name').value.trim(),
            gender: document.getElementById('p2_gender').value,
            dob: document.getElementById('p2_dob').value,
            passportId: document.getElementById('p2_passport').value.trim()
        }
    ];

    const totalAmtEl = document.getElementById('paymentTotalAmount');
    if (totalAmtEl) {
        totalAmtEl.innerText = Number(currentBookingState.totalAmount).toLocaleString('vi-VN') + 'đ';
    }

    document.getElementById('stepPassengers')?.classList.add('hidden');
    document.getElementById('stepPayment')?.classList.remove('hidden');
}

function backToPassengers() {
    document.getElementById('stepPayment')?.classList.add('hidden');
    document.getElementById('stepPassengers')?.classList.remove('hidden');
}

async function confirmPurchase() {
    const btn = document.getElementById('btnConfirmPurchase');
    if (btn) {
        btn.disabled = true;
        btn.innerText = "Đang xử lý...";
    }

    const selectedPayment = document.querySelector('input[name="paymentMethod"]:checked').value;
    currentBookingState.paymentMethod = selectedPayment;

    const userEmail = window.currentUserEmail || "khachhang@gmail.com";

    const payload = {
        userId: userEmail,
        tripType: currentBookingState.tripType,
        flightName: currentBookingState.flightName,
        flightCode: currentBookingState.flightCode,
        departureCity: currentBookingState.departureCity,
        arrivalCity: currentBookingState.arrivalCity,
        departureDate: currentBookingState.departureDate,
        returnDate: currentBookingState.returnDate,
        totalAmount: currentBookingState.totalAmount,
        paymentMethod: currentBookingState.paymentMethod,
        passengers: currentBookingState.passengers
    };

    try {
        const response = await fetch('https://uat1.akadigital.net/api/flights/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // KIỂM TRA NẾU ĐIỂM ĐẾN LÀ LONG AN THÌ CHUYỂN HƯỚNG SANG TRANG TR-WEDDING
            const isLongAnRoute = currentBookingState.arrivalCity && currentBookingState.arrivalCity.toLowerCase().includes('long an');

            if (isLongAnRoute) {
                alert("Đặt vé xe về Long An thành công! Đang chuyển hướng sang trang chi tiết...");
                window.location.href = "https://uat1.akadigital.net/tr-wedding";
                return;
            }

            // Nếu không phải Long An thì hiển thị modal thành công thông thường
            document.getElementById('stepPayment')?.classList.add('hidden');
            document.getElementById('stepSuccess')?.classList.remove('hidden');

            document.getElementById('resBookingRef').innerText = result.data.booking_reference;
            document.getElementById('resPassengers').innerText = payload.passengers.map(p => p.fullName).join(', ');
            document.getElementById('resAmount').innerText = Number(payload.totalAmount).toLocaleString('vi-VN') + 'đ';
        } else {
            alert(result.message || "Xảy ra lỗi khi tạo đơn đặt vé!");
        }
    } catch (err) {
        console.error("Lỗi đặt vé:", err);
        alert("Lỗi kết nối máy chủ!");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerText = "Xác nhận & Thanh toán";
        }
    }
}

function closeModal() {
    document.getElementById('bookingModal')?.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

async function openMyBookings() {
    const modal = document.getElementById('myBookingsModal');
    const listContainer = document.getElementById('myBookingsList');

    modal?.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    const userEmail = window.currentUserEmail;
    if (!userEmail) {
        listContainer.innerHTML = `<p class="text-center text-red-500 py-4">Vui lòng đăng nhập để xem lịch sử đặt vé!</p>`;
        return;
    }

    listContainer.innerHTML = `<p class="text-center text-slate-400 py-8">Đang tải danh sách vé...</p>`;

    try {
        const res = await fetch(`https://uat1.akadigital.net/api/flights/my-bookings?email=${encodeURIComponent(userEmail)}`, {
            method: 'GET',
            credentials: 'include'
        });
        const result = await res.json();

        if (result.success && result.data.length > 0) {
            listContainer.innerHTML = result.data.map(booking => {
                // Parse mảng hành khách từ JSONB
                let passengersArr = [];
                try {
                    passengersArr = typeof booking.passengers === 'string' ? JSON.parse(booking.passengers) : booking.passengers;
                } catch (e) { passengersArr = []; }

                const passengersStr = passengersArr.map(p => p.fullName).join(', ');
                const isBus = booking.flight_code && booking.flight_code.startsWith('BUS');
                const badgeColor = isBus ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700';

                return `
                <div class="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="font-black text-blue-600">${escapeHTML(booking.booking_reference)}</span>
                            <span class="text-[10px] font-bold px-2 py-0.5 ${badgeColor} rounded">${escapeHTML(booking.flight_name)} (${escapeHTML(booking.flight_code)})</span>
                        </div>
                        <p class="text-sm font-bold text-slate-800">${escapeHTML(booking.departure_city)} ➔ ${escapeHTML(booking.arrival_city)}</p>
                        <p class="text-xs text-slate-500 mt-1">Hành khách: <span class="font-medium text-slate-700">${escapeHTML(passengersStr)}</span></p>
                        <p class="text-xs text-slate-400 mt-0.5">Ngày đi: ${escapeHTML(booking.departure_date)}</p>
                    </div>
                    <div class="text-right w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-200">
                        <span class="text-lg font-black text-slate-900">${Number(booking.total_amount).toLocaleString('vi-VN')}đ</span>
                        <p class="text-[11px] font-bold text-green-600 mt-1 uppercase">Đã thanh toán</p>
                    </div>
                </div>
                `;
            }).join('');
        } else {
            listContainer.innerHTML = `<p class="text-center text-slate-500 py-8">Bạn chưa đặt chuyến đi nào.</p>`;
        }
    } catch (err) {
        console.error("Lỗi tải lịch sử:", err);
        listContainer.innerHTML = `<p class="text-center text-red-500 py-4">Không thể kết nối đến máy chủ để tải lịch sử vé.</p>`;
    }
}

function closeMyBookings() {
    const modal = document.getElementById('myBookingsModal');
    modal?.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// Bổ sung đóng modal khi click ra vùng ngoài
window.onclick = function (event) {
    const authModal = document.getElementById('auth-modal');
    const bookingModal = document.getElementById('bookingModal');
    const myBookingsModal = document.getElementById('myBookingsModal');

    if (event.target == authModal) {
        if (typeof closeAuth === 'function') closeAuth();
    }
    if (event.target == bookingModal) {
        closeModal();
    }
    if (event.target == myBookingsModal) {
        closeMyBookings();
    }
};