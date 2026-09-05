const image = document.getElementById('cover'),
    title = document.getElementById('music-title'),
    artist = document.getElementById('music-artist'),
    currentTimeEl = document.getElementById('current-time'),
    durationEl = document.getElementById('duration'),
    progress = document.getElementById('progress'),
    playerProgress = document.getElementById('player-progress'),
    prevBtn = document.getElementById('prev'),
    nextBtn = document.getElementById('next'),
    playBtn = document.getElementById('play'),
    background = document.getElementById('bg-img'),
    volumeSlider = document.getElementById('volume-slider'),
    volumeIcon = document.getElementById('volume-icon');

const music = new Audio();

const songs = [

     {
        path: 'assets/ty1d.mp3',
        displayName: '我真的很想你',
        cover: 'assets/6.png',    
        artist: 'SOUNDCLOUD',
    },

    {
        path: 'assets/biendaovaem.mp3',
        displayName: 'BIỂN ĐẢO & EM',
        cover: 'assets/7.png',    
        artist: 'SOUNDCLOUD',
    },

     {
        path: 'assets/mashup.mp3',
        displayName: 'PHUNG ĐỘPAMINEZZ',
        cover: 'assets/5.png',
        artist: 'SOUNDCLOUD',
    },

     {
        path: 'assets/quaduroi.mp3',
        displayName: 'QUÁ ĐỦ RỒI',
        cover: 'assets/8.png',
        artist: 'SOUNDCLOUD',
    },

    {
        path: 'assets/NNTCC.mp3',
        displayName: 'NẾU NHƯ TA CHẲNG CÒN',
        cover: 'assets/2.jpg',
        artist: 'MCK',
    },

    {
        path: 'assets/kesaytinh.mp3',
        displayName: 'KẺ SAY TÌNH',
        cover: 'assets/9.png',
        artist: 'QUỐC THIÊN',
    },

    {
        path: 'assets/denkhinao.mp3',
        displayName: '♥',
        cover: 'assets/ly.png',
        artist: '☻',
    },

    {
        path: 'assets/50F.mp3',
        displayName: '50 FEET',
        cover: 'assets/lamine.jpg',
        artist: 'SOMO',
    },

    {
        path: 'assets/vangogh.mp3',
        displayName: 'VAN GOGH',
        cover: 'assets/paris.jpg',    
        artist: 'DEPT Ft AA',
    },

     {
        path: 'assets/CRY.mp3',
        displayName: 'CRY',
        cover: 'assets/4.png',    
        artist: 'Cigarettes After Sex',
    },

    {
        path: 'assets/BAAB.mp3',
        displayName: 'Justin Playlist',
        cover: 'assets/3.jpg',
        artist: 'Justin Beiber',
    },
    
];

let musicIndex = 0;
let isPlaying = false;
let lastVolume = 1;

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
    music.play();
}

function pauseMusic() {
    isPlaying = false;
    playBtn.classList.replace('fa-pause', 'fa-play');
    playBtn.setAttribute('title', 'Play');
    music.pause();
}

function loadMusic(song) {
    music.src = song.path;
    title.textContent = song.displayName;
    artist.textContent = song.artist;
    image.src = song.cover;
    background.src = song.cover;
}

function changeMusic(direction) {
    musicIndex = (musicIndex + direction + songs.length) % songs.length;
    loadMusic(songs[musicIndex]);
    playMusic();
}

function updateProgressBar() {
    const { duration, currentTime } = music;
    const progressPercent = (currentTime / duration) * 100;
    progress.style.width = `${progressPercent}%`;

    const formatTime = (time) => String(Math.floor(time)).padStart(2, '0');
    durationEl.textContent = `${formatTime(duration / 60)}:${formatTime(duration % 60)}`;
    currentTimeEl.textContent = `${formatTime(currentTime / 60)}:${formatTime(currentTime % 60)}`;
}

function setProgressBar(e) {
    const width = playerProgress.clientWidth;
    const clickX = e.offsetX;
    music.currentTime = (clickX / width) * music.duration;
}

function setVolume(e) {
    const vol = e.target.value;
    music.volume = vol;
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

function toggleMute() {
    if (music.volume > 0) {
        lastVolume = music.volume;
        music.volume = 0;
        volumeSlider.value = 0;
        updateVolumeIcon(0);
    } else {
        music.volume = lastVolume || 0.5;
        volumeSlider.value = music.volume;
        updateVolumeIcon(music.volume);
    }
}

playBtn.addEventListener('click', togglePlay);
prevBtn.addEventListener('click', () => changeMusic(-1));
nextBtn.addEventListener('click', () => changeMusic(1));
music.addEventListener('ended', () => changeMusic(1));
music.addEventListener('timeupdate', updateProgressBar);
playerProgress.addEventListener('click', setProgressBar);

volumeSlider.addEventListener('input', setVolume);
volumeIcon.addEventListener('click', toggleMute);

loadMusic(songs[musicIndex]);