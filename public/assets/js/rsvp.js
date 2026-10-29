function handleRSVP(event) {
    event.preventDefault();

    // 1. Lấy dữ liệu từ form
    const name = document.getElementById('guestName').value;
    const phone = document.getElementById('guestPhone').value; // Dùng làm Identity chính
    const attendance = document.getElementById('attendance').value;
    const guestCount = parseInt(document.getElementById('guestCount').value) || 1;
    const transport = document.getElementById('transport').value;
    const pickupLocation = document.getElementById('pickupLocation').value;
    const note = document.getElementById('guestNote').value;

    if (typeof clevertap !== 'undefined') {
        // 2. Định danh User bằng onUserLogin (Dùng số điện thoại làm Phone/Identity)
        clevertap.onUserLogin.push({
            "Site": {
                "Name": name,
                "Phone": phone, // Số điện thoại là định danh chính
                "Identity": phone, // Đảm bảo gom đúng profile trên CleverTap
                "Wedding RSVP": attendance === 'yes' ? 'Attending' : 'Not Attending',
                "Transport Method": transport,
                "Pickup Location": pickupLocation
            }
        });

        // 3. Gửi Event RSVP ngay sau khi login
        const eventName = "Wedding RSVP Submitted";
        const eventProps = {
            "Guest Name": name,
            "Phone": phone,
            "Attendance Status": attendance,
            "Guest Count": guestCount,
            "Transport Method": transport,
            "Pickup Location": pickupLocation,
            "Note": note || "Không có",
            "Submission Time": new Date().toISOString()
        };

        clevertap.event.push(eventName, eventProps);
    } else {
        console.warn("CleverTap SDK chưa được khởi tạo.");
    }

    // 4. Hiển thị thông báo thành công và reset form
    document.getElementById('rsvpForm').reset();
    document.getElementById('rsvpSuccess').classList.remove('hidden');
    document.getElementById('rsvpSuccess').scrollIntoView({ behavior: 'smooth' });
}