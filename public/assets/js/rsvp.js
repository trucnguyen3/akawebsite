function handleRSVP(event) {
    event.preventDefault();

    // 1. Lấy dữ liệu từ form
    const name = document.getElementById('guestName').value;
    const attendance = document.getElementById('attendance').value;
    const guestCount = parseInt(document.getElementById('guestCount').value) || 1;
    const transport = document.getElementById('transport').value;
    const pickupLocation = document.getElementById('pickupLocation').value;
    const note = document.getElementById('guestNote').value;

    // 2. Định nghĩa Event Name trên CleverTap
    const eventName = "Wedding RSVP Submitted";

    // 3. Đóng gói dữ liệu
    const eventProps = {
        "Guest Name": name,
        "Attendance Status": attendance, // 'yes' hoặc 'no'
        "Guest Count": guestCount,
        "Transport Method": transport,
        "Pickup Location": pickupLocation,
        "Note": note || "Không có",
        "Submission Time": new Date().toISOString()
    };

    // 4. Gửi lên CleverTap SDK
    if (typeof clevertap !== 'undefined') {
        clevertap.event.push(eventName, eventProps);
        
        // Cập nhật User Profile trên CleverTap
        clevertap.profile.push({
            "Site": {
                "Name": name,
                "Wedding RSVP": attendance === 'yes' ? 'Attending' : 'Not Attending',
                "Pickup Location": pickupLocation
            }
        });
    } else {
        console.warn("CleverTap SDK chưa được khởi tạo.");
    }

    // 5. Hiển thị thông báo thành công và reset form
    document.getElementById('rsvpForm').reset();
    document.getElementById('rsvpSuccess').classList.remove('hidden');
    document.getElementById('rsvpSuccess').scrollIntoView({ behavior: 'smooth' });
}