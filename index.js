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
    timerDisplay = document.getElementById('timer-display'),
    cdElement = document.getElementById('cd-element'),
    visualizerBars = document.getElementById('visualizer-bars');

const music = new Audio();

const baseSongs = [
    { id: 0, path: 'assets/laviem.mp3', displayName: 'SUU TAM', cover: 'assets/4.jpg', artist: 'SoundCloud' },
    { id: 1, path: 'assets/timem.mp3', displayName: 'SUU TAM', cover: 'assets/2.jpg', artist: 'SoundCloud' },
    { id: 2, path: 'assets/ty1d.mp3', displayName: 'SUU TAM', cover: 'assets/3.jpg', artist: 'SoundCloud' },
    { id: 3, path: 'assets/mashup.mp3', displayName: 'SUU TAM', cover: 'assets/5.png', artist: 'SoundCloud' },
    { id: 4, path: 'assets/biendaovaem.mp3', displayName: 'BIEN DAO & EM', cover: 'assets/8.mp4', artist: 'SoundCloud' },
    { id: 5, path: 'assets/amthambenem.mp3', displayName: 'AM THAM BEN EM', cover: 'assets/6.png', artist: 'SoundCloud' },
    { id: 7, path: 'assets/quaduroi.mp3', displayName: 'QUA DU ROI', cover: 'assets/7.png', artist: 'SoundCloud' },
    { id: 6, path: 'assets/anhsairoi.mp3', displayName: 'ANH SAI ROI', cover: 'assets/5.png', artist: 'SoundCloud' },
    { id: 8, path: 'assets/NNTCC.mp3', displayName: 'NEU NHU TA CHANG CON', cover: 'assets/7.png', artist: 'MCK' },
    { id: 9, path: 'assets/kesaytinh.mp3', displayName: 'KE SAY TINH', cover: 'assets/8.jpg', artist: 'QUOC THIEN' },
    { id: 10, path: 'assets/denkhinao.mp3', displayName: '....', cover: 'assets/9.jpg', artist: 'Artist' },
    { id: 11, path: 'assets/50F.mp3', displayName: '50 Feet', cover: 'assets/10.jpg', artist: 'Somo' },
    { id: 12, path: 'assets/vangogh.mp3', displayName: 'Van Gogh', cover: 'assets/11.jpg', artist: 'Dept Ft AA' },
    { id: 13, path: 'assets/CRY.mp3', displayName: 'Cry', cover: 'assets/12.jpg', artist: 'Cigarettes After Sex' },
    { id: 14, path: 'assets/BAAB.mp3', displayName: 'Justin Playlist', cover: 'assets/13.jpg', artist: 'Justin Bieber' }
];

let songs = [];
let musicIndex = 0;
let isShuffle = false;
let isRepeat = false;
let currentTab = 'all';

let sleepTimer = null;
let countdownInterval = null;

function initSongs() {
    const savedFavs = localStorage.getItem('aurora_favorites_tri');
    let favIds = savedFavs ? JSON.parse(savedFavs) : [];
    songs = baseSongs.map(song => ({ ...song, isFavorite: favIds.includes(song.id) }));
}

function saveFavorites() {
    const favIds = songs.filter(song => song.isFavorite).map(song => song.id);
    localStorage.setItem('aurora_favorites_tri', JSON.stringify(favIds));
}

function getFilteredSongs() {
    if (currentTab === 'fav') return songs.filter(s => s.isFavorite);
    return songs;
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
}

function loadMusic(index) {
    musicIndex = index;
    const song = songs[musicIndex];
    music.src = song.path;
    title.textContent = song.displayName;
    artist.textContent = song.artist;
    
    document.getElementById('track-count').textContent = `TRACK ${musicIndex + 1} OF ${songs.length}`;

    if (song.cover) {
        mainBg.style.opacity = 0; 
        setTimeout(() => {
            const img = new Image();
            img.onload = () => { 
                mainBg.src = song.cover; 
                cdElement.style.backgroundImage = `url('${song.cover}')`; // Ép ảnh vào đĩa CD
                mainBg.style.opacity = 1; 
            };
            img.onerror = () => { 
                mainBg.src = 'assets/1.jpg'; 
                cdElement.style.backgroundImage = `url('assets/1.jpg')`; 
                mainBg.style.opacity = 1; 
            }; 
            img.src = song.cover;
        }, 300); 
    }

    if(currentTab !== 'settings') renderPlaylist();
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
    durationEl.textContent = formatTime(duration);
    currentTimeEl.textContent = formatTime(currentTime);
}

function setProgressBar(e) {
    const width = playerProgress.clientWidth;
    music.currentTime = (e.offsetX / width) * music.duration;
}

function setVolume(e) {
    const vol = parseFloat(e.target.value);
    music.volume = vol;
    music.muted = vol === 0;
    volumeIcon.className = 'fa-solid ' + (vol === 0 ? 'fa-volume-xmark' : (vol < 0.5 ? 'fa-volume-low' : 'fa-volume-high'));
}

function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

function renderPlaylist() {
    playlistContent.innerHTML = '';
    let displaySongs = getFilteredSongs();
    if (displaySongs.length === 0) {
        playlistContent.innerHTML = '<p style="color:#ddd; text-align:center; font-size:13px; margin-top:20px; text-shadow: 0 1px 3px rgba(0,0,0,0.8);">Trống.</p>';
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
                <i class="${heartClass} favorite-btn"></i>
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

        item.querySelector('.favorite-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            songs[originalIndex].isFavorite = !songs[originalIndex].isFavorite;
            saveFavorites(); renderPlaylist();
        });

        playlistContent.appendChild(item);
    });
}

document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        music.playbackRate = parseFloat(btn.getAttribute('data-speed'));
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
            return;
        }

        let remainingSecs = minutes * 60;
        timerDisplay.textContent = `Tự động tắt nhạc sau: ${formatTime(remainingSecs)}`;

        countdownInterval = setInterval(() => {
            remainingSecs--;
            if (remainingSecs <= 0) clearInterval(countdownInterval);
            else timerDisplay.textContent = `Tự động tắt nhạc sau: ${formatTime(remainingSecs)}`;
        }, 1000);

        sleepTimer = setTimeout(() => {
            pauseMusic();
            timerDisplay.textContent = 'Đã tắt nhạc';
            document.querySelectorAll('.timer-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('.timer-btn[data-time="0"]').classList.add('active');
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

shuffleBtn.addEventListener('click', () => { isShuffle = !isShuffle; shuffleBtn.classList.toggle('active', isShuffle); });
repeatBtn.addEventListener('click', () => { isRepeat = !isRepeat; repeatBtn.classList.toggle('active', isRepeat); });
playlistToggleBtn.addEventListener('click', () => playlistDrawer.classList.toggle('active'));

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTab = btn.getAttribute('data-tab');
        
        if (currentTab === 'settings') {
            playlistContent.classList.remove('active');
            settingsContent.classList.add('active');
        } else {
            settingsContent.classList.remove('active');
            playlistContent.classList.add('active');
            renderPlaylist();
        }
    });
});

document.addEventListener('keydown', (e) => {
    if (e.target.tagName.toLowerCase() === 'input') return;
    if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); togglePlay(); }
});

initSongs();
loadMusic(musicIndex);