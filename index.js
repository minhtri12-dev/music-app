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
    historyContent = document.getElementById('history-content'),
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

// DANH SÁCH 24 BÀI HÁT
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
let playHistory = []; 
let musicIndex = 0;
let isShuffle = false;
let isRepeat = false;
let currentTab = 'all';
let searchQuery = ''; 

let sleepTimer = null;
let countdownInterval = null;
let fadeInterval = null; 
let zenTimer = null;
let zenCountdown = null;
let isZenMode = false;
let previousVolume = 1;
let currentTheme = 'auto'; 

const songDurationsCache = {};

// ================= PARTICLE OVERLAY =================
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
let particlesArray = [];

function initParticles() {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    particlesArray = [];
    let numParticles = window.innerWidth < 600 ? 30 : 80;
    for (let i = 0; i < numParticles; i++) {
        let size = Math.random() * 1.5;
        let x = Math.random() * innerWidth; let y = Math.random() * innerHeight;
        let speedX = (Math.random() - 0.5) * 0.4; let speedY = (Math.random() - 1) * 0.4;
        particlesArray.push({ x, y, speedX, speedY, size });
    }
}
function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    particlesArray.forEach(p => {
        p.x += p.speedX; p.y += p.speedY;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    });
    requestAnimationFrame(animateParticles);
}
window.addEventListener('resize', initParticles);
initParticles(); animateParticles();

// ================= TIỆN ÍCH CHUNG =================
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'custom-toast'; toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => { toast.classList.add('fade-out'); setTimeout(() => toast.remove(), 300); }, 2000);
}

function formatTime(seconds) {
    if (isNaN(seconds) || seconds === Infinity || seconds === 0) return "--:--";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

// ================= INIT & SAVE STATE =================
function initSongs() {
    const savedFavs = localStorage.getItem('aurora_favorites_tri');
    let favIds = savedFavs ? JSON.parse(savedFavs) : [];
    songs = baseSongs.map(song => ({ ...song, isFavorite: favIds.includes(song.id) }));

    const savedHistory = localStorage.getItem('zen_history');
    if (savedHistory) playHistory = JSON.parse(savedHistory);

    const savedTheme = localStorage.getItem('zen_theme');
    if (savedTheme) {
        currentTheme = savedTheme;
        document.querySelectorAll('.theme-btn').forEach(b => {
            b.classList.remove('active');
            if(b.getAttribute('data-theme') === currentTheme) b.classList.add('active');
        });
        applyTheme(currentTheme);
    }

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
    localStorage.setItem('nmt_music_state', JSON.stringify({ index: musicIndex, currentTime: music.currentTime, volume: music.volume, isShuffle: isShuffle, isRepeat: isRepeat }));
}
setInterval(savePlayerState, 2000);

// ================= SMOOTH AUDIO FADE-OUT =================
function fadeOutAndPause(durationMs = 800) {
    if (fadeInterval) clearInterval(fadeInterval);
    const step = music.volume / (durationMs / 50);
    const currentVol = music.volume;
    
    fadeInterval = setInterval(() => {
        if (music.volume - step > 0) {
            music.volume -= step;
        } else {
            music.volume = 0; music.pause(); clearInterval(fadeInterval);
            music.volume = currentVol; 
            updatePlayBtnState();
        }
    }, 50);
}

function togglePlay() {
    if (fadeInterval) { clearInterval(fadeInterval); music.volume = previousVolume > 0 ? previousVolume : 1; }
    if (music.paused) playMusic(); else fadeOutAndPause(500); 
}

function playMusic() {
    if (fadeInterval) { clearInterval(fadeInterval); music.volume = previousVolume > 0 ? previousVolume : 1; }
    music.play().then(() => updatePlayBtnState()).catch(e => console.log(e));
    if(currentTab !== 'settings') renderPlaylist();
}

function updatePlayBtnState() {
    if (music.paused) {
        playBtn.classList.replace('fa-pause', 'fa-play'); playBtn.setAttribute('title', 'Play');
        cdElement.classList.remove('playing'); visualizerBars.classList.remove('playing');
    } else {
        playBtn.classList.replace('fa-play', 'fa-pause'); playBtn.setAttribute('title', 'Pause');
        cdElement.classList.add('playing'); visualizerBars.classList.add('playing');
    }
    savePlayerState();
}

// ================= MOOD THEMES =================
function applyTheme(theme) {
    document.body.className = '';
    if (theme !== 'auto') document.body.classList.add(`theme-${theme}`);
    localStorage.setItem('zen_theme', theme);
}

document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTheme = btn.getAttribute('data-theme');
        applyTheme(currentTheme);
        if (currentTheme === 'auto') applyDynamicAccent(songs[musicIndex].cover); 
        showToast(`Mood: ${btn.textContent}`);
    });
});

function applyDynamicAccent(coverUrl) {
    if (currentTheme !== 'auto') return; 
    if (!coverUrl || coverUrl.includes('music.png')) { document.documentElement.style.setProperty('--accent-color', '#fff'); } 
    else { document.documentElement.style.setProperty('--accent-color', '#ec4899'); }
}

// ================= LÕI LOAD NHẠC =================
function loadMusic(index) {
    musicIndex = index;
    const song = songs[musicIndex];
    music.src = song.path;
    title.textContent = song.displayName;
    artist.textContent = song.artist;
    document.getElementById('track-count').textContent = `TRACK ${musicIndex + 1} OF ${songs.length}`;

    playHistory = playHistory.filter(id => id !== song.id);
    playHistory.unshift(song.id);
    if(playHistory.length > 20) playHistory.pop();
    localStorage.setItem('zen_history', JSON.stringify(playHistory));

    if ('mediaSession' in navigator) {
        const coverUrl = new URL(song.cover || './assets/music.png', window.location.href).href;
        navigator.mediaSession.metadata = new MediaMetadata({
            title: song.displayName, artist: song.artist, album: 'Chill & Relax',
            artwork: [{ src: coverUrl, sizes: '512x512', type: 'image/png' }]
        });
        navigator.mediaSession.setActionHandler('play', playMusic);
        navigator.mediaSession.setActionHandler('pause', () => fadeOutAndPause(500));
        navigator.mediaSession.setActionHandler('previoustrack', () => changeMusic(-1));
        navigator.mediaSession.setActionHandler('nexttrack', () => changeMusic(1));
    }

    const customBg = localStorage.getItem('zen_custom_bg_' + song.id);
    if (customBg) {
        applyBackground(customBg);
    } else {
        if (song.bgVideo) applyBackground(song.bgVideo);
        else applyBackground(song.cover || './assets/1.jpg', true);
    }

    if (song.cover) {
        applyDynamicAccent(song.cover);
    } else {
        applyDynamicAccent(null);
    }

    if(currentTab !== 'settings') renderPlaylist();
    savePlayerState();
}

function applyBackground(source, isFallback = false) {
    const isVideo = source.endsWith('.mp4') || source.includes('.mp4?');
    if (isVideo) {
        mainBg.classList.add('hidden'); mainVideo.classList.add('active'); 
        if (!mainVideo.src.endsWith(source.replace('./', ''))) {
            mainVideo.src = source; mainVideo.load(); mainVideo.play().catch(e => console.log(e));
        }
    } else {
        mainVideo.classList.remove('active'); mainVideo.pause(); 
        mainBg.classList.remove('hidden'); mainBg.style.opacity = 0; 
        setTimeout(() => {
            const img = new Image();
            img.onload = () => { mainBg.src = source; mainBg.style.opacity = 1; };
            img.onerror = () => { mainBg.src = './assets/1.jpg'; mainBg.style.opacity = 1; }; 
            img.src = source;
        }, 300); 
    }
}

// ================= CUSTOM BACKGROUND: DÁN LINK HOẶC TẢI ẢNH (PER-SONG) =================
const bgInput = document.getElementById('custom-bg-input');
const uploadBtn = document.getElementById('upload-bg-btn');
const uploadInput = document.getElementById('custom-bg-upload');

document.getElementById('apply-bg-btn').addEventListener('click', () => {
    let link = bgInput.value.trim();
    if (link !== '') {
        if(link.startsWith('blob:')) { showToast('Lỗi: Hãy copy trực tiếp địa chỉ hình ảnh thật'); return; }
        const currentSongId = songs[musicIndex].id;
        localStorage.setItem('zen_custom_bg_' + currentSongId, link);
        showToast(`Đã áp dụng nền cho bài này`);
        loadMusic(musicIndex);
        bgInput.value = '';
    } else { showToast('Vui lòng dán link vào ô!'); }
});

uploadBtn.addEventListener('click', () => uploadInput.click());
uploadInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Lỗi: Chỉ hỗ trợ file ảnh!'); return; }

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width, height = img.height;
            const MAX_SIZE = 1920; 
            if (width > height && width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } 
            else if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
            
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            
            try {
                const currentSongId = songs[musicIndex].id;
                localStorage.setItem('zen_custom_bg_' + currentSongId, compressedBase64);
                showToast(`Đã tải nền thành công!`);
                loadMusic(musicIndex);
            } catch (error) { showToast('Lỗi: Ảnh quá lớn để lưu trữ!'); }
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    uploadInput.value = '';
});

document.getElementById('reset-bg-btn').addEventListener('click', () => {
    const currentSongId = songs[musicIndex].id;
    localStorage.removeItem('zen_custom_bg_' + currentSongId); 
    bgInput.value = ''; showToast(`Đã khôi phục nền gốc`); loadMusic(musicIndex);
});

// ================= CONTROLS & LOGIC PHÁT NHẠC =================
function changeMusic(direction) {
    let playableSongs = getFilteredSongs();
    if (playableSongs.length === 0) { fadeOutAndPause(); return; }

    let currentFilteredIndex = playableSongs.findIndex(s => s.id === songs[musicIndex].id);
    if (currentFilteredIndex === -1) currentFilteredIndex = 0;
    else {
        if (isShuffle) {
            let randomIndex; do { randomIndex = Math.floor(Math.random() * playableSongs.length); } while (randomIndex === currentFilteredIndex && playableSongs.length > 1);
            currentFilteredIndex = randomIndex;
        } else { currentFilteredIndex = (currentFilteredIndex + direction + playableSongs.length) % playableSongs.length; }
    }
    const originalIndex = songs.findIndex(s => s.id === playableSongs[currentFilteredIndex].id);
    loadMusic(originalIndex); playMusic();
}

music.addEventListener('ended', () => { if (isRepeat) { music.currentTime = 0; playMusic(); } else changeMusic(1); });

function getFilteredSongs() {
    if (currentTab === 'history') return playHistory.map(id => songs.find(s => s.id === id)).filter(s => s);
    let filtered = songs;
    if (currentTab === 'fav') filtered = filtered.filter(s => s.isFavorite);
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(s => s.displayName.toLowerCase().includes(query) || s.artist.toLowerCase().includes(query));
    }
    return filtered;
}

searchInput.addEventListener('input', (e) => { searchQuery = e.target.value; renderPlaylist(); });

function renderPlaylist() {
    const container = currentTab === 'history' ? historyContent : playlistContent;
    container.innerHTML = '';
    let displaySongs = getFilteredSongs();
    if (displaySongs.length === 0) { container.innerHTML = '<p style="color:#aaa; text-align:center; font-size:13px; margin-top:20px;">Trống rỗng...</p>'; return; }
    
    displaySongs.forEach((song, index) => {
        const originalIndex = songs.findIndex(s => s.id === song.id);
        const isActive = (originalIndex === musicIndex);
        const item = document.createElement('div');
        item.className = `track ${isActive ? 'active-track' : ''}`;
        
        const numDisplay = isActive ? '<i class="fa-solid fa-chart-simple"></i>' : (index + 1);
        const heartClass = song.isFavorite ? 'fa-solid fa-heart favorited' : 'fa-regular fa-heart';

        item.innerHTML = `
            <div class="track-info">
                <span class="track-num">${numDisplay}</span>
                <div class="track-details"><strong>${song.displayName}</strong><span>${song.artist}</span></div>
            </div>
            <div class="track-actions">
                <i class="${heartClass} favorite-btn"></i>
                <span class="track-time" id="dur-${song.id}-${currentTab}">--:--</span>
            </div>
        `;
        
        if (songDurationsCache[song.id]) {
            item.querySelector('.track-time').textContent = songDurationsCache[song.id];
        } else {
            const tempAudio = new Audio(song.path);
            tempAudio.preload = "metadata";
            tempAudio.addEventListener('loadedmetadata', () => {
                const timeStr = formatTime(tempAudio.duration);
                songDurationsCache[song.id] = timeStr; 
                const dEl = document.getElementById(`dur-${song.id}-${currentTab}`);
                if (dEl) dEl.textContent = timeStr;
            });
            tempAudio.addEventListener('error', () => {
                const dEl = document.getElementById(`dur-${song.id}-${currentTab}`);
                if (dEl) dEl.textContent = "--:--";
            });
        }

        item.querySelector('.track-info').addEventListener('click', () => { loadMusic(originalIndex); playMusic(); });
        item.querySelector('.favorite-btn').addEventListener('click', (e) => {
            e.stopPropagation(); songs[originalIndex].isFavorite = !songs[originalIndex].isFavorite;
            e.currentTarget.classList.add('burst'); setTimeout(() => e.currentTarget.classList.remove('burst'), 400);
            showToast(songs[originalIndex].isFavorite ? `Đã thích ❤` : `Đã bỏ thích`);
            localStorage.setItem('aurora_favorites_tri', JSON.stringify(songs.filter(s => s.isFavorite).map(s => s.id))); 
            renderPlaylist();
        });
        container.appendChild(item);
    });
}

music.addEventListener('timeupdate', () => {
    const { duration, currentTime } = music; if (isNaN(duration)) return;
    progress.style.width = `${(currentTime / duration) * 100}%`;
    currentTimeEl.textContent = formatTime(currentTime); durationEl.textContent = "-" + formatTime(duration - currentTime);
});

playerProgress.addEventListener('click', (e) => music.currentTime = (e.offsetX / playerProgress.clientWidth) * music.duration);

function setVolumeIcon(vol) { volumeIcon.className = 'fa-solid ' + (vol === 0 ? 'fa-volume-xmark' : (vol < 0.5 ? 'fa-volume-low' : 'fa-volume-high')); }
volumeSlider.addEventListener('input', (e) => {
    const vol = parseFloat(e.target.value); music.volume = vol;
    if (vol > 0) previousVolume = vol; setVolumeIcon(vol); savePlayerState();
});
volumeIcon.addEventListener('click', () => {
    if (music.volume > 0) { previousVolume = music.volume; music.volume = 0; volumeSlider.value = 0; showToast('Muted'); } 
    else { music.volume = previousVolume; volumeSlider.value = previousVolume; showToast(`Âm lượng ${Math.round(previousVolume * 100)}%`); }
    setVolumeIcon(music.volume); savePlayerState();
});

// ================= TIMER =================
document.querySelectorAll('.timer-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.timer-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active');
        const minutes = parseInt(btn.getAttribute('data-time'));
        clearTimeout(sleepTimer); clearInterval(countdownInterval);
        
        if (minutes === 0) { timerDisplay.textContent = 'Chưa hẹn giờ'; showToast('Đã hủy hẹn giờ'); return; }
        
        let remainingSecs = minutes * 60;
        timerDisplay.textContent = `Tắt nhạc sau: ${formatTime(remainingSecs)}`;
        showToast(`Hẹn tắt và mờ dần sau ${minutes} phút`);

        countdownInterval = setInterval(() => {
            remainingSecs--;
            if (remainingSecs <= 0) clearInterval(countdownInterval);
            else timerDisplay.textContent = `Tắt nhạc sau: ${formatTime(remainingSecs)}`;
        }, 1000);

        sleepTimer = setTimeout(() => {
            fadeOutAndPause(3000); 
            timerDisplay.textContent = 'Đã tắt nhạc';
            document.querySelectorAll('.timer-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('.timer-btn[data-time="0"]').classList.add('active');
        }, minutes * 60 * 1000);
    });
});

playBtnWrapper.addEventListener('click', togglePlay);
prevBtn.addEventListener('click', () => changeMusic(-1));
nextBtn.addEventListener('click', () => changeMusic(1));
shuffleBtn.addEventListener('click', () => { isShuffle = !isShuffle; shuffleBtn.classList.toggle('active', isShuffle); showToast(isShuffle ? 'Bật trộn bài' : 'Tắt trộn bài'); savePlayerState(); });
repeatBtn.addEventListener('click', () => { isRepeat = !isRepeat; repeatBtn.classList.toggle('active', isRepeat); showToast(isRepeat ? 'Bật lặp lại' : 'Tắt lặp lại'); savePlayerState(); });

// ================= MENU TABS =================
function toggleMenu() { playlistDrawer.classList.toggle('active'); }
playlistToggleBtn.addEventListener('click', toggleMenu); 

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active')); btn.classList.add('active');
        currentTab = btn.getAttribute('data-tab');
        
        document.getElementById('search-box').style.display = (currentTab === 'settings') ? 'none' : 'block';
        playlistContent.classList.remove('active'); historyContent.classList.remove('active'); settingsContent.classList.remove('active');
        
        if (currentTab === 'settings') settingsContent.classList.add('active');
        else if (currentTab === 'history') { historyContent.classList.add('active'); renderPlaylist(); }
        else { playlistContent.classList.add('active'); renderPlaylist(); }
    });
});

function toggleZenMode() {
    if (isZenMode) {
        isZenMode = false; appLayout.classList.remove('zen-mode'); document.body.classList.remove('zen-active');
        clearTimeout(zenTimer); clearInterval(zenCountdown); zenToastEl.classList.remove('show');
        showToast('Thoát Zen Mode');
    } else {
        if (zenTimer) { clearTimeout(zenTimer); clearInterval(zenCountdown); zenToastEl.classList.remove('show'); zenTimer = null; showToast('Đã hủy ẩn'); return; }
        let timeLeft = 5; zenToastEl.textContent = `Ẩn giao diện sau ${timeLeft}s... (Nhấn H để hủy)`; zenToastEl.classList.add('show');
        zenCountdown = setInterval(() => { timeLeft--; zenToastEl.textContent = `Ẩn giao diện sau ${timeLeft}s... (Nhấn H để hủy)`; if (timeLeft <= 0) clearInterval(zenCountdown); }, 1000);
        zenTimer = setTimeout(() => {
            isZenMode = true; appLayout.classList.add('zen-mode'); document.body.classList.add('zen-active'); zenToastEl.classList.remove('show'); zenTimer = null;
        }, 5000);
    }
}

document.addEventListener('keydown', (e) => {
    if (e.target.tagName.toLowerCase() === 'input') return;
    if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); togglePlay(); }
    if (e.code === 'ArrowRight') { e.preventDefault(); changeMusic(1); }
    if (e.code === 'ArrowLeft') { e.preventDefault(); changeMusic(-1); }
    if (e.code === 'ArrowUp') { e.preventDefault(); let v = Math.min(1, music.volume + 0.1); music.volume = v; volumeSlider.value = v; setVolumeIcon(v); if(v>0) previousVolume=v; showToast(`${Math.round(v*100)}%`); }
    if (e.code === 'ArrowDown') { e.preventDefault(); let v = Math.max(0, music.volume - 0.1); music.volume = v; volumeSlider.value = v; setVolumeIcon(v); showToast(`${Math.round(v*100)}%`); }
    if (e.code === 'KeyH' || e.key.toLowerCase() === 'h') { e.preventDefault(); toggleZenMode(); }
    if (e.code === 'KeyF' || e.key.toLowerCase() === 'f') { e.preventDefault(); if(!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); }
});

initSongs(); loadMusic(musicIndex);