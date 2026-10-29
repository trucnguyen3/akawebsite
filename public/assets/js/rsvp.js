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

function handleRSVP(event) {
    event.preventDefault();

    // 1. Lấy dữ liệu từ form
    const name = document.getElementById('guestName').value;
    const phone = document.getElementById('guestPhone').value;
    const attendance = document.getElementById('attendance').value;
    const guestCount = parseInt(document.getElementById('guestCount').value) || 1;
    const transport = document.getElementById('transport').value;
    const pickupLocation = document.getElementById('pickupLocation').value;
    const note = document.getElementById('guestNote').value;

    if (typeof clevertap !== 'undefined') {
        // 2. Định danh User bằng onUserLogin (Dùng số điện thoại làm Phone/Identity)

        const randomString = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
        const generatedIdentity = `${randomString}@gmail.com`;

        clevertap.onUserLogin.push({
            "Site": {
                "Name": name,
                "Phone": phone,
                "Email": generatedIdentity,
                "Identity": randomString,
                "MSG-email": true,
                "MSG-push": true,
                "MSG-sms": false,
                "MSG-whatsapp": false
            }
        });

        // 3. Gửi Event RSVP ngay sau khi login
        const eventName = "Wedding RSVP Submitted";
        const eventProps = {
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