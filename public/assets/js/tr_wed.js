        // COUNTDOWN TIMER LOGIC
        const weddingDate = new Date("Dec 20, 2026 09:00:00").getTime();

        function updateCountdown() {
            const countdownEl = document.getElementById("countdown");
            if (!countdownEl) return;

            const now = new Date().getTime();
            const distance = weddingDate - now;

            if (distance < 0) {
                countdownEl.innerHTML = "<div class='text-gold text-2xl font-serif col-span-4'>Hôm nay là Ngày Trọng Đại!</div>";
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            const daysEl = document.getElementById("days");
            const hoursEl = document.getElementById("hours");
            const minutesEl = document.getElementById("minutes");
            const secondsEl = document.getElementById("seconds");

            if (daysEl) daysEl.innerText = days < 10 ? '0' + days : days;
            if (hoursEl) hoursEl.innerText = hours < 10 ? '0' + hours : hours;
            if (minutesEl) minutesEl.innerText = minutes < 10 ? '0' + minutes : minutes;
            if (secondsEl) secondsEl.innerText = seconds < 10 ? '0' + seconds : seconds;
        }

        // Đợi DOM load xong rồi mới chạy đếm ngược
        document.addEventListener("DOMContentLoaded", function() {
            updateCountdown();
            setInterval(updateCountdown, 1000);
        });

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