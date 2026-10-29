async function handleRSVP(event) {
    event.preventDefault();

    const name = document.getElementById('guestName').value;
    const attendance = document.getElementById('attendance').value;
    const note = document.getElementById('guestNote').value;

    let payload = {
        guestName: name,
        attendance: attendance,
        note: note
    };

    // Nếu chọn tham dự thì lấy thêm thông tin phụ
    if (attendance === 'yes') {
        const guestCount = parseInt(document.getElementById('guestCount').value) || 1;
        const transport = document.getElementById('transport').value;
        let phone = document.getElementById('guestPhone').value.trim();
        const pickupLocation = (transport === 'xe_khach') ? document.getElementById('pickupLocation').value : 'Không đi xe khách';

        if (phone && phone.startsWith('0')) {
            phone = '+84' + phone.slice(1);
        }

        payload.guestCount = guestCount;
        payload.transportMethod = transport;
        payload.pickupLocation = pickupLocation;
        payload.phone = phone || 'N/A';
    } else {
        // Nếu không tham dự thì gán giá trị mặc định cho các trường ẩn
        payload.guestCount = 0;
        payload.transportMethod = 'Không tham dự';
        payload.pickupLocation = 'Không tham dự';
        payload.phone = 'N/A';
    }

    try {
        const response = await fetch('https://uat1.akadigital.net/api/rsvp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            document.getElementById('rsvpForm').reset();
            toggleAttendanceFields();
            document.getElementById('rsvpSuccess').classList.remove('hidden');
            document.getElementById('rsvpSuccess').scrollIntoView({ behavior: 'smooth' });
        } else {
            alert('Có lỗi xảy ra, vui lòng thử lại.');
        }
    } catch (error) {
        console.error('Network Error:', error);
        alert('Không thể kết nối đến máy chủ.');
    }
}