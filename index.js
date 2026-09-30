const title = document.getElementById('music-title'),
    artist = document.getElementById('music-artist'),
    currentTimeEl = document.getElementById('current-time'),
    durationEl = document.getElementById('duration'),
    progress = document.getElementById('progress'),
    playerProgress = document.getElementById('player-progress'),
    prevBtn = document.getElementById('prev'),
    nextBtn = document.getElementById('next'),
    playBtn = document.getElementById('play'),
    playBtnWrapper = document.getElementById('play-btn-wrapper'),
    shuffleBtn = document.getElementById('shuffle'),
    repeatBtn = document.getElementById('repeat'),
    volumeSlider = document.getElementById('volume-slider'),
    volumeIcon = document.getElementById('volume-icon'),
    playlistContent = document.getElementById('playlist-content'),
    settingsContent = document.getElementById('settings-content'),
    playlistToggleBtn = document.getElementById('playlist-toggle-btn'),
    playlistDrawer = document.getElementById('playlist-drawer'),
    tabBtns = document.querySelectorAll('.tab-btn'),
    mainBg = document.getElementById('main-bg'),
    mainVideo = document.getElementById('main-video'),
    timerDisplay = document.getElementById('timer-display'),
    cdElement = document.getElementById('cd-element'),
    visualizerBars = document.getElementById('visualizer-bars'),
    searchInput = document.getElementById('search-input'),
    zenToastEl = document.getElementById('zen-toast'),
    toastContainer = document.getElementById('toast-container'),
    appLayout = document.querySelector('.app-layout');

const music = new Audio();

const baseSongs = [
    { id: 1, path: './assets/full.mp3', displayName: 'PHUNG MCK', artist: 'MCK', bgVideo: './assets/1.mp4' },
    { id: 2, path: './assets/bwine.mp3', displayName: 'VÀI TRACK BWINE', artist: 'BWINE', bgVideo: './assets/2.mp4' },
    { id: 3, path: './assets/3.mp3', displayName: 'PHUNG THE WEEKND', artist: 'THE WEEKND', bgVideo: './assets/3.mp4' },
    { id: 4, path: 'https://github.com/minhtri12-dev/music-app/releases/download/v1.0.0/thekidlaroi1.mp3', displayName: 'THE KID LAROI LIST 1', artist: 'THE KID LAROI', cover: './assets/thekidlaroi.png' }, 
    { id: 5, path: './assets/phungnhactrung.mp3', displayName: 'LIST NHAC TRUNG 1 ', artist: 'SoundCloud', bgVideo:'./assets/chuongnhuocnam.mp4' },
    { id: 6, path: './assets/listtrung2.mp3', displayName: 'LIST NHAC TRUNG 2 ', artist: 'SoundCloud', cover: './assets/24.png' },
    { id: 7, path: './assets/20.mp3', displayName: 'NHAC TRUNG', artist: 'SoundCloud', cover: './assets/10.png' },
    { id: 8, path: './assets/mashupnhactrung.mp3', displayName: 'NHAC TRUNG', artist: 'SoundCloud', cover: './assets/22.png' },
    { id: 9, path: './assets/267.mp3', displayName: 'W/N', artist: 'KHANH LOSER', cover: './assets/23.png' },
    { id: 10, path: 'https://github.com/minhtri12-dev/music-app/releases/download/v1.0.0/lofilist.mp3', displayName: 'LOFI', artist: 'SoundCloud', cover: './assets/khanh.png' },  
    { id: 11, path: './assets/timem.mp3', displayName: 'SUU TAM', cover: './assets/2.jpg', artist: 'SoundCloud' },
    { id: 12, path: './assets/ty1d.mp3', displayName: 'SUU TAM', cover: './assets/3.jpg', artist: 'SoundCloud' },
    { id: 13, path: './assets/mashup.mp3', displayName: 'SUU TAM', cover: './assets/5.png', artist: 'SoundCloud' },
    { id: 14, path: './assets/biendaovaem.mp3', displayName: 'BIEN DAO & EM', cover: './assets/7.png', artist: 'SoundCloud' },
    { id: 15, path: './assets/amthambenem.mp3', displayName: 'AM THAM BEN EM', cover: './assets/9.png', artist: 'SoundCloud' },
    { id: 16, path: './assets/quaduroi.mp3', displayName: 'QUA DU ROI', cover: './assets/6.png', artist: 'SoundCloud' },
    { id: 17, path: './assets/anhsairoi.mp3', displayName: 'ANH SAI ROI', cover: './assets/5.png', artist: 'SoundCloud' },
    { id: 18, path: './assets/nntcc.mp3', displayName: 'NEU NHU TA CHANG CON', cover: './assets/7.png', artist: 'MCK' },
    { id: 19, path: './assets/kesaytinh.mp3', displayName: 'KE SAY TINH', cover: './assets/8.jpg', artist: 'QUOC THIEN' },
    { id: 20, path: './assets/denkhinao.mp3', displayName: 'I LOVE YOU 3000', cover: './assets/9.jpg', artist: 'SoundCloud' },
    { id: 21, path: './assets/50f.mp3', displayName: '50 Feet', cover: './assets/10.jpg', artist: 'Somo' },
    { id: 22, path: './assets/vangogh.mp3', displayName: 'Van Gogh', cover: './assets/11.jpg', artist: 'Dept Ft AA' },
    { id: 23, path: './assets/cry.mp3', displayName: 'Cry', cover: './assets/12.jpg', artist: 'Cigarettes After Sex' },
    { id: 24, path: './assets/baab.mp3', displayName: 'Justin Playlist', cover: './assets/13.jpg', artist: 'Justin Bieber' }
];

let songs = [];
let musicIndex = 0;
let isShuffle = false;
let isRepeat = false;
let currentTab = 'all';
let searchQuery = ''; 

let sleepTimer = null;
let countdownInterval = null;

let zenTimer = null;
let zenCountdown = null;
let isZenMode = false;

// Lưu volume trước khi mute
let previousVolume = 1;

// Hiển thị Toast thông báo kính mờ
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'custom-toast';
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

function initSongs() {
    const savedFavs = localStorage.getItem('aurora_favorites_tri');
    let favIds = savedFavs ? JSON.parse(savedFavs) : [];
    songs = baseSongs.map(song => ({ ...song, isFavorite: favIds.includes(song.id) }));

    const savedState = JSON.parse(localStorage.getItem('nmt_music_state'));
    if (savedState) {
        musicIndex = savedState.index >= 0 && savedState.index < songs.length ? savedState.index : 0;
        isShuffle = savedState.isShuffle || false;
        isRepeat = savedState.isRepeat || false;
        music.volume = savedState.volume !== undefined ? savedState.volume : 1;
        previousVolume = music.volume > 0 ? music.volume : 1;
        
        volumeSlider.value = music.volume;
        if(isShuffle) shuffleBtn.classList.add('active');
        if(isRepeat) repeatBtn.classList.add('active');
        setVolumeIcon(music.volume);

        music.addEventListener('loadedmetadata', function setTime() {
            if (savedState.currentTime) music.currentTime = savedState.currentTime;
            music.removeEventListener('loadedmetadata', setTime);
        });
    }
}

function savePlayerState() {
    localStorage.setItem('nmt_music_state', JSON.stringify({
        index: musicIndex,
        currentTime: music.currentTime,
        volume: music.volume,
        isShuffle: isShuffle,
        isRepeat: isRepeat
    }));
}
setInterval(savePlayerState, 2000);

function saveFavorites() {
    const favIds = songs.filter(song => song.isFavorite).map(song => song.id);
    localStorage.setItem('aurora_favorites_tri', JSON.stringify(favIds));
}

function getFilteredSongs() {
    let filtered = songs;
    if (currentTab === 'fav') filtered = filtered.filter(s => s.isFavorite);
    
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(s => 
            s.displayName.toLowerCase().includes(query) || 
            s.artist.toLowerCase().includes(query)
        );
    }
    return filtered;
}

function togglePlay() {
    if (music.paused) playMusic();
    else pauseMusic();
}

function playMusic() {
    music.play().then(() => {
        playBtn.classList.replace('fa-play', 'fa-pause');
        playBtn.setAttribute('title', 'Pause');
        cdElement.classList.add('playing');
        visualizerBars.classList.add('playing');
    }).catch(e => console.log(e));
    if(currentTab !== 'settings') renderPlaylist();
}

function pauseMusic() {
    music.pause();
    playBtn.classList.replace('fa-pause', 'fa-play');
    playBtn.setAttribute('title', 'Play');
    cdElement.classList.remove('playing');
    visualizerBars.classList.remove('playing');
    savePlayerState();
}

// Dynamic Accent Color (Đổi màu thanh progress bar theo bài hát)
function applyDynamicAccent(coverUrl) {
    if (!coverUrl || coverUrl.includes('music.png')) {
        progress.style.backgroundColor = '#fff';
        cdElement.style.borderColor = 'rgba(255, 255, 255, 0.4)';
        return;
    }
    progress.style.backgroundColor = '#ec4899';
    cdElement.style.borderColor = 'rgba(236, 72, 153, 0.6)';
}

function loadMusic(index) {
    musicIndex = index;
    const song = songs[musicIndex];
    music.src = song.path;
    title.textContent = song.displayName;
    artist.textContent = song.artist;
    
    document.getElementById('track-count').textContent = `TRACK ${musicIndex + 1} OF ${songs.length}`;

    if ('mediaSession' in navigator) {
        const coverUrl = new URL(song.cover || './assets/music.png', window.location.href).href;
        navigator.mediaSession.metadata = new MediaMetadata({
            title: song.displayName,
            artist: song.artist,
            album: 'Chill & Relax Playlist',
            artwork: [
                { src: coverUrl, sizes: '512x512', type: 'image/png' },
                { src: coverUrl, sizes: '256x256', type: 'image/png' } 
            ]
        });
        navigator.mediaSession.setActionHandler('play', playMusic);
        navigator.mediaSession.setActionHandler('pause', pauseMusic);
        navigator.mediaSession.setActionHandler('previoustrack', () => changeMusic(-1));
        navigator.mediaSession.setActionHandler('nexttrack', () => changeMusic(1));
    }

    if (song.bgVideo) {
        mainBg.classList.add('hidden'); 
        mainVideo.classList.add('active'); 
        
        if (!mainVideo.src.endsWith(song.bgVideo.replace('./', ''))) {
            mainVideo.src = song.bgVideo;
            mainVideo.load();
            mainVideo.play().catch(e => console.log(e));
        }
    } else {
        mainVideo.classList.remove('active'); 
        mainVideo.pause(); 
        mainBg.classList.remove('hidden'); 

        mainBg.style.opacity = 0; 
        setTimeout(() => {
            const img = new Image();
            img.onload = () => { mainBg.src = song.cover; mainBg.style.opacity = 1; };
            img.onerror = () => { mainBg.src = './assets/1.jpg'; mainBg.style.opacity = 1; }; 
            img.src = song.cover;
        }, 300); 
    }

    if (song.cover) {
        const cdImg = new Image();
        cdImg.onload = () => { cdElement.style.backgroundImage = `url('${song.cover}')`; };
        cdImg.onerror = () => { cdElement.style.backgroundImage = `url('./assets/music.png')`; };
        cdImg.src = song.cover;
        applyDynamicAccent(song.cover);
    } else {
        cdElement.style.backgroundImage = `url('./assets/music.png')`;
        applyDynamicAccent(null);
    }

    if(currentTab !== 'settings') renderPlaylist();
    savePlayerState();
}

function changeMusic(direction) {
    let playableSongs = getFilteredSongs();
    if (playableSongs.length === 0) { pauseMusic(); return; }

    let currentFilteredIndex = playableSongs.findIndex(s => s.id === songs[musicIndex].id);
    if (currentFilteredIndex === -1) currentFilteredIndex = 0;
    else {
        if (direction === 1 && currentTab === 'fav' && currentFilteredIndex === playableSongs.length - 1 && !isRepeat) {
            pauseMusic(); music.currentTime = 0; updateProgressBar(); return;
        }

        if (isShuffle) {
            let randomIndex;
            do { randomIndex = Math.floor(Math.random() * playableSongs.length); } 
            while (randomIndex === currentFilteredIndex && playableSongs.length > 1);
            currentFilteredIndex = randomIndex;
        } else {
            currentFilteredIndex = (currentFilteredIndex + direction + playableSongs.length) % playableSongs.length;
        }
    }

    const targetSong = playableSongs[currentFilteredIndex];
    const originalIndex = songs.findIndex(s => s.id === targetSong.id);
    loadMusic(originalIndex);
    playMusic();
}

function handleSongEnd() {
    if (isRepeat) { music.currentTime = 0; playMusic(); } 
    else changeMusic(1);
}

function updateProgressBar() {
    const { duration, currentTime } = music;
    if (isNaN(duration)) return;
    
    progress.style.width = `${(currentTime / duration) * 100}%`;
    currentTimeEl.textContent = formatTime(currentTime);
    const remainingTime = duration - currentTime;
    durationEl.textContent = "-" + formatTime(remainingTime);
}

function setProgressBar(e) {
    const width = playerProgress.clientWidth;
    music.currentTime = (e.offsetX / width) * music.duration;
}

function setVolumeIcon(vol) {
    volumeIcon.className = 'fa-solid ' + (vol === 0 ? 'fa-volume-xmark' : (vol < 0.5 ? 'fa-volume-low' : 'fa-volume-high'));
}

function setVolume(e) {
    const vol = parseFloat(e.target.value);
    music.volume = vol;
    music.muted = vol === 0;
    if (vol > 0) previousVolume = vol;
    setVolumeIcon(vol);
    savePlayerState();
}

// Click icon loa để Mute / Unmute nhanh
volumeIcon.addEventListener('click', () => {
    if (music.volume > 0) {
        previousVolume = music.volume;
        music.volume = 0;
        volumeSlider.value = 0;
        setVolumeIcon(0);
        showToast('Đã tắt âm thanh');
    } else {
        music.volume = previousVolume;
        volumeSlider.value = previousVolume;
        setVolumeIcon(previousVolume);
        showToast(`Đã bật âm thanh (${Math.round(previousVolume * 100)}%)`);
    }
    savePlayerState();
});

function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderPlaylist();
});

function renderPlaylist() {
    playlistContent.innerHTML = '';
    let displaySongs = getFilteredSongs();
    
    if (displaySongs.length === 0) {
        playlistContent.innerHTML = '<p style="color:#ddd; text-align:center; font-size:13px; margin-top:20px; text-shadow: 0 1px 3px rgba(0,0,0,0.8);">Không tìm thấy bài hát.</p>';
        return;
    }
    
    displaySongs.forEach((song, index) => {
        const originalIndex = songs.findIndex(s => s.id === song.id);
        const isActive = (originalIndex === musicIndex);
        const item = document.createElement('div');
        item.classList.add('track');
        if (isActive) item.classList.add('active-track');
        
        const numDisplay = isActive ? '<i class="fa-solid fa-chart-simple"></i>' : (index + 1);
        const heartClass = song.isFavorite ? 'fa-solid fa-heart favorited' : 'fa-regular fa-heart';

        item.innerHTML = `
            <div class="track-info">
                <span class="track-num">${numDisplay}</span>
                <div class="track-details">
                    <strong>${song.displayName}</strong><span>${song.artist}</span>
                </div>
            </div>
            <div class="track-actions">
                <i class="${heartClass} favorite-btn" data-id="${song.id}"></i>
                <span class="track-time" id="duration-${song.id}">--:--</span>
            </div>
        `;

        const tempAudio = new Audio(song.path);
        tempAudio.addEventListener('loadedmetadata', () => {
            const dEl = document.getElementById(`duration-${song.id}`);
            if (dEl) dEl.textContent = formatTime(tempAudio.duration);
        });

        item.querySelector('.track-info').addEventListener('click', () => {
            loadMusic(originalIndex); playMusic();
        });

        // Hiệu ứng tim bùng nổ (Heart Burst) + Toast
        item.querySelector('.favorite-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            const btn = e.currentTarget;
            songs[originalIndex].isFavorite = !songs[originalIndex].isFavorite;
            
            btn.classList.add('burst');
            setTimeout(() => btn.classList.remove('burst'), 400);

            if (songs[originalIndex].isFavorite) {
                showToast(`Đã thích "${songs[originalIndex].displayName}" ❤️`);
            } else {
                showToast(`Đã bỏ thích "${songs[originalIndex].displayName}"`);
            }

            saveFavorites(); 
            renderPlaylist();
        });

        playlistContent.appendChild(item);
    });
}

function toggleZenMode() {
    if (isZenMode) {
        isZenMode = false;
        appLayout.classList.remove('zen-mode');
        document.body.classList.remove('zen-active');
        clearTimeout(zenTimer);
        clearInterval(zenCountdown);
        zenToastEl.classList.remove('show');
        showToast('Đã thoát chế độ Trong Suốt');
    } else {
        if (zenTimer) {
            clearTimeout(zenTimer);
            clearInterval(zenCountdown);
            zenToastEl.classList.remove('show');
            zenTimer = null;
            showToast('Đã hủy hẹn ẩn giao diện');
            return;
        }
        
        let timeLeft = 5;
        zenToastEl.textContent = `Giao diện sẽ ẩn sau ${timeLeft}s... (Nhấn H để hủy)`;
        zenToastEl.classList.add('show');
        
        zenCountdown = setInterval(() => {
            timeLeft--;
            if (timeLeft > 0) {
                zenToastEl.textContent = `Giao diện sẽ ẩn sau ${timeLeft}s... (Nhấn H để hủy)`;
            } else {
                clearInterval(zenCountdown);
            }
        }, 1000);

        zenTimer = setTimeout(() => {
            isZenMode = true;
            appLayout.classList.add('zen-mode');
            document.body.classList.add('zen-active'); 
            zenToastEl.classList.remove('show');
            zenTimer = null;
            showToast('Đã vào chế độ Trong Suốt. Nhấn H để mở lại giao diện.');
        }, 5000);
    }
}

// Fullscreen Mode thực thụ bằng phím F
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Error attempting to enable fullscreen: ${err.message}`);
        });
        showToast('Đã bật toàn màn hình (Fullscreen)');
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
            showToast('Đã thoát toàn màn hình');
        }
    }
}

document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        music.playbackRate = parseFloat(btn.getAttribute('data-speed'));
        showToast(`Tốc độ phát: ${music.playbackRate}x`);
    });
});

document.querySelectorAll('.timer-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.timer-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const minutes = parseInt(btn.getAttribute('data-time'));
        
        clearTimeout(sleepTimer);
        clearInterval(countdownInterval);
        
        if (minutes === 0) {
            timerDisplay.textContent = 'Chưa hẹn giờ';
            showToast('Đã hủy hẹn giờ tắt nhạc');
            return;
        }

        let remainingSecs = minutes * 60;
        timerDisplay.textContent = `Tắt nhạc sau: ${formatTime(remainingSecs)}`;
        showToast(`Đã hẹn giờ tắt nhạc sau ${minutes} phút`);

        countdownInterval = setInterval(() => {
            remainingSecs--;
            if (remainingSecs <= 0) clearInterval(countdownInterval);
            else timerDisplay.textContent = `Tắt nhạc sau: ${formatTime(remainingSecs)}`;
        }, 1000);

        sleepTimer = setTimeout(() => {
            pauseMusic();
            timerDisplay.textContent = 'Đã tắt nhạc';
            document.querySelectorAll('.timer-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('.timer-btn[data-time="0"]').classList.add('active');
            showToast('Đã tự động tắt nhạc theo hẹn giờ!');
        }, minutes * 60 * 1000);
    });
});

playBtnWrapper.addEventListener('click', togglePlay);
prevBtn.addEventListener('click', () => changeMusic(-1));
nextBtn.addEventListener('click', () => changeMusic(1));
music.addEventListener('ended', handleSongEnd);
music.addEventListener('timeupdate', updateProgressBar);
playerProgress.addEventListener('click', setProgressBar);
volumeSlider.addEventListener('input', setVolume);

shuffleBtn.addEventListener('click', () => { 
    isShuffle = !isShuffle; 
    shuffleBtn.classList.toggle('active', isShuffle); 
    savePlayerState(); 
    showToast(isShuffle ? 'Đã bật trộn bài (Shuffle)' : 'Đã tắt trộn bài');
});

repeatBtn.addEventListener('click', () => { 
    isRepeat = !isRepeat; 
    repeatBtn.classList.toggle('active', isRepeat); 
    savePlayerState(); 
    showToast(isRepeat ? 'Đã bật lặp lại bài hát (Repeat)' : 'Đã tắt lặp lại');
});

playlistToggleBtn.addEventListener('click', () => {
    playlistDrawer.classList.toggle('active');
});

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTab = btn.getAttribute('data-tab');
        
        if (currentTab === 'settings') {
            document.getElementById('search-box').style.display = 'none';
            playlistContent.classList.remove('active');
            settingsContent.classList.add('active');
        } else {
            document.getElementById('search-box').style.display = 'block';
            settingsContent.classList.remove('active');
            playlistContent.classList.add('active');
            renderPlaylist();
        }
    });
});

// Lắng nghe tổ hợp phím tắt (Space, Mũi tên trái/phải/lên/xuống, H, F)
document.addEventListener('keydown', (e) => {
    if (e.target.tagName.toLowerCase() === 'input') return;
    
    if (e.code === 'Space' || e.key === ' ') { 
        e.preventDefault(); 
        togglePlay(); 
    }
    if (e.code === 'ArrowRight') { 
        e.preventDefault(); 
        changeMusic(1); 
    }
    if (e.code === 'ArrowLeft') { 
        e.preventDefault(); 
        changeMusic(-1); 
    }
    // Phím Mũi tên Lên / Xuống tăng giảm âm lượng 10%
    if (e.code === 'ArrowUp') {
        e.preventDefault();
        let newVol = Math.min(1, music.volume + 0.1);
        music.volume = newVol;
        volumeSlider.value = newVol;
        setVolumeIcon(newVol);
        if (newVol > 0) previousVolume = newVol;
        savePlayerState();
        showToast(`Âm lượng: ${Math.round(newVol * 100)}%`);
    }
    if (e.code === 'ArrowDown') {
        e.preventDefault();
        let newVol = Math.max(0, music.volume - 0.1);
        music.volume = newVol;
        volumeSlider.value = newVol;
        setVolumeIcon(newVol);
        savePlayerState();
        showToast(`Âm lượng: ${Math.round(newVol * 100)}%`);
    }
    // Phím H: Zen Mode
    if (e.code === 'KeyH' || e.key.toLowerCase() === 'h') { 
        e.preventDefault(); 
        toggleZenMode(); 
    }
    // Phím F: Fullscreen
    if (e.code === 'KeyF' || e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFullscreen();
    }
});

initSongs();
loadMusic(musicIndex);