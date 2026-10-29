        // COUNTDOWN TIMER LOGIC
        const weddingDate = new Date("November 28, 2026 09:00:00").getTime();

        function updateCountdown() {
            const now = new Date().getTime();
            const distance = weddingDate - now;

            if (distance < 0) {
                document.getElementById("countdown").innerHTML = "<div class='text-gold text-2xl font-serif col-span-4'>Hôm nay là Ngày Trọng Đại!</div>";
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            document.getElementById("days").innerText = days < 10 ? '0' + days : days;
            document.getElementById("hours").innerText = hours < 10 ? '0' + hours : hours;
            document.getElementById("minutes").innerText = minutes < 10 ? '0' + minutes : minutes;
            document.getElementById("seconds").innerText = seconds < 10 ? '0' + seconds : seconds;
        }

        setInterval(updateCountdown, 1000);
        updateCountdown();

        // LIGHTBOX LOGIC
        function openLightbox(imgSrc) {
            document.getElementById('lightboxImg').src = imgSrc;
            document.getElementById('lightbox').classList.remove('hidden');
        }

        function closeLightbox() {
            document.getElementById('lightbox').classList.add('hidden');
        }

        // AUDIO TOGGLE LOGIC
        let isPlaying = false;
        const audio = document.getElementById('weddingAudio');
        const icon = document.getElementById('musicIcon');

        function toggleAudio() {
            if (isPlaying) {
                audio.pause();
                icon.className = 'fas fa-music';
            } else {
                audio.play().catch(e => console.log("Audio play blocked by browser."));
                icon.className = 'fas fa-pause';
            }
            isPlaying = !isPlaying;
        }