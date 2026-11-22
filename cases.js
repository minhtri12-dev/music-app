(() => {
    'use strict';

    const root = document.getElementById('case-files');
    const switcher = document.getElementById('mode-switcher');
    if (!root || !switcher) return;

    const RAW = window.CASE_FILES_DATA || {};
    const body = document.body;
    const podcast = new Audio();
    podcast.preload = 'metadata';

    const canAdjustVolume = (() => { const probe = new Audio(); probe.volume = 0.5; return probe.volume === 0.5; })();

    const LABELS = {
        status: Object.assign({ solved: 'Solved', unsolved: 'Unsolved', ongoing: 'Ongoing', unverified: 'Unverified', demo: 'Demo' }, RAW.statusLabels),
        rights: { licensed: 'Audio licensed', pending: 'Rights pending', none: 'No audio yet', demo: 'Demo' },
        fact: { confirmed: 'Confirmed', alleged: 'Alleged', theory: 'Theory' }
    };
    const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];
    const SLEEP_OPTIONS = [['off', 'Off'], [15, '15 min'], [30, '30 min'], [45, '45 min'], [60, '60 min'], ['end', 'End of episode']];
    const HUES = [28, 36, 200, 214, 158, 350];
    const YT_ID = /^[\w-]{11}$/;

    const $ = (sel, ctx = root) => ctx.querySelector(sel);
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const fold = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
    const pad = (n) => String(n).padStart(2, '0');
    const toast = (msg) => { if (typeof showToast === 'function') showToast(msg); };
    const store = {
        get(key, fallback) { try { const v = localStorage.getItem('cf_' + key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; } },
        set(key, value) { try { localStorage.setItem('cf_' + key, JSON.stringify(value)); } catch (e) {} }
    };
    const fmt = (sec) => {
        if (!isFinite(sec) || sec < 0) return '0:00';
        sec = Math.floor(sec);
        const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
        return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
    };
    const hue = (seed) => { let h = 0; for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return HUES[h % HUES.length]; };

    const ytId = (ep) => (YT_ID.test(ep.youtubeVideoId || '') ? ep.youtubeVideoId : '');
    const ytUrl = (ep) => {
        const u = String(ep.youtubeUrl || '');
        if (/^https:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\//i.test(u)) return u;
        const id = ytId(ep);
        return id ? `https://www.youtube.com/watch?v=${id}` : '';
    };
    const isYouTubeHost = (u) => /(youtube\.com|youtu\.be|googlevideo\.com|ytimg\.com)/i.test(u);
    const isPlayable = (ep) => !!ep && ep.rightsStatus === 'licensed' && typeof ep.audioUrl === 'string' && ep.audioUrl.trim() !== '' && !isYouTubeHost(ep.audioUrl);
    const thumbFor = (ep) => ep.thumbnail || (ytId(ep) ? `https://i.ytimg.com/vi/${ytId(ep)}/hqdefault.jpg` : '');

    const sources = (Array.isArray(RAW.sources) ? RAW.sources : []).map((s) => ({ id: String(s.id), name: s.name || String(s.id), channelUrl: s.channelUrl || '' }));
    const sourceById = new Map(sources.map((s) => [s.id, s]));
    const sourceName = (id) => (sourceById.get(id) || { name: id || 'Unknown source' }).name;

    const cases = [];
    const caseById = new Map();
    const epById = new Map();
    const seenTitles = new Set();

    (Array.isArray(RAW.cases) ? RAW.cases : []).forEach((c) => {
        if (!c || !c.id) return;
        if (caseById.has(c.id)) { console.warn('[CaseFiles] Duplicate case id skipped:', c.id); return; }
        const titleKey = fold(c.title) + '|' + (c.year || '');
        if (c.title && seenTitles.has(titleKey)) console.warn('[CaseFiles] Possible duplicate case (same title and year):', c.id);
        seenTitles.add(titleKey);
        const item = Object.assign({}, c, { facts: Array.isArray(c.facts) ? c.facts : [], episodes: [] });
        (Array.isArray(c.episodes) ? c.episodes : []).forEach((e, i) => {
            const ep = Object.assign({}, e, { id: e.id || `${c.id}-E${pad(i + 1)}`, caseId: c.id });
            if (epById.has(ep.id)) { console.warn('[CaseFiles] Duplicate episode id skipped:', ep.id); return; }
            item.episodes.push(ep);
            epById.set(ep.id, ep);
        });
        item._hay = fold([item.id, item.title, item.country, item.year, item.category, item.synopsis]
            .concat(item.episodes.map((e) => `${e.title} ${sourceName(e.sourceChannel)}`)).join(' '));
        cases.push(item);
        caseById.set(item.id, item);
    });

    const coverFor = (c) => c.cover || c.episodes.map(thumbFor).find(Boolean) || '';

    const state = {
        mode: 'music',
        view: 'home',
        backView: 'home',
        caseId: null,
        query: '',
        source: store.get('source', 'all'),
        favorites: new Set(store.get('favorites', [])),
        positions: store.get('positions', {}) || {},
        recent: store.get('recent', []) || [],
        queue: store.get('queue', []) || [],
        currentId: store.get('current', null),
        speed: Number(store.get('speed', 1)) || 1,
        sleep: 'off',
        playerOpen: false,
        queueOpen: false
    };
    if (state.source !== 'all' && !sourceById.has(state.source)) state.source = 'all';
    if (!SPEEDS.includes(state.speed)) state.speed = 1;

    let pendingSeek = 0;
    let seeking = false;
    let seekRatio = 0;
    let lastSave = 0;
    let homeScroll = 0;
    let searchTimer = null;
    let switchTimer = null;
    let sleepTimer = null;
    let sleepTick = null;
    let sleepEnd = 0;
    let fadeTimer = null;

    const speedPills = SPEEDS.map((s) => `<button type="button" class="cf-pill" data-action="speed" data-speed="${s}">${s}×</button>`).join('');
    const sleepPills = SLEEP_OPTIONS.map(([id, label]) => `<button type="button" class="cf-pill" data-action="sleep" data-sleep="${id}">${label}</button>`).join('');

    root.innerHTML = `
    <div class="cf-scroll" id="cf-scroll">
        <div class="cf-page">
            <header class="cf-header" id="cf-header">
                <div class="cf-brand">
                    <span class="cf-eyebrow">Archive · Podcast Library</span>
                    <h1 class="cf-logo">Case <em>Files</em></h1>
                    <p class="cf-tagline">Thư viện podcast về các vụ án, bí ẩn và những câu chuyện có thật — tổng hợp từ hai kênh Tra Án và Duy7ham.</p>
                </div>
                <div class="cf-tools">
                    <label class="cf-search">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <input id="cf-search" type="search" placeholder="Search cases, episodes, countries…" autocomplete="off" spellcheck="false" enterkeyhint="search" aria-label="Search Case Files">
                    </label>
                    <button type="button" class="cf-btn cf-favs-btn" id="cf-favs-btn" data-action="toggle-favs-view"><i class="fa-solid fa-heart"></i><span>Favorites</span><b id="cf-favs-count">0</b></button>
                </div>
            </header>
            <div id="cf-page-body"></div>
        </div>
    </div>

    <div class="cf-mini" id="cf-mini" hidden>
        <div class="cf-mini-progress"><span id="cf-mini-bar"></span></div>
        <button type="button" class="cf-mini-main" data-action="open-player" aria-label="Open player">
            <span class="cf-mini-art" id="cf-mini-art"></span>
            <span class="cf-mini-text"><strong id="cf-mini-title"></strong><span id="cf-mini-sub"></span></span>
        </button>
        <div class="cf-mini-controls">
            <button type="button" class="cf-icon-btn cf-mini-skip" data-action="skip-back" aria-label="Back 15 seconds"><i class="fa-solid fa-rotate-left"></i></button>
            <button type="button" class="cf-icon-btn cf-mini-play" id="cf-mini-play" data-action="toggle-play" aria-label="Play"><i class="fa-solid fa-play"></i></button>
            <button type="button" class="cf-icon-btn cf-mini-skip" data-action="skip-fwd" aria-label="Forward 30 seconds"><i class="fa-solid fa-rotate-right"></i></button>
            <button type="button" class="cf-icon-btn" data-action="next" aria-label="Next episode"><i class="fa-solid fa-forward-step"></i></button>
        </div>
    </div>

    <section class="cf-sheet cf-player" id="cf-player" aria-hidden="true" aria-label="Now playing" inert>
        <div class="cf-sheet-bar">
            <button type="button" class="cf-icon-btn" data-action="close-player" aria-label="Minimize player"><i class="fa-solid fa-chevron-down"></i></button>
            <span class="cf-eyebrow">Now Playing</span>
            <button type="button" class="cf-icon-btn" data-action="open-queue" aria-label="Open queue"><i class="fa-solid fa-list-ul"></i></button>
        </div>
        <div class="cf-player-body">
            <div class="cf-player-art" id="cf-player-art"></div>
            <div class="cf-player-info">
                <div class="cf-player-titles">
                    <h2 id="cf-player-title">—</h2>
                    <button type="button" class="cf-link" id="cf-player-case" data-action="open-case-current">—</button>
                    <span class="cf-player-source" id="cf-player-source"></span>
                </div>
                <button type="button" class="cf-icon-btn cf-fav" id="cf-player-fav" data-action="toggle-fav" data-ep="" aria-label="Toggle favorite" aria-pressed="false"><i class="fa-regular fa-heart"></i></button>
            </div>
            <div class="cf-progress-wrap">
                <div class="cf-progress" id="cf-progress" role="slider" tabindex="0" aria-label="Seek" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
                    <span class="cf-track"><span class="cf-fill" id="cf-fill"></span></span>
                    <i class="cf-knob" id="cf-knob"></i>
                </div>
                <div class="cf-times"><span id="cf-time-cur">0:00</span><span id="cf-time-left">-0:00</span></div>
            </div>
            <div class="cf-controls">
                <button type="button" class="cf-ctl" data-action="prev" aria-label="Previous"><i class="fa-solid fa-backward-step"></i></button>
                <button type="button" class="cf-ctl cf-ctl-skip" data-action="skip-back" aria-label="Back 15 seconds"><i class="fa-solid fa-rotate-left"></i><b>15</b></button>
                <button type="button" class="cf-ctl cf-play" id="cf-play" data-action="toggle-play" aria-label="Play"><i class="fa-solid fa-play"></i></button>
                <button type="button" class="cf-ctl cf-ctl-skip" data-action="skip-fwd" aria-label="Forward 30 seconds"><i class="fa-solid fa-rotate-right"></i><b>30</b></button>
                <button type="button" class="cf-ctl" data-action="next" aria-label="Next"><i class="fa-solid fa-forward-step"></i></button>
            </div>
            <div class="cf-options">
                <div class="cf-opt"><div class="cf-opt-label">Playback speed</div><div class="cf-pills" id="cf-speed">${speedPills}</div></div>
                <div class="cf-opt"><div class="cf-opt-label">Sleep timer<span id="cf-sleep-left"></span></div><div class="cf-pills" id="cf-sleep">${sleepPills}</div></div>
                <div class="cf-opt" id="cf-chapters-wrap" hidden><div class="cf-opt-label">Chapters</div><div class="cf-chapters" id="cf-chapters"></div></div>
            </div>
        </div>
    </section>

    <aside class="cf-sheet cf-queue" id="cf-queue" aria-hidden="true" aria-label="Queue" inert>
        <div class="cf-sheet-bar">
            <button type="button" class="cf-icon-btn" data-action="close-queue" aria-label="Close queue"><i class="fa-solid fa-chevron-down"></i></button>
            <span class="cf-eyebrow">Queue · <span id="cf-queue-count">0</span></span>
            <button type="button" class="cf-btn cf-btn-sm" data-action="queue-clear">Clear</button>
        </div>
        <div class="cf-queue-body"><div class="cf-list" id="cf-queue-list"></div></div>
    </aside>`;

    const el = {
        scroll: $('#cf-scroll'), header: $('#cf-header'), page: $('#cf-page-body'), search: $('#cf-search'),
        favsBtn: $('#cf-favs-btn'), favsCount: $('#cf-favs-count'),
        mini: $('#cf-mini'), miniBar: $('#cf-mini-bar'), miniArt: $('#cf-mini-art'), miniTitle: $('#cf-mini-title'), miniSub: $('#cf-mini-sub'),
        player: $('#cf-player'), playerArt: $('#cf-player-art'), playerTitle: $('#cf-player-title'), playerCase: $('#cf-player-case'),
        playerSource: $('#cf-player-source'), playerFav: $('#cf-player-fav'),
        progress: $('#cf-progress'), fill: $('#cf-fill'), knob: $('#cf-knob'), timeCur: $('#cf-time-cur'), timeLeft: $('#cf-time-left'),
        sleepLeft: $('#cf-sleep-left'), chaptersWrap: $('#cf-chapters-wrap'), chapters: $('#cf-chapters'),
        queue: $('#cf-queue'), queueList: $('#cf-queue-list'), queueCount: $('#cf-queue-count')
    };

    function artHTML(src, label, seed, badges) {
        return `<div class="cf-art" style="--h:${hue(seed)}"><i class="fa-regular fa-folder-open cf-art-icon"></i>${badges ? `<div class="cf-badges">${badges}</div>` : ''}${label ? `<span class="cf-art-label">${esc(label)}</span>` : ''}${src ? `<img src="${esc(src)}" alt="" loading="lazy" decoding="async">` : ''}</div>`;
    }
    function statusBadges(c) {
        let h = '';
        if (c.demo) h += '<span class="cf-badge cf-badge-demo">Demo</span>';
        if (c.status && c.status !== 'demo') h += `<span class="cf-badge">${esc(LABELS.status[c.status] || c.status)}</span>`;
        return h;
    }
    const metaLine = (c) => [c.country, c.year, c.category].filter(Boolean).join(' · ') || 'No classification yet';
    const empty = (title, text) => `<div class="cf-empty"><i class="fa-regular fa-folder-open"></i><strong>${esc(title)}</strong><p>${esc(text)}</p></div>`;
    const favBtn = (id) => `<button type="button" class="cf-icon-btn cf-fav" data-action="toggle-fav" data-ep="${esc(id)}" aria-label="Toggle favorite" aria-pressed="false"><i class="fa-regular fa-heart"></i></button>`;
    const queueBtn = (id) => `<button type="button" class="cf-icon-btn cf-q" data-action="queue-toggle" data-ep="${esc(id)}" aria-label="Add to queue"><i class="fa-solid fa-list-ul"></i></button>`;

    function caseCard(c) {
        const names = [...new Set(c.episodes.map((e) => sourceName(e.sourceChannel)))];
        return `<button type="button" class="cf-card" data-action="open-case" data-case="${esc(c.id)}">
            <span class="cf-ratio">${artHTML(coverFor(c), c.id, c.id, statusBadges(c))}</span>
            <span class="cf-card-body">
                <span class="cf-card-id">${esc(c.id)}</span>
                <span class="cf-card-title">${esc(c.title)}</span>
                <span class="cf-card-meta">${esc(metaLine(c))}</span>
                <span class="cf-chips">${names.map((n) => `<span class="cf-chip">${esc(n)}</span>`).join('')}<span class="cf-chip cf-chip-count">${c.episodes.length} ep</span></span>
            </span>
        </button>`;
    }
    function featureCard(c) {
        return `<button type="button" class="cf-feature" data-action="open-case" data-case="${esc(c.id)}">
            ${artHTML(coverFor(c), '', c.id, statusBadges(c))}
            <span class="cf-feature-body">
                <span class="cf-card-id">${esc(c.id)}</span>
                <span class="cf-feature-title">${esc(c.title)}</span>
                <span class="cf-card-meta">${esc(metaLine(c))}</span>
            </span>
        </button>`;
    }
    function continueCard({ ep, pos }) {
        const ratio = Math.min(100, (pos.t / pos.d) * 100).toFixed(1);
        return `<article class="cf-continue" data-ep-id="${esc(ep.id)}">
            <div class="cf-continue-art">${artHTML(thumbFor(ep), '', ep.id)}</div>
            <div class="cf-continue-main">
                <span class="cf-eyebrow-sm">${esc(sourceName(ep.sourceChannel))}</span>
                <h4>${esc(ep.title)}</h4>
                <div class="cf-meter"><span style="width:${ratio}%"></span></div>
                <div class="cf-continue-foot">
                    <span>${fmt(pos.d - pos.t)} left</span>
                    <button type="button" class="cf-btn cf-btn-primary cf-btn-sm" data-action="play-ep" data-ep="${esc(ep.id)}" data-ctx="continue"><i class="fa-solid fa-play"></i><span class="cf-play-label" data-idle="Continue">Continue</span></button>
                </div>
            </div>
        </article>`;
    }
    function epRow(ep) {
        const playable = isPlayable(ep);
        const url = ytUrl(ep);
        const pos = state.positions[ep.id];
        const meter = playable && pos && pos.d > 0 && pos.t > 5 ? `<div class="cf-meter"><span style="width:${Math.min(100, (pos.t / pos.d) * 100).toFixed(1)}%"></span></div>` : '';
        const duration = typeof ep.duration === 'number' && ep.duration > 0 ? fmt(ep.duration) : 'Duration unverified';
        const rights = LABELS.rights[ep.rightsStatus] || LABELS.rights.none;
        const action = playable
            ? `<button type="button" class="cf-btn cf-btn-primary" data-action="play-ep" data-ep="${esc(ep.id)}" data-ctx="case" data-case="${esc(ep.caseId)}"><i class="fa-solid fa-play"></i><span class="cf-play-label" data-idle="Play">Play</span></button>`
            : `<span class="cf-noaudio">No licensed audio yet</span>${url
                ? `<a class="cf-btn" href="${esc(url)}" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-youtube"></i><span>Open source video</span></a>`
                : '<span class="cf-noaudio">No source video linked</span>'}`;
        return `<article class="cf-ep" data-ep-id="${esc(ep.id)}">
            <div class="cf-ep-thumb">${artHTML(thumbFor(ep), '', ep.id)}</div>
            <div class="cf-ep-main">
                <span class="cf-ep-source">${esc(sourceName(ep.sourceChannel))}</span>
                <h4>${esc(ep.title)}</h4>
                <div class="cf-ep-meta"><span>${esc(duration)}</span><span>${esc(rights)}</span></div>
                ${meter}
            </div>
            <div class="cf-ep-actions">${action}${favBtn(ep.id)}${playable ? queueBtn(ep.id) : ''}</div>
        </article>`;
    }
    function listRow(ep, ctx, extra) {
        const c = caseById.get(ep.caseId);
        const playable = isPlayable(ep);
        const act = ctx === 'queue' ? 'queue-play' : (playable ? 'play-ep' : 'open-case');
        return `<article class="cf-row" data-ep-id="${esc(ep.id)}">
            <button type="button" class="cf-row-main" data-action="${act}" data-ep="${esc(ep.id)}" data-case="${esc(ep.caseId)}" data-ctx="${ctx}">
                <span class="cf-row-thumb">${artHTML(thumbFor(ep), '', ep.id)}</span>
                <span class="cf-row-text"><strong>${esc(ep.title)}</strong><span>${esc(c ? c.title : '')} · ${esc(sourceName(ep.sourceChannel))}</span></span>
            </button>
            <div class="cf-row-actions">${extra || ''}${favBtn(ep.id)}</div>
        </article>`;
    }

    function continueList() {
        return Object.entries(state.positions)
            .map(([id, pos]) => ({ ep: epById.get(id), pos }))
            .filter(({ ep, pos }) => isPlayable(ep) && pos && pos.t > 5 && pos.d > 0 && pos.d - pos.t > 20)
            .sort((a, b) => (b.pos.u || 0) - (a.pos.u || 0))
            .slice(0, 12);
    }
    const matchSource = (c) => state.source === 'all' || c.episodes.some((e) => e.sourceChannel === state.source);

    function sourcesSection() {
        const all = [...epById.values()];
        const cards = [{ id: 'all', name: 'All sources', c: cases.length, e: all.length }].concat(sources.map((s) => ({
            id: s.id, name: s.name,
            c: cases.filter((x) => x.episodes.some((e) => e.sourceChannel === s.id)).length,
            e: all.filter((e) => e.sourceChannel === s.id).length
        })));
        return `<section class="cf-section">
            <div class="cf-section-head"><h2 class="cf-section-title">Source Collections</h2></div>
            <div class="cf-sources">${cards.map((s) => `<button type="button" class="cf-source${state.source === s.id ? ' active' : ''}" data-action="source" data-source="${esc(s.id)}" aria-pressed="${state.source === s.id}">
                <span class="cf-source-name">${esc(s.name)}</span><span class="cf-source-count">${s.c} cases · ${s.e} episodes</span></button>`).join('')}</div>
        </section>`;
    }

    function renderHome() {
        const q = fold(state.query.trim());
        const list = cases.filter(matchSource).filter((c) => !q || c._hay.includes(q));
        let h = '';
        if (!q) {
            const cont = continueList();
            if (cont.length) h += `<section class="cf-section"><div class="cf-section-head"><h2 class="cf-section-title">Continue Listening</h2></div><div class="cf-rail">${cont.map(continueCard).join('')}</div></section>`;
            const feat = cases.filter((c) => c.featured).filter(matchSource);
            if (feat.length) h += `<section class="cf-section"><div class="cf-section-head"><h2 class="cf-section-title">Featured Cases</h2></div><div class="cf-rail">${feat.map(featureCard).join('')}</div></section>`;
        }
        h += sourcesSection();
        const filtering = state.source !== 'all' || q;
        const note = filtering ? `<span class="cf-filter-note">${state.source !== 'all' ? esc(sourceName(state.source)) : ''}${q ? ` · “${esc(state.query.trim())}”` : ''}<button type="button" data-action="clear-filters">Clear</button></span>` : '';
        const emptyMsg = cases.length === 0
            ? empty('The library is empty', 'Add cases to cases-data.js and they will appear here.')
            : empty('No cases found', 'Try a different search or source.');
        h += `<section class="cf-section" id="cf-library"><div class="cf-section-head"><h2 class="cf-section-title">Browse Library<b>${list.length}</b></h2>${note}</div>${list.length ? `<div class="cf-grid">${list.map(caseCard).join('')}</div>` : emptyMsg}</section>`;
        return h;
    }

    function renderFavorites() {
        const favs = [...state.favorites].reverse().map((id) => epById.get(id)).filter(Boolean);
        const recent = state.recent.map((id) => epById.get(id)).filter(Boolean).slice(0, 15);
        return `<section class="cf-section"><div class="cf-section-head"><h2 class="cf-section-title">Favorite Episodes<b>${favs.length}</b></h2></div>
            ${favs.length ? `<div class="cf-list">${favs.map((ep) => listRow(ep, 'fav')).join('')}</div>` : empty('No favorites yet', 'Tap the heart on any episode to save it here.')}</section>
            <section class="cf-section"><div class="cf-section-head"><h2 class="cf-section-title">Recently Played<b>${recent.length}</b></h2></div>
            ${recent.length ? `<div class="cf-list">${recent.map((ep) => listRow(ep, 'recent')).join('')}</div>` : empty('Nothing played yet', 'Episodes you listen to will appear here.')}</section>`;
    }

    function renderCase(c) {
        if (!c) return empty('Case not found', 'This case is no longer in the library.');
        const meta = [['Country', c.country], ['Year', c.year], ['Category', c.category], ['Status', LABELS.status[c.status] || c.status]];
        const names = [...new Set(c.episodes.map((e) => sourceName(e.sourceChannel)))];
        const facts = c.facts.length
            ? `<section class="cf-block"><h3 class="cf-section-title">Information Status</h3><ul class="cf-facts">${c.facts.map((f) => {
                const known = LABELS.fact[f.type];
                return `<li class="cf-fact" data-type="${known ? esc(f.type) : 'unclassified'}"><span class="cf-fact-tag">${esc(known || 'Unclassified')}</span><span>${esc(f.text)}</span></li>`;
            }).join('')}</ul></section>` : '';
        return `<div class="cf-detail">
            <button type="button" class="cf-btn cf-back" data-action="back"><i class="fa-solid fa-arrow-left"></i><span>Library</span></button>
            <section class="cf-hero">
                <div class="cf-hero-art"><span class="cf-ratio r11">${artHTML(coverFor(c), c.id, c.id, statusBadges(c))}</span></div>
                <div class="cf-hero-info">
                    <span class="cf-eyebrow">Case ID · ${esc(c.id)}</span>
                    <h2>${esc(c.title)}</h2>
                    <dl class="cf-meta">${meta.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v || '—')}</dd></div>`).join('')}</dl>
                    <div class="cf-chips">${names.map((n) => `<span class="cf-chip">${esc(n)}</span>`).join('')}</div>
                </div>
            </section>
            <section class="cf-block"><h3 class="cf-section-title">Synopsis</h3><p class="cf-synopsis">${esc(c.synopsis || 'No synopsis yet.')}</p></section>
            ${facts}
            <section class="cf-block"><h3 class="cf-section-title">Related Episodes<b>${c.episodes.length}</b></h3><div class="cf-eps">${c.episodes.length ? c.episodes.map(epRow).join('') : empty('No episodes yet', 'Episodes linked to this case will appear here.')}</div></section>
            <p class="cf-note">Summaries keep confirmed information, allegations and theories clearly separated and avoid graphic descriptions.</p>
        </div>`;
    }

    function renderBody() {
        const c = state.view === 'case' ? caseById.get(state.caseId) : null;
        if (state.view === 'case' && !c) state.view = 'home';
        el.page.innerHTML = state.view === 'case' ? renderCase(c) : state.view === 'favorites' ? renderFavorites() : renderHome();
        el.header.hidden = state.view === 'case';
        el.favsBtn.classList.toggle('active', state.view === 'favorites');
        syncMarks();
    }

    function renderQueue() {
        const items = state.queue.map((id) => epById.get(id)).filter(isPlayable);
        el.queueCount.textContent = items.length;
        el.queueList.innerHTML = items.length
            ? items.map((ep) => listRow(ep, 'queue', `<button type="button" class="cf-icon-btn" data-action="queue-remove" data-ep="${esc(ep.id)}" aria-label="Remove from queue"><i class="fa-solid fa-xmark"></i></button>`)).join('')
            : empty('Queue is empty', 'Add episodes with the list button on a case page.');
        syncMarks();
    }

    function syncMarks() {
        const playing = !podcast.paused;
        root.querySelectorAll('[data-ep-id]').forEach((node) => {
            const id = node.dataset.epId;
            const cur = id === state.currentId;
            node.classList.toggle('is-current', cur);
            node.classList.toggle('is-playing', cur && playing);
            const btn = node.querySelector('[data-action="play-ep"]');
            if (btn) {
                const icon = btn.querySelector('i');
                if (icon) icon.className = 'fa-solid ' + (cur && playing ? 'fa-pause' : 'fa-play');
                const label = btn.querySelector('.cf-play-label');
                if (label) label.textContent = cur && playing ? 'Pause' : (cur ? 'Resume' : label.dataset.idle);
            }
        });
        root.querySelectorAll('.cf-fav').forEach((btn) => {
            const on = state.favorites.has(btn.dataset.ep);
            btn.classList.toggle('is-fav', on);
            btn.setAttribute('aria-pressed', String(on));
            const i = btn.querySelector('i');
            if (i) i.className = (on ? 'fa-solid' : 'fa-regular') + ' fa-heart';
        });
        root.querySelectorAll('.cf-q').forEach((btn) => {
            const on = state.queue.includes(btn.dataset.ep);
            btn.classList.toggle('is-queued', on);
            btn.setAttribute('aria-label', on ? 'Remove from queue' : 'Add to queue');
            const i = btn.querySelector('i');
            if (i) i.className = 'fa-solid ' + (on ? 'fa-check' : 'fa-list-ul');
        });
    }
    function updateFavCount() {
        el.favsCount.textContent = [...state.favorites].filter((id) => epById.has(id)).length;
    }
    function syncSpeed() {
        root.querySelectorAll('#cf-speed .cf-pill').forEach((b) => b.classList.toggle('active', Number(b.dataset.speed) === state.speed));
    }
    function syncSleep() {
        root.querySelectorAll('#cf-sleep .cf-pill').forEach((b) => b.classList.toggle('active', b.dataset.sleep === String(state.sleep)));
        updateSleepLabel();
    }
    function updateSleepLabel() {
        if (typeof state.sleep === 'number') el.sleepLeft.textContent = `${fmt(Math.max(0, sleepEnd - Date.now()) / 1000)} left`;
        else if (state.sleep === 'end') el.sleepLeft.textContent = 'Stops after this episode';
        else el.sleepLeft.textContent = '';
    }

    function updatePlayerUI() {
        const ep = epById.get(state.currentId);
        const has = isPlayable(ep);
        el.mini.hidden = !has;
        root.classList.toggle('has-mini', has);
        if (!has) { closeSheets(); return; }
        const c = caseById.get(ep.caseId);
        const art = thumbFor(ep) || (c ? coverFor(c) : '');
        el.miniArt.innerHTML = artHTML(art, '', ep.id);
        el.miniTitle.textContent = ep.title;
        el.miniSub.textContent = `${c ? c.title : ''} · ${sourceName(ep.sourceChannel)}`;
        el.playerArt.innerHTML = artHTML(art, c ? c.id : '', ep.id);
        el.playerTitle.textContent = ep.title;
        el.playerCase.textContent = c ? c.title : '—';
        el.playerCase.dataset.case = ep.caseId;
        el.playerSource.textContent = sourceName(ep.sourceChannel);
        el.playerFav.dataset.ep = ep.id;
        const chapters = Array.isArray(ep.chapters) ? ep.chapters.filter((ch) => ch && typeof ch.start === 'number') : [];
        el.chaptersWrap.hidden = chapters.length === 0;
        el.chapters.innerHTML = chapters.map((ch) => `<button type="button" class="cf-chapter" data-action="chapter" data-t="${ch.start}"><span>${fmt(ch.start)}</span>${esc(ch.title || '')}</button>`).join('');
        updateProgressUI();
        syncMarks();
    }

    function onPlayState() {
        const playing = !podcast.paused;
        root.classList.toggle('is-playing', playing);
        ['#cf-mini-play', '#cf-play'].forEach((sel) => {
            const b = $(sel);
            if (!b) return;
            b.querySelector('i').className = 'fa-solid ' + (playing ? 'fa-pause' : 'fa-play');
            b.setAttribute('aria-label', playing ? 'Pause' : 'Play');
        });
        syncMarks();
        if (state.mode === 'cases' && 'mediaSession' in navigator) {
            try { navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'; } catch (e) {}
        }
    }

    function updateProgressUI(override) {
        const d = podcast.duration, t = podcast.currentTime;
        const ok = isFinite(d) && d > 0;
        const ratio = override !== undefined ? override : (ok ? Math.min(1, t / d) : 0);
        const pct = (ratio * 100).toFixed(2) + '%';
        el.miniBar.style.width = pct;
        el.fill.style.width = pct;
        el.knob.style.left = pct;
        const shown = override !== undefined && ok ? ratio * d : t;
        el.timeCur.textContent = fmt(shown);
        el.timeLeft.textContent = '-' + fmt(ok ? d - shown : 0);
        el.progress.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
    }

    function savePosition() {
        const id = state.currentId, d = podcast.duration, t = podcast.currentTime;
        if (!id || !isFinite(d) || d <= 0 || podcast.ended || pendingSeek > 0) return;
        if (t < 1 && !state.positions[id]) return;
        state.positions[id] = { t, d, u: Date.now() };
        store.set('positions', state.positions);
    }
    function maybeSave() {
        const now = Date.now();
        if (now - lastSave < 4000 || podcast.paused || pendingSeek > 0) return;
        lastSave = now;
        savePosition();
    }
    function noteRecent(id) {
        if (!id) return;
        state.recent = [id].concat(state.recent.filter((x) => x !== id)).slice(0, 30);
        store.set('recent', state.recent);
    }

    function loadEpisode(id, opts) {
        const autoplay = !!(opts && opts.autoplay);
        const ep = epById.get(id);
        if (!isPlayable(ep)) return false;
        if (state.currentId && state.currentId !== id) savePosition();
        state.currentId = id;
        store.set('current', id);
        const saved = state.positions[id];
        pendingSeek = saved && saved.t > 5 && saved.d - saved.t > 10 ? saved.t : 0;
        podcast.src = ep.audioUrl;
        podcast.defaultPlaybackRate = state.speed;
        podcast.playbackRate = state.speed;
        updatePlayerUI();
        renderQueue();
        if (autoplay) play();
        return true;
    }
    function play() {
        if (!state.currentId || state.mode !== 'cases') return;
        const p = podcast.play();
        if (p && p.catch) p.catch(() => toast('Playback was blocked or the audio is unavailable'));
    }
    function togglePlay() {
        if (!state.currentId) return;
        if (podcast.paused) play(); else podcast.pause();
    }
    function playFrom(id, ctx, caseId) {
        const ep = epById.get(id);
        if (!isPlayable(ep)) return;
        if (state.currentId === id) { togglePlay(); return; }
        let ids = null;
        if (ctx === 'case') ids = (caseById.get(caseId) ? caseById.get(caseId).episodes : []).filter(isPlayable).map((e) => e.id);
        else if (ctx === 'continue') ids = continueList().map((i) => i.ep.id);
        else if (ctx === 'fav') ids = [...state.favorites].reverse().filter((x) => isPlayable(epById.get(x)));
        else if (ctx === 'recent') ids = state.recent.filter((x) => isPlayable(epById.get(x)));
        if (ids && ids.length) state.queue = ids;
        else if (!state.queue.includes(id)) state.queue.push(id);
        store.set('queue', state.queue);
        loadEpisode(id, { autoplay: true });
    }
    function next(silent) {
        if (!state.queue.length) { if (!silent) toast('Queue is empty'); return false; }
        const idx = state.queue.indexOf(state.currentId);
        const target = idx === -1 ? state.queue[0] : state.queue[idx + 1];
        if (!target) { if (!silent) toast('End of queue'); return false; }
        return loadEpisode(target, { autoplay: true });
    }
    function prev() {
        if (podcast.currentTime > 3) { podcast.currentTime = 0; return; }
        const idx = state.queue.indexOf(state.currentId);
        if (idx > 0) loadEpisode(state.queue[idx - 1], { autoplay: true });
        else podcast.currentTime = 0;
    }
    function seekTo(t) {
        if (!isFinite(podcast.duration)) return;
        podcast.currentTime = Math.max(0, Math.min(podcast.duration, t));
        updateProgressUI();
    }
    function skip(delta) { seekTo(podcast.currentTime + delta); }
    function setSpeed(v) {
        if (!SPEEDS.includes(v)) return;
        state.speed = v;
        podcast.defaultPlaybackRate = v;
        podcast.playbackRate = v;
        store.set('speed', v);
        syncSpeed();
    }

    function clearSleep() {
        clearTimeout(sleepTimer);
        clearInterval(sleepTick);
        sleepTimer = sleepTick = null;
        sleepEnd = 0;
    }
    function fadePause(ms) {
        if (podcast.paused) return;
        if (!canAdjustVolume) { podcast.pause(); return; }
        clearInterval(fadeTimer);
        const steps = Math.max(1, Math.round(ms / 100));
        const start = podcast.volume;
        let i = 0;
        fadeTimer = setInterval(() => {
            i++;
            podcast.volume = Math.max(0, start * (1 - i / steps));
            if (i >= steps) { clearInterval(fadeTimer); fadeTimer = null; podcast.pause(); podcast.volume = start; }
        }, 100);
    }
    function setSleep(opt) {
        clearSleep();
        state.sleep = opt;
        if (typeof opt === 'number') {
            sleepEnd = Date.now() + opt * 60000;
            sleepTimer = setTimeout(() => { clearSleep(); state.sleep = 'off'; fadePause(2500); syncSleep(); toast('Sleep timer reached. Goodnight!'); }, opt * 60000);
            sleepTick = setInterval(updateSleepLabel, 1000);
            toast(`Sleep timer: ${opt} min`);
        } else if (opt === 'end') toast('Sleep timer: end of episode');
        else toast('Sleep timer off');
        syncSleep();
    }

    function toggleFav(id) {
        if (!epById.has(id)) return;
        if (state.favorites.has(id)) { state.favorites.delete(id); toast('Removed from favorites'); }
        else { state.favorites.add(id); toast('Added to favorites'); }
        store.set('favorites', [...state.favorites]);
        updateFavCount();
        if (state.view === 'favorites') renderBody(); else syncMarks();
    }
    function toggleQueue(id) {
        if (!isPlayable(epById.get(id))) return;
        if (state.queue.includes(id)) { state.queue = state.queue.filter((x) => x !== id); toast('Removed from queue'); }
        else { state.queue.push(id); toast('Added to queue'); }
        store.set('queue', state.queue);
        renderQueue();
    }
    function removeFromQueue(id) {
        state.queue = state.queue.filter((x) => x !== id);
        store.set('queue', state.queue);
        renderQueue();
    }

    function openPlayer() {
        if (!state.currentId) return;
        el.player.inert = false;
        el.player.classList.add('open');
        el.player.setAttribute('aria-hidden', 'false');
        state.playerOpen = true;
    }
    function closeQueue() {
        el.queue.classList.remove('open');
        el.queue.setAttribute('aria-hidden', 'true');
        el.queue.inert = true;
        state.queueOpen = false;
    }
    function closePlayer() {
        closeQueue();
        el.player.classList.remove('open');
        el.player.setAttribute('aria-hidden', 'true');
        el.player.inert = true;
        state.playerOpen = false;
    }
    function openQueue() {
        renderQueue();
        el.queue.inert = false;
        el.queue.classList.add('open');
        el.queue.setAttribute('aria-hidden', 'false');
        state.queueOpen = true;
    }
    function closeSheets() { closePlayer(); }

    function openCase(id) {
        if (!caseById.has(id)) return;
        if (state.view !== 'case') { state.backView = state.view; homeScroll = el.scroll.scrollTop; }
        state.caseId = id;
        state.view = 'case';
        renderBody();
        el.scroll.scrollTop = 0;
    }
    function leaveCase() {
        state.view = state.backView || 'home';
        renderBody();
        el.scroll.scrollTop = homeScroll;
    }

    function onClick(e) {
        const node = e.target.closest('[data-action]');
        if (!node || !root.contains(node)) return;
        const d = node.dataset;
        switch (d.action) {
            case 'open-case': openCase(d.case); break;
            case 'open-case-current': { const id = d.case; closePlayer(); if (id) openCase(id); break; }
            case 'back': leaveCase(); break;
            case 'toggle-favs-view':
                state.view = state.view === 'favorites' ? 'home' : 'favorites';
                renderBody();
                el.scroll.scrollTop = 0;
                break;
            case 'source':
                state.source = state.source === d.source && d.source !== 'all' ? 'all' : d.source;
                store.set('source', state.source);
                state.view = 'home';
                renderBody();
                break;
            case 'clear-filters':
                state.source = 'all';
                state.query = '';
                el.search.value = '';
                store.set('source', 'all');
                renderBody();
                break;
            case 'play-ep': playFrom(d.ep, d.ctx, d.case); break;
            case 'queue-play': playFrom(d.ep, 'queue'); break;
            case 'toggle-fav': toggleFav(d.ep); break;
            case 'queue-toggle': toggleQueue(d.ep); break;
            case 'queue-remove': removeFromQueue(d.ep); break;
            case 'queue-clear':
                state.queue = state.currentId ? [state.currentId] : [];
                store.set('queue', state.queue);
                renderQueue();
                break;
            case 'open-player': openPlayer(); break;
            case 'close-player': closePlayer(); break;
            case 'open-queue': openQueue(); break;
            case 'close-queue': closeQueue(); break;
            case 'toggle-play': togglePlay(); break;
            case 'next': next(); break;
            case 'prev': prev(); break;
            case 'skip-back': skip(-15); break;
            case 'skip-fwd': skip(30); break;
            case 'speed': setSpeed(Number(d.speed)); break;
            case 'sleep': setSleep(d.sleep === 'off' || d.sleep === 'end' ? d.sleep : Number(d.sleep)); break;
            case 'chapter': seekTo(Number(d.t)); break;
            default: break;
        }
    }
    root.addEventListener('click', onClick);
    root.addEventListener('error', (e) => { if (e.target && e.target.tagName === 'IMG') e.target.remove(); }, true);

    el.search.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            state.query = el.search.value;
            if (state.view !== 'home') state.view = 'home';
            renderBody();
        }, 140);
    });

    function ratioAt(e) {
        const r = el.progress.getBoundingClientRect();
        return r.width ? Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) : 0;
    }
    el.progress.addEventListener('pointerdown', (e) => {
        if (!isFinite(podcast.duration)) return;
        seeking = true;
        el.progress.setPointerCapture(e.pointerId);
        seekRatio = ratioAt(e);
        updateProgressUI(seekRatio);
    });
    el.progress.addEventListener('pointermove', (e) => {
        if (!seeking) return;
        seekRatio = ratioAt(e);
        updateProgressUI(seekRatio);
    });
    el.progress.addEventListener('pointerup', () => {
        if (!seeking) return;
        seeking = false;
        seekTo(seekRatio * podcast.duration);
    });
    el.progress.addEventListener('pointercancel', () => { seeking = false; });

    podcast.addEventListener('loadedmetadata', () => {
        podcast.playbackRate = state.speed;
        if (pendingSeek > 0 && isFinite(podcast.duration)) {
            try { podcast.currentTime = Math.min(pendingSeek, Math.max(0, podcast.duration - 2)); } catch (e) {}
        }
        pendingSeek = 0;
        updateProgressUI();
    });
    podcast.addEventListener('timeupdate', () => { if (!seeking) updateProgressUI(); maybeSave(); });
    podcast.addEventListener('play', () => {
        if (state.mode !== 'cases') { podcast.pause(); return; }
        if (typeof music !== 'undefined' && !music.paused) music.pause();
        if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = null; podcast.volume = 1; }
        noteRecent(state.currentId);
        setMediaSession();
        onPlayState();
    });
    podcast.addEventListener('pause', () => { savePosition(); onPlayState(); });
    podcast.addEventListener('ended', () => {
        delete state.positions[state.currentId];
        store.set('positions', state.positions);
        if (state.sleep === 'end') { clearSleep(); state.sleep = 'off'; syncSleep(); toast('Sleep timer: stopped after this episode'); onPlayState(); return; }
        if (!next(true)) onPlayState();
    });
    podcast.addEventListener('error', () => {
        if (!state.currentId || !podcast.src) return;
        toast('Could not load this audio file');
        onPlayState();
    });

    if (typeof music !== 'undefined') {
        music.addEventListener('play', () => {
            if (!podcast.paused) podcast.pause();
            if (state.mode === 'cases') music.pause();
        });
    }

    function setMediaSession() {
        if (!('mediaSession' in navigator)) return;
        const ep = epById.get(state.currentId);
        if (!ep) return;
        const c = caseById.get(ep.caseId);
        const art = thumbFor(ep) || (c ? coverFor(c) : '');
        try {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: ep.title, artist: sourceName(ep.sourceChannel), album: c ? c.title : 'Case Files',
                artwork: art ? [{ src: new URL(art, location.href).href }] : []
            });
            const set = (a, fn) => { try { navigator.mediaSession.setActionHandler(a, fn); } catch (e) {} };
            set('play', play);
            set('pause', () => podcast.pause());
            set('previoustrack', prev);
            set('nexttrack', () => next());
            set('seekbackward', (d) => skip(-((d && d.seekOffset) || 15)));
            set('seekforward', (d) => skip((d && d.seekOffset) || 30));
            set('seekto', (d) => { if (d && typeof d.seekTime === 'number') seekTo(d.seekTime); });
        } catch (e) {}
    }
    function restoreMusicSession() {
        if (!('mediaSession' in navigator) || typeof songs === 'undefined' || typeof musicIndex === 'undefined') return;
        const song = songs[musicIndex];
        if (!song) return;
        try {
            const cover = (song.cover && song.cover.trim()) || './assets/1.jpg';
            navigator.mediaSession.metadata = new MediaMetadata({ title: song.displayName, artist: song.artist, artwork: [{ src: new URL(cover, location.href).href, sizes: '512x512', type: 'image/png' }] });
            navigator.mediaSession.setActionHandler('play', playMusic);
            navigator.mediaSession.setActionHandler('pause', () => fadeOutAndPause(500));
            navigator.mediaSession.setActionHandler('previoustrack', () => changeMusic(-1));
            navigator.mediaSession.setActionHandler('nexttrack', () => changeMusic(1));
            ['seekbackward', 'seekforward', 'seekto'].forEach((a) => { try { navigator.mediaSession.setActionHandler(a, null); } catch (e) {} });
            navigator.mediaSession.playbackState = music.paused ? 'paused' : 'playing';
        } catch (e) {}
    }

    function closeMusicOverlays() {
        if (typeof playlistDrawer !== 'undefined') playlistDrawer.classList.remove('active');
        if (typeof shareModal !== 'undefined') shareModal.classList.remove('active');
        if (typeof journalModal !== 'undefined') journalModal.classList.remove('active');
    }
    function enterCases() {
        closeMusicOverlays();
        if (typeof music !== 'undefined' && !music.paused) music.pause();
        if (typeof mainVideo !== 'undefined') mainVideo.pause();
        updatePlayerUI();
        onPlayState();
    }
    function enterMusic() {
        if (!podcast.paused) podcast.pause();
        savePosition();
        closeSheets();
        clearSleep();
        state.sleep = 'off';
        syncSleep();
        if (typeof mainVideo !== 'undefined' && mainVideo.classList.contains('active')) mainVideo.play().catch(() => {});
        restoreMusicSession();
    }
    function setMode(mode) {
        if (mode !== 'music' && mode !== 'cases') return;
        const changed = state.mode !== mode;
        state.mode = mode;
        store.set('mode', mode);
        switcher.dataset.mode = mode;
        switcher.querySelectorAll('.mode-btn').forEach((b) => {
            const on = b.dataset.mode === mode;
            b.classList.toggle('active', on);
            b.setAttribute('aria-selected', String(on));
        });
        if (changed) {
            body.classList.add('mode-switching');
            clearTimeout(switchTimer);
            switchTimer = setTimeout(() => body.classList.remove('mode-switching'), 700);
        }
        body.classList.toggle('mode-cases', mode === 'cases');
        root.setAttribute('aria-hidden', String(mode !== 'cases'));
        root.inert = mode !== 'cases';
        const layout = document.querySelector('.app-layout');
        if (layout) layout.inert = mode === 'cases';
        if (!changed) return;
        if (mode === 'cases') enterCases(); else enterMusic();
    }
    switcher.addEventListener('click', (e) => {
        const b = e.target.closest('.mode-btn');
        if (b) setMode(b.dataset.mode);
    });

    document.addEventListener('keydown', (e) => {
        if (state.mode !== 'cases') return;
        const t = e.target;
        const tag = (t.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || t.isContentEditable) return;
        const key = e.key || '';
        if (key === 'Escape') {
            if (state.queueOpen) closeQueue(); else if (state.playerOpen) closePlayer();
            return;
        }
        const code = e.code;
        const blocked = ['Space', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'KeyH', 'KeyF', 'KeyM', 'KeyL'].includes(code) || /^[hfml ]$/i.test(key);
        if (!blocked) return;
        e.stopImmediatePropagation();
        const isButton = tag === 'button' || tag === 'a' || t.getAttribute('role') === 'button';
        if (code === 'Space' || key === ' ') {
            if (isButton) return;
            e.preventDefault();
            togglePlay();
        } else if (code === 'ArrowRight' || code === 'ArrowLeft') {
            if (!state.currentId) return;
            e.preventDefault();
            const onBar = t.id === 'cf-progress';
            skip(code === 'ArrowRight' ? (onBar ? 5 : 30) : (onBar ? -5 : -15));
        }
    }, true);

    window.addEventListener('pagehide', savePosition);
    document.addEventListener('visibilitychange', () => { if (document.hidden) savePosition(); });

    if (typeof playlistDrawer !== 'undefined') {
        new MutationObserver(() => body.classList.toggle('music-drawer-open', playlistDrawer.classList.contains('active')))
            .observe(playlistDrawer, { attributes: true, attributeFilter: ['class'] });
    }

    state.queue = state.queue.filter((id) => isPlayable(epById.get(id)));
    renderBody();
    renderQueue();
    syncSpeed();
    syncSleep();
    updateFavCount();
    if (isPlayable(epById.get(state.currentId))) loadEpisode(state.currentId, { autoplay: false });
    else { state.currentId = null; store.set('current', null); updatePlayerUI(); }
    onPlayState();

    const params = new URLSearchParams(location.search);
    setMode(params.has('song') ? 'music' : (store.get('mode', 'music') === 'cases' ? 'cases' : 'music'));
})();