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

document.addEventListener('DOMContentLoaded', () => {
    if (typeof checkSession === 'function') checkSession();
    if (typeof initChatEvents === 'function') initChatEvents();
});

// Xử lý loại vé (Khứ hồi / Một chiều)
function handleTripTypeChange() {
    const tripType = document.querySelector('input[name="trip"]:checked').value;
    const returnContainer = document.getElementById('returnDateContainer');
    if (returnContainer) {
        returnContainer.style.display = tripType === 'oneway' ? 'none' : 'block';
    }
}

// Chọn chuyến bay và mở modal nhập thông tin 2 người
function selectFlight(flightName, flightCode, price) {
    const tripType = document.querySelector('input[name="trip"]:checked').value;
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

// Đẩy dữ liệu xuống Backend theo đúng format chuẩn API yêu cầu
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

function closeConsent() {
    const banner = document.getElementById('consent-banner');
    if (banner) banner.style.display = 'none';
    localStorage.setItem('user-consent', 'accepted');
}

window.onload = () => {
    if (localStorage.getItem('user-consent')) {
        const banner = document.getElementById('consent-banner');
        if (banner) banner.style.display = 'none';
    }
};

window.onclick = function (event) {
    const authModal = document.getElementById('auth-modal');
    const bookingModal = document.getElementById('bookingModal');
    if (event.target == authModal) {
        if (typeof closeAuth === 'function') closeAuth();
    }
    if (event.target == bookingModal) {
        closeModal();
    }
};

async function handleShare() {
    const shareUrl = 'https://uat1.akadigital.net/download';
    try {
        if (navigator.share) {
            await navigator.share({ url: shareUrl });
        } else {
            navigator.clipboard.writeText(shareUrl);
        }
    } catch (err) {
        console.log('Lỗi:', err);
    }
}