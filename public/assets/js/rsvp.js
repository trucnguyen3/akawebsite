async function handleRSVP(event) {
    event.preventDefault();

    // 1. Lấy dữ liệu từ form
    const name = document.getElementById('guestName').value;
    let phone = document.getElementById('guestPhone').value.trim();
    const attendance = document.getElementById('attendance').value;
    const guestCount = parseInt(document.getElementById('guestCount').value) || 1;
    const transport = document.getElementById('transport').value;
    const pickupLocation = document.getElementById('pickupLocation').value;
    const note = document.getElementById('guestNote').value;

    // 2. Chuẩn hóa số điện thoại (Thay số 0 ở đầu thành +84)
    if (phone.startsWith('0')) {
        phone = '+84' + phone.slice(1);
    }

    // 3. Đóng gói dữ liệu gửi đi
    const payload = {
        guestName: name,
        phone: phone,
        attendance: attendance,
        guestCount: guestCount,
        transportMethod: transport,
        pickupLocation: pickupLocation,
        note: note || ""
    };

    try {
        // Gửi request API đến backend của bạn (Thay URL bằng endpoint thực tế)
        const response = await fetch('https://uat1.akadigital.net/api/rsvp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            // 4. Hiển thị thông báo thành công và reset form
            document.getElementById('rsvpForm').reset();
            document.getElementById('rsvpSuccess').classList.remove('hidden');
            document.getElementById('rsvpSuccess').scrollIntoView({ behavior: 'smooth' });
        } else {
            alert('Có lỗi xảy ra: ' + (result.message || 'Vui lòng thử lại sau.'));
        }
    } catch (error) {
        console.error('Network Error:', error);
        alert('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng.');
    }
}