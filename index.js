const image = document.getElementById('cover'),
    vinylDisc = document.getElementById('vinyl-disc'),
    vinylNeedle = document.getElementById('vinyl-needle'),
    vinylCenter = document.getElementById('vinyl-center'),
    title = document.getElementById('music-title'),
    artist = document.getElementById('music-artist'),
    currentTimeEl = document.getElementById('current-time'),
    durationEl = document.getElementById('duration'),
    progress = document.getElementById('progress'),
    playerProgress = document.getElementById('player-progress'),
    prevBtn = document.getElementById('prev'),
    nextBtn = document.getElementById('next'),
    playBtn = document.getElementById('play'),
    shuffleBtn = document.getElementById('shuffle'),
    repeatBtn = document.getElementById('repeat'),
    background = document.getElementById('bg-img'),
    volumeSlider = document.getElementById('volume-slider'),
    volumeIcon = document.getElementById('volume-icon'),
    playlistBtn = document.getElementById('playlist-btn'),
    playlistDrawer = document.getElementById('playlist-drawer'),
    closePlaylist = document.getElementById('close-playlist'),
    playlistContent = document.getElementById('playlist-content'),
    favoriteBtn = document.getElementById('favorite-btn'),
    searchInput = document.getElementById('search-input'),
    tabBtns = document.querySelectorAll('.tab-btn'),
    profileBtns = document.querySelectorAll('.profile-btn'),
    utilityBtn = document.getElementById('utility-btn'),
    utilityDrawer = document.getElementById('utility-drawer'),
    closeUtility = document.getElementById('close-utility'),
    speedBtns = document.querySelectorAll('.speed-btn'),
    timerBtns = document.querySelectorAll('.timer-btn'),
    timerStatus = document.getElementById('timer-status'),
    visualizer = document.getElementById('visualizer'),
    statToday = document.getElementById('stat-today'),
    statWeek = document.getElementById('stat-week'),
    rankingBoard = document.getElementById('ranking-board'),
    currentProfileName = document.getElementById('current-profile-name'),
    colorCanvas = document.getElementById('color-extractor'),
    themeToggle = document.getElementById('theme-toggle');

const music = new Audio();

const baseSongs = [
    { id: 0, path: 'assets/laviem.mp3', displayName: 'SUU TAM', cover: 'assets/11.png', artist: 'SoundCloud' },
    { id: 1, path: 'assets/timem.mp3', displayName: 'SUU TAM', cover: 'assets/10.png', artist: 'SoundCloud' },
    { id: 2, path: 'assets/ty1d.mp3', displayName: 'SUU TAM', cover: 'assets/6.png', artist: 'SoundCloud' },
    { id: 3, path: 'assets/biendaovaem.mp3', displayName: 'Biển Đảo Và Em', cover: 'assets/7.png', artist: 'SoundCloud' },
    { id: 4, path: 'assets/mashup.mp3', displayName: 'SUU TAM', cover: 'assets/5.png', artist: 'SoundCloud' },
    { id: 5, path: 'assets/quaduroi.mp3', displayName: 'Quá Đủ Rồi', cover: 'assets/8.png', artist: 'SoundCloud' },
    { id: 6, path: 'assets/NNTCC.mp3', displayName: 'Nếu Như Ta Chẳng Còn', cover: 'assets/2.jpg', artist: 'MCK' },
    { id: 7, path: 'assets/kesaytinh.mp3', displayName: 'Kẻ Say Tình', cover: 'assets/9.png', artist: 'Quốc Thiên' },
    { id: 8, path: 'assets/denkhinao.mp3', displayName: '....', cover: 'assets/ly.png', artist: 'Artist' },
    { id: 9, path: 'assets/50F.mp3', displayName: '50 Feet', cover: 'assets/lamine.jpg', artist: 'Somo' },
    { id: 10, path: 'assets/vangogh.mp3', displayName: 'Van Gogh', cover: 'assets/paris.jpg', artist: 'Dept Ft AA' },
    { id: 11, path: 'assets/CRY.mp3', displayName: 'Cry', cover: 'assets/4.png', artist: 'Cigarettes After Sex' },
    { id: 12, path: 'assets/BAAB.mp3', displayName: 'Justin Playlist', cover: 'assets/3.jpg', artist: 'Justin Bieber' }
];

let currentUser = 'tri';
let currentProfileDisplayName = 'Trí';
let songs = [];
let playQueue = [];
let currentTab = 'all';
let searchQuery = '';

const profileMap = {
    'tri': 'Trí',
    'khanh': 'Khánh Piggy',
    'user': 'User'
};

function initUserSongs() {
    const savedFavs = localStorage.getItem(`aurora_favorites_${currentUser}`);
    let favIds = savedFavs ? JSON.parse(savedFavs) : [];

    songs = baseSongs.map(song => ({
        ...song,
        isFavorite: favIds.includes(song.id)
    }));
}

function saveFavoritesToStorage() {
    const favIds = songs.filter(song => song.isFavorite).map(song => song.id);
    localStorage.setItem(`aurora_favorites_${currentUser}`, JSON.stringify(favIds));
}

function extractColorAndApply(imgElement) {
    const ctx = colorCanvas.getContext('2d');
    colorCanvas.width = 50;
    colorCanvas.height = 50;
    try {
        ctx.drawImage(imgElement, 0, 0, 50, 50);
        const p = ctx.getImageData(10, 10, 1, 1).data;
        const rgb = `${p[0]}, ${p[1]}, ${p[2]}`;
        const hex = `#${((1 << 24) + (p[0] << 16) + (p[1] << 8) + p[2]).toString(16).slice(1)}`;
        
        document.documentElement.style.setProperty('--dynamic-color', hex);
        document.documentElement.style.setProperty('--dynamic-rgb', rgb);
    } catch (e) {
        document.documentElement.style.setProperty('--dynamic-color', '#a855f7');
        document.documentElement.style.setProperty('--dynamic-rgb', '168, 85, 247');
    }
}

function getTodayKey() {
    return new Date().toISOString().slice(0, 10);
}

function addListeningTime(seconds) {
    if (isNaN(seconds) || seconds <= 0) return;
    const today = getTodayKey();
    let dayData = JSON.parse(localStorage.getItem(`aurora_stats_${currentUser}_${today}`)) || { totalSeconds: 0 };
    dayData.totalSeconds += seconds;
    localStorage.setItem(`aurora_stats_${currentUser}_${today}`, JSON.stringify(dayData));
    updateStatsDisplay();
}

function formatDurationText(totalSeconds) {
    totalSeconds = Math.floor(totalSeconds || 0);
    if (totalSeconds < 60) return `${totalSeconds} giây`;
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins < 60) {
        return secs > 0 ? `${mins} phút ${secs} giây` : `${mins} phút`;
    }
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours} giờ ${remainingMins} phút`;
}

function updateStatsDisplay() {
    currentProfileName.textContent = currentProfileDisplayName;
    const today = getTodayKey();
    
    const todayData = JSON.parse(localStorage.getItem(`aurora_stats_${currentUser}_${today}`)) || { totalSeconds: 0 };
    statToday.textContent = formatDurationText(todayData.totalSeconds);
    
    let weekSeconds = 0;
    for (let i = 0; i < 7; i++) {
        let d = new Date();
        d.setDate(d.getDate() - i);
        let dateKey = d.toISOString().slice(0, 10);
        let dData = JSON.parse(localStorage.getItem(`aurora_stats_${currentUser}_${dateKey}`));
        if (dData) weekSeconds += dData.totalSeconds;
    }
    statWeek.textContent = formatDurationText(weekSeconds);
    
    // Tính tổng thời gian của từng profile để xếp hạng Top 1, 2, 3
    let rankingList = [];
    Object.keys(profileMap).forEach(userKey => {
        let userTotal = 0;
        for (let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i);
            if (key && key.startsWith(`aurora_stats_${userKey}_`)) {
                let data = JSON.parse(localStorage.getItem(key));
                if (data && data.totalSeconds) {
                    userTotal += data.totalSeconds;
                }
            }
        }
        rankingList.push({ name: profileMap[userKey], total: userTotal });
    });

    // Sắp xếp giảm dần theo thời gian nghe
    rankingList.sort((a, b) => b.total - a.total);

    // Render Bảng Xếp Hạng Top 1, 2, 3
    rankingBoard.innerHTML = `<div class="ranking-title"><i class="fa-solid fa-trophy" style="color:#f59e0b;"></i> Bảng Xếp Hạng Nghe Nhạc</div>`;
    rankingList.forEach((item, index) => {
        let rankClass = 'rank-other';
        if (index === 0) rankClass = 'rank-1';
        else if (index === 1) rankClass = 'rank-2';
        else if (index === 2) rankClass = 'rank-3';

        rankingBoard.innerHTML += `
            <div class="rank-row">
                <div class="rank-left">
                    <span class="rank-badge ${rankClass}">${index + 1}</span>
                    <span>${item.name}</span>
                </div>
                <span class="rank-time">${formatDurationText(item.total)}</span>
            </div>
        `;
    });
}

let musicIndex = 0;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;
let sleepTimer = null;
let remainingTime = 0;
let listeningInterval = null;

function togglePlay() {
    if (isPlaying) {
        pauseMusic();
    } else {
        playMusic();
    }
}

function playMusic() {
    isPlaying = true;
    playBtn.classList.replace('fa-play', 'fa-pause');
    playBtn.setAttribute('title', 'Pause');
    vinylDisc.classList.add('spinning');
    vinylNeedle.classList.add('playing');
    visualizer.classList.add('active');
    music.play();
    
    if (!listeningInterval) {
        listeningInterval = setInterval(() => {
            if (isPlaying) {
                addListeningTime(1);
            }
        }, 1000);
    }
    renderPlaylist();
}

function pauseMusic() {
    isPlaying = false;
    playBtn.classList.replace('fa-pause', 'fa-play');
    playBtn.setAttribute('title', 'Play');
    vinylDisc.classList.remove('spinning');
    vinylNeedle.classList.remove('playing');
    visualizer.classList.remove('active');
    music.pause();

    if (listeningInterval) {
        clearInterval(listeningInterval);
        listeningInterval = null;
    }
}

function loadMusic(index) {
    musicIndex = index;
    const song = songs[musicIndex];
    music.src = song.path;
    title.textContent = song.displayName;
    artist.textContent = song.artist;
    image.src = song.cover;
    background.src = song.cover;
    
    image.onload = () => {
        extractColorAndApply(image);
    };
    
    if (song.isFavorite) {
        favoriteBtn.classList.add('favorited');
    } else {
        favoriteBtn.classList.remove('favorited');
    }
    renderPlaylist();
}

function getFilteredSongs() {
    return songs.filter(song => {
        let matchesTab = true;
        if (currentTab === 'fav') {
            matchesTab = song.isFavorite;
        } else if (currentTab === 'queue') {
            matchesTab = playQueue.includes(song.id);
        }
        
        const matchesSearch = song.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              song.artist.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });
}

function changeMusic(direction) {
    if (playQueue.length > 0 && direction === 1) {
        const nextQueueSongId = playQueue.shift();
        const originalIndex = songs.findIndex(s => s.id === nextQueueSongId);
        if (originalIndex !== -1) {
            loadMusic(originalIndex);
            playMusic();
            return;
        }
    }

    let playableSongs = getFilteredSongs();
    if (playableSongs.length === 0) {
        playableSongs = songs;
    }

    let currentFilteredIndex = playableSongs.findIndex(s => s.id === songs[musicIndex].id);

    if (currentFilteredIndex === -1) {
        currentFilteredIndex = 0;
    } else {
        if (isShuffle) {
            let randomIndex;
            do {
                randomIndex = Math.floor(Math.random() * playableSongs.length);
            } while (randomIndex === currentFilteredIndex && playableSongs.length > 1);
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
    if (isRepeat) {
        music.currentTime = 0;
        playMusic();
    } else {
        changeMusic(1);
    }
}

function updateProgressBar() {
    const { duration, currentTime } = music;
    if (isNaN(duration)) return;
    const progressPercent = (currentTime / duration) * 100;
    progress.style.width = `${progressPercent}%`;

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };
    durationEl.textContent = formatTime(duration);
    currentTimeEl.textContent = formatTime(currentTime);
}

function setProgressBar(e) {
    const width = playerProgress.clientWidth;
    const clickX = e.offsetX;
    music.currentTime = (clickX / width) * music.duration;
}

function setVolume(e) {
    const vol = parseFloat(e.target.value);
    music.volume = vol;
    if (vol === 0) {
        music.muted = true;
    } else {
        music.muted = false;
    }
    updateVolumeIcon(vol);
}

function updateVolumeIcon(vol) {
    volumeIcon.className = 'fa-solid';
    if (vol == 0) {
        volumeIcon.classList.add('fa-volume-xmark');
    } else if (vol < 0.5) {
        volumeIcon.classList.add('fa-volume-low');
    } else {
        volumeIcon.classList.add('fa-volume-high');
    }
}

let lastVolume = 0.5;
function toggleMute() {
    if (music.volume > 0 && !music.muted) {
        lastVolume = music.volume;
        music.volume = 0;
        music.muted = true;
        volumeSlider.value = 0;
        updateVolumeIcon(0);
    } else {
        music.volume = lastVolume || 0.5;
        music.muted = false;
        volumeSlider.value = music.volume;
        updateVolumeIcon(music.volume);
    }
}

function formatTime(seconds) {
    if (isNaN(seconds)) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

function renderPlaylist() {
    playlistContent.innerHTML = '';
    const filtered = getFilteredSongs();
    
    if (filtered.length === 0) {
        playlistContent.innerHTML = `<p class="no-result" style="color:var(--text-secondary); text-align:center; padding:15px;">Không tìm thấy bài hát</p>`;
        return;
    }

    filtered.forEach((song) => {
        const originalIndex = songs.findIndex(s => s.id === song.id);
        const item = document.createElement('div');
        item.classList.add('playlist-item');
        if (originalIndex === musicIndex) item.classList.add('active');
        
        const isInQueue = playQueue.includes(song.id);

        item.innerHTML = `
            <img src="${song.cover}" alt="">
            <div class="playlist-song-info">
                <h4>${song.displayName} ${isInQueue ? '<span class="queue-badge">Kế tiếp</span>' : ''}</h4>
                <p>${song.artist}</p>
            </div>
            <div class="playlist-actions">
                <i class="fa-solid ${isInQueue ? 'fa-check-to-slot in-queue' : 'fa-list-check playlist-queue-btn'}" title="${isInQueue ? 'Đã trong hàng đợi' : 'Thêm vào phát tiếp theo'}" data-id="${song.id}"></i>
                <i class="fa-solid fa-heart playlist-heart ${song.isFavorite ? 'favorited' : ''}" data-id="${song.id}"></i>
            </div>
            <span class="playlist-duration" id="duration-${song.id}">--:--</span>
        `;

        const tempAudio = new Audio(song.path);
        tempAudio.addEventListener('loadedmetadata', () => {
            const durationEl = document.getElementById(`duration-${song.id}`);
            if (durationEl) {
                durationEl.textContent = formatTime(tempAudio.duration);
            }
        });

        item.addEventListener('click', (e) => {
            if (e.target.closest('.playlist-actions')) return;
            loadMusic(originalIndex);
            playMusic();
            playlistDrawer.classList.remove('active');
        });

        const queueBtn = item.querySelector('.fa-solid.fa-list-check, .fa-solid.fa-check-to-slot');
        queueBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!playQueue.includes(song.id)) {
                playQueue.push(song.id);
            } else {
                playQueue = playQueue.filter(id => id !== song.id);
            }
            renderPlaylist();
        });

        const heartIcon = item.querySelector('.playlist-heart');
        heartIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            song.isFavorite = !song.isFavorite;
            saveFavoritesToStorage();
            if (originalIndex === musicIndex) {
                favoriteBtn.classList.toggle('favorited', song.isFavorite);
            }
            renderPlaylist();
        });

        playlistContent.appendChild(item);
    });
}

searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    renderPlaylist();
});

themeToggle.addEventListener('click', () => {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    if (currentTheme === 'dark') {
        html.setAttribute('data-theme', 'light');
        themeToggle.classList.replace('fa-moon', 'fa-sun');
    } else {
        html.setAttribute('data-theme', 'dark');
        themeToggle.classList.replace('fa-sun', 'fa-moon');
    }
});

speedBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        speedBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        music.playbackRate = parseFloat(btn.getAttribute('data-speed'));
    });
});

timerBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        timerBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const minutes = parseInt(btn.getAttribute('data-time'));

        if (sleepTimer) clearInterval(sleepTimer);
        if (minutes === 0) {
            timerStatus.textContent = "Chưa hẹn giờ";
            return;
        }

        remainingTime = minutes * 60;
        timerStatus.textContent = `Tắt sau: ${minutes} phút`;

        sleepTimer = setInterval(() => {
            remainingTime--;
            const mins = Math.floor(remainingTime / 60);
            const secs = remainingTime % 60;
            timerStatus.textContent = `Tắt sau: ${mins}m ${secs}s`;

            if (remainingTime <= 0) {
                clearInterval(sleepTimer);
                pauseMusic();
                timerStatus.textContent = "Đã tắt nhạc theo hẹn giờ";
            }
        }, 1000);
    });
});

playBtn.addEventListener('click', togglePlay);
prevBtn.addEventListener('click', () => changeMusic(-1));
nextBtn.addEventListener('click', () => changeMusic(1));
music.addEventListener('ended', handleSongEnd);
music.addEventListener('timeupdate', updateProgressBar);
playerProgress.addEventListener('click', setProgressBar);

volumeSlider.addEventListener('input', setVolume);
volumeIcon.addEventListener('click', toggleMute);

shuffleBtn.addEventListener('click', () => {
    isShuffle = !isShuffle;
    shuffleBtn.classList.toggle('active', isShuffle);
});

repeatBtn.addEventListener('click', () => {
    isRepeat = !isRepeat;
    repeatBtn.classList.toggle('active', isRepeat);
});

favoriteBtn.addEventListener('click', () => {
    songs[musicIndex].isFavorite = !songs[musicIndex].isFavorite;
    saveFavoritesToStorage();
    favoriteBtn.classList.toggle('favorited', songs[musicIndex].isFavorite);
    renderPlaylist();
});

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTab = btn.getAttribute('data-tab');
        renderPlaylist();
    });
});

profileBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        profileBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentUser = btn.getAttribute('data-user');
        currentProfileDisplayName = profileMap[currentUser];
        
        initUserSongs();
        loadMusic(musicIndex);
        updateStatsDisplay();
        renderPlaylist();
    });
});

playlistBtn.addEventListener('click', () => {
    playlistDrawer.classList.toggle('active');
    renderPlaylist();
});
closePlaylist.addEventListener('click', () => playlistDrawer.classList.remove('active'));

utilityBtn.addEventListener('click', () => {
    utilityDrawer.classList.toggle('active');
    updateStatsDisplay();
});
closeUtility.addEventListener('click', () => utilityDrawer.classList.remove('utility-drawer'));

initUserSongs();
loadMusic(musicIndex);
updateStatsDisplay();
renderPlaylist();