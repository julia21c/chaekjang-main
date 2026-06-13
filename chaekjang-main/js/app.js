/* ============================================================
   오늘의 한 칸 — 독서 책장
   Day 1: 파일 분리 + localStorage 영속성 + 설정 모달
   ============================================================ */

// ----- 상태 초기값 -----
let state = {
  books: [],        // {id, title, author, cover, quote, shelf:'read'|'wish', year}
  timerMin: 20,
  readDates: [],    // 'YYYY-MM-DD' 독서 완료한 날 목록
  todayMin: 0,
  todayDate: '',    // 날짜가 바뀌면 todayMin 초기화용
  reminderTime: ''  // 'HH:MM' 저녁 리마인더 시각
};

// 카카오 API 키 — 설정 모달에서 입력, localStorage에 별도 저장
let KAKAO_KEY = localStorage.getItem('chaekjang_kakao_key') || '';

// ----- localStorage 저장 / 불러오기 -----
function saveState() {
  localStorage.setItem('chaekjang_state', JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem('chaekjang_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state = { ...state, ...parsed };
    } catch (e) {
      console.warn('저장 데이터 파싱 실패, 초기 상태 사용');
    }
  }
  // 날짜가 바뀌었으면 오늘 독서 분 초기화
  if (state.todayDate !== todayKey()) {
    state.todayMin = 0;
    state.todayDate = todayKey();
    saveState();
  }
}

// ----- 유틸 -----
const $ = s => document.querySelector(s);
const todayKey = () => new Date().toISOString().slice(0, 10);
const thisYear = () => new Date().getFullYear();

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1800);
}

// ============================================================
//  타이머 (시그니처: 끝나면 책이 책장에 꽂힘)
// ============================================================
const RING_LEN = 2 * Math.PI * 92;
$('#ringFg').style.strokeDasharray = RING_LEN;

let timerId = null, remain = 20 * 60, running = false, paused = false, total = 20 * 60;
// 5분 비상 모드: 종료 후 원래 timerMin 복구에 필요
let emergencyMode = false, priorTimerMin = 0;

// 저장된 timerMin으로 링·시간 초기화
function initTimerFromState() {
  remain = state.timerMin * 60;
  total = remain;
  paintRing();
}

function fmt(s) {
  const m = Math.floor(s / 60), ss = s % 60;
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

function paintRing() {
  $('#timeDisp').textContent = fmt(remain);
  const ratio = remain / total;
  $('#ringFg').style.strokeDashoffset = RING_LEN * (1 - ratio);
}

// 버튼 표시 상태 관리 — 세 가지 상태: 대기 / 진행 / 일시정지
function setTimerUI(mode) {
  const show = id => $(id).style.display = 'block';
  const hide = id => $(id).style.display = 'none';
  if (mode === 'idle') {
    show('#setBtn'); show('#startBtn');
    hide('#pauseBtn'); hide('#resumeBtn'); hide('#stopBtn');
  } else if (mode === 'running') {
    hide('#setBtn'); hide('#startBtn');
    show('#pauseBtn');
    hide('#resumeBtn'); hide('#stopBtn');
  } else if (mode === 'paused') {
    hide('#setBtn'); hide('#startBtn'); hide('#pauseBtn');
    show('#resumeBtn'); show('#stopBtn');
  }
}

function startTimer() {
  if (running) return;
  running = true;
  paused = false;
  setTimerUI('running');
  $('#ringSub').textContent = '읽는 중…';
  timerId = setInterval(() => {
    remain--;
    paintRing();
    if (remain <= 0) { finishTimer(); }
  }, 1000);
}

// 일시정지 — 남은 시간 보존
function pauseTimer() {
  if (!running) return;
  clearInterval(timerId);
  running = false;
  paused = true;
  setTimerUI('paused');
  $('#ringSub').textContent = '잠시 멈춤';
}

// 계속 — 멈춘 시간부터 재개
function resumeTimer() {
  if (running || !paused) return;
  running = true;
  paused = false;
  setTimerUI('running');
  $('#ringSub').textContent = '읽는 중…';
  timerId = setInterval(() => {
    remain--;
    paintRing();
    if (remain <= 0) { finishTimer(); }
  }, 1000);
}

// 그만두기 — 타이머 완전 초기화
function stopTimer(reset = true) {
  clearInterval(timerId);
  running = false;
  paused = false;
  setTimerUI('idle');
  if (reset) {
    // 비상 5분 모드였으면 원래 시간으로 복구
    if (emergencyMode) {
      state.timerMin = priorTimerMin;
      emergencyMode = false;
    }
    remain = state.timerMin * 60;
    total = remain;
    paintRing();
    $('#ringSub').textContent = '시작을 눌러요';
  }
}

function finishTimer() {
  clearInterval(timerId);
  running = false;
  paused = false;
  // 오늘 독서 시간 누적 + 날짜 기록
  state.todayMin += state.timerMin;
  if (!state.readDates.includes(todayKey())) {
    state.readDates.push(todayKey());
  }
  saveState();
  if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
  stopTimer(true);
  // 링 골드 글로우 — 완료 축하 시그니처
  $('#ringFg').classList.add('complete');
  setTimeout(() => $('#ringFg').classList.remove('complete'), 1600);
  renderStats();
  renderStreak();
  renderHeatmap();
  openDoneModal();
}

$('#startBtn').onclick = startTimer;
$('#pauseBtn').onclick = pauseTimer;
$('#resumeBtn').onclick = resumeTimer;
$('#stopBtn').onclick = () => stopTimer(true);
// 분 설정 버튼 → prompt() 대신 모달 열기
$('#setBtn').onclick = () => openTimerSetModal();

// 5분 비상 모드 — 현재 timerMin을 보존하고 5분으로 즉시 시작
$('#emergencyBtn').onclick = () => {
  if (running || paused) { toast('타이머가 이미 실행 중이에요'); return; }
  priorTimerMin = state.timerMin;
  emergencyMode = true;
  state.timerMin = 5;
  remain = 5 * 60;
  total = remain;
  paintRing();
  startTimer();
  toast('⚡ 5분 모드 시작!');
};

// ============================================================
//  타이머 분 설정 모달 (prompt 제거 후 교체)
// ============================================================
function openTimerSetModal() {
  $('#timerMinInput').value = state.timerMin;
  // 현재 설정값과 일치하는 프리셋 강조
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.min) === state.timerMin);
  });
  $('#timerSetModal').classList.add('show');
}

// 프리셋 버튼 클릭 시 입력란 동기화
document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    $('#timerMinInput').value = btn.dataset.min;
  };
});

$('#confirmTimerSet').onclick = () => {
  const n = parseInt($('#timerMinInput').value);
  if (n && n > 0 && n <= 180) {
    state.timerMin = n;
    remain = n * 60;
    total = remain;
    paintRing();
    saveState();
    toast(`${n}분으로 설정했어요 ⏱`);
  }
  $('#timerSetModal').classList.remove('show');
};

$('#cancelTimerSet').onclick = () => $('#timerSetModal').classList.remove('show');

// ============================================================
//  설정 모달 (카카오 API 키 입력)
// ============================================================
$('#settingsBtn').onclick = () => {
  $('#kakaoKeyInput').value = KAKAO_KEY;
  $('#reminderInput').value = state.reminderTime || '21:00';
  updateNotifyBtn();
  $('#settingsModal').classList.add('show');
};

$('#saveSettings').onclick = () => {
  const key = $('#kakaoKeyInput').value.trim();
  const reminder = $('#reminderInput').value;
  KAKAO_KEY = key;
  localStorage.setItem('chaekjang_kakao_key', key);
  state.reminderTime = reminder;
  saveState();
  $('#settingsModal').classList.remove('show');
  toast('설정 저장됨 ✓');
};

$('#cancelSettings').onclick = () => $('#settingsModal').classList.remove('show');

// 알림 권한 버튼 상태 업데이트
function updateNotifyBtn() {
  const btn = $('#notifyPermBtn');
  if (!btn) return;
  if (!('Notification' in window)) {
    btn.textContent = '이 브라우저는 알림을 지원하지 않아요';
    btn.disabled = true;
    return;
  }
  if (Notification.permission === 'granted') {
    btn.textContent = '알림 허용됨 ✓';
    btn.style.background = 'rgba(62,107,90,.15)';
    btn.style.color = 'var(--accent-2)';
    btn.disabled = false;
  } else if (Notification.permission === 'denied') {
    btn.textContent = '알림이 차단됐어요 (브라우저 설정에서 변경)';
    btn.disabled = true;
  } else {
    btn.textContent = '알림 권한 허용하기';
    btn.disabled = false;
  }
}

$('#notifyPermBtn').onclick = async () => {
  if (!('Notification' in window)) return;
  const perm = await Notification.requestPermission();
  updateNotifyBtn();
  if (perm === 'granted') toast('알림 허용됨 ✓');
  else toast('알림이 차단됐어요');
};

// 저녁 리마인더 — 1분마다 현재 시각 확인
setInterval(() => {
  if (!state.reminderTime || Notification.permission !== 'granted') return;
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  if (`${hh}:${mm}` !== state.reminderTime) return;
  // 오늘 이미 읽었으면 알림 건너뜀
  if (state.readDates.includes(todayKey())) return;
  new Notification('오늘의 한 칸 📖', {
    body: '오늘의 20분, 아직이에요. 잠깐 펼쳐볼까요?',
    icon: 'icons/icon.svg'
  });
}, 60000);

// ============================================================
//  독서 잔디 히트맵 (올해 1월부터 오늘까지)
// ============================================================
function renderHeatmap() {
  const year = thisYear();
  const todayStr = todayKey();
  const today = new Date(todayStr);
  const jan1 = new Date(year, 0, 1);

  // 월요일 기준 시작 오프셋 (0=월 … 6=일)
  const startOffset = (jan1.getDay() + 6) % 7;

  // 올해 오늘까지 날짜 목록
  const allDays = [];
  const cursor = new Date(jan1);
  while (cursor <= today) {
    allDays.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }

  // 빈 칸 패딩 + 날짜 → 7개씩 묶어 주(열) 배열
  const cells = [...Array(startOffset).fill(null), ...allDays];
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    const w = cells.slice(i, i + 7);
    while (w.length < 7) w.push(null);
    weeks.push(w);
  }

  const CELL = 10, GAP = 2, COL_W = CELL + GAP;

  // 월 레이블 — 각 월이 시작되는 주 열 위치에 표시
  const monthsEl = $('#heatmapMonths');
  monthsEl.style.width = weeks.length * COL_W + 'px';
  monthsEl.innerHTML = '';
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    week.forEach(day => {
      if (!day) return;
      const m = parseInt(day.slice(5, 7));
      if (m !== lastMonth) {
        lastMonth = m;
        const label = document.createElement('span');
        label.className = 'heatmap-month-label';
        label.style.left = wi * COL_W + 'px';
        label.textContent = m + '월';
        monthsEl.appendChild(label);
      }
    });
  });

  // 잔디 격자 렌더
  $('#heatmapGrid').innerHTML = weeks.map(week =>
    `<div class="heatmap-col">` +
    week.map(day => {
      if (!day) return `<div class="heatmap-cell empty"></div>`;
      const filled = state.readDates.includes(day);
      const isToday = day === todayStr;
      return `<div class="heatmap-cell${filled ? ' filled' : ''}${isToday ? ' today' : ''}" title="${day}"></div>`;
    }).join('') +
    `</div>`
  ).join('');

  // 현재 주(오른쪽 끝)로 자동 스크롤
  const scrollEl = $('#heatmapScroll');
  setTimeout(() => { scrollEl.scrollLeft = scrollEl.scrollWidth; }, 50);

  // 올해 총 독서일 수
  const totalDays = state.readDates.filter(d => d.startsWith(String(year))).length;
  $('#heatmapCount').textContent = `올해 ${totalDays}일`;
}

// ============================================================
//  통계 & 연속 기록
// ============================================================
function renderStats() {
  const yr = state.books.filter(b => b.shelf === 'read' && b.year === thisYear()).length;
  $('#yearStat').innerHTML = `올해 <b>${yr}</b>권 · 오늘 독서 <b>${state.todayMin}</b>분`;
}

function renderStreak() {
  // 최근 7일 점 표시
  const dots = $('#streakDots');
  dots.innerHTML = '';
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  days.forEach(dk => {
    const el = document.createElement('span');
    el.className = 'dot' + (state.readDates.includes(dk) ? ' on' : '');
    dots.appendChild(el);
  });
  // 연속 일수 계산
  let streak = 0;
  let d = new Date();
  while (state.readDates.includes(d.toISOString().slice(0, 10))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  const txt = $('#streakText');
  if (streak > 0) txt.textContent = `${streak}일 연속 · 잘 가고 있어요`;
  else if (state.readDates.length > 0) txt.textContent = '오늘 다시 펼쳐볼까요';
  else txt.textContent = '첫 20분을 시작해보세요';
  // 연속 기록 있으면 불꽃 펄스 애니메이션
  const flame = document.querySelector('.flame');
  if (flame) flame.classList.toggle('pulsing', streak > 0);
}

// ============================================================
//  한 줄 모아보기 (필사 노트 뷰)
// ============================================================
function renderQuotes() {
  const el = $('#quotesShelf');
  const books = state.books.filter(b => b.shelf === 'read' && b.quote);

  if (books.length === 0) {
    el.innerHTML = `<div class="empty">
      <div class="em-ic">✍️</div>
      <p>아직 남긴 한 줄이 없어요.<br>타이머 완료 후 책 속 문장을 기록해보세요.</p>
    </div>`;
    return;
  }

  el.innerHTML = `<div class="quotes-area">
    <div class="quotes-count">${books.length}권의 책에서 ${books.length}개의 문장</div>
    ${books.map(b => `
      <div class="quote-card">
        <div class="quote-text">"${esc(b.quote)}"</div>
        <div class="quote-source">
          <div class="quote-book-cover">
            ${b.cover ? `<img src="${b.cover}" onerror="this.style.display='none'">` : ''}
          </div>
          <div class="quote-book-info">
            <div class="quote-book-title">${esc(b.title)}</div>
            <div class="quote-book-author">${esc(b.author || '')}</div>
          </div>
        </div>
      </div>`).join('')}
  </div>`;
}

// ============================================================
//  책장 렌더
// ============================================================
function bookCoverHTML(b, cls = '') {
  if (b.cover) {
    return `<div class="book-cover ${cls}"><img src="${b.cover}" alt="" onerror="this.parentNode.innerHTML='<div class=\\'nocover\\'>${esc(b.title)}</div>'"></div>`;
  }
  return `<div class="book-cover ${cls}"><div class="nocover">${esc(b.title)}</div></div>`;
}

// XSS 방지용 HTML 이스케이프
function esc(s) {
  return (s || '').replace(/[<>&"']/g, c => (
    { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function renderShelves() {
  const read = state.books.filter(b => b.shelf === 'read');
  const wish = state.books.filter(b => b.shelf === 'wish');

  // 읽은 책 — 3열 책장 그리드
  const rs = $('#readShelf');
  if (read.length === 0) {
    rs.innerHTML = `<div class="empty"><div class="em-ic">📚</div><p>아직 책장이 비어 있어요.<br>20분 타이머를 끝내면 책이 한 권씩 꽂혀요.</p></div>`;
  } else {
    let html = '';
    // 3권씩 묶어 선반 한 줄 생성
    for (let i = 0; i < read.length; i += 3) {
      const row = read.slice(i, i + 3);
      html += '<div class="shelf"><div class="shelf-grid">';
      row.forEach(b => {
        html += `<div class="book" data-id="${b.id}">
          ${bookCoverHTML(b)}
          ${b.quote ? `<div class="book-quote">"${esc(b.quote)}"</div>` : ''}
        </div>`;
      });
      html += '</div></div>';
    }
    rs.innerHTML = html;
    rs.querySelectorAll('.book').forEach(el => el.onclick = () => openDetail(el.dataset.id));
  }

  // 위시리스트
  const ws = $('#wishShelf');
  if (wish.length === 0) {
    ws.innerHTML = `<div class="empty"><div class="em-ic">🔖</div><p>읽고 싶은 책을 미리 담아두세요.<br>다음에 펼칠 책이 기다리고 있으면 시작이 쉬워져요.</p></div>`;
  } else {
    ws.innerHTML = '<div class="wish-grid">' + wish.map(b => `
      <div class="wish-item">
        <div class="mini-cover">${b.cover ? `<img src="${b.cover}" onerror="this.style.display='none'">` : ''}</div>
        <div class="wi-info">
          <div class="wi-title">${esc(b.title)}</div>
          <div class="wi-author">${esc(b.author || '')}</div>
        </div>
        <button class="wi-move" data-id="${b.id}">읽기 시작</button>
      </div>`).join('') + '</div>';
    ws.querySelectorAll('.wi-move').forEach(el => el.onclick = () => {
      const b = state.books.find(x => x.id == el.dataset.id);
      b.shelf = 'read';
      b.year = thisYear();
      saveState();
      renderShelves();
      renderStats();
      toast('읽은 책으로 옮겼어요 📖');
    });
  }
}

// ----- 탭 전환 (페이드 애니메이션 포함) -----
const SHELF_IDS = { read: 'readShelf', wish: 'wishShelf', quotes: 'quotesShelf' };

document.querySelectorAll('.tab').forEach(t => t.onclick = () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
  t.classList.add('active');
  const tab = t.dataset.tab;
  Object.entries(SHELF_IDS).forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (key === tab) {
      el.style.display = 'block';
      el.classList.remove('tab-show');
      void el.offsetWidth; // 리플로우로 애니메이션 재시작
      el.classList.add('tab-show');
      if (key === 'quotes') renderQuotes();
    } else {
      el.style.display = 'none';
    }
  });
});

// ============================================================
//  책 검색 (구글북스 기본 / 카카오 키 있으면 우선 사용)
// ============================================================
async function searchBooks(q) {
  const results = $('#results');
  results.innerHTML = '<div class="loading">검색 중…</div>';
  try {
    let items = [];
    if (KAKAO_KEY) {
      // 카카오 책 검색 — 한국 책 표지 정확도 높음
      const r = await fetch(
        `https://dapi.kakao.com/v3/search/book?query=${encodeURIComponent(q)}&size=8`,
        { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } }
      );
      const d = await r.json();
      items = (d.documents || []).map(b => ({
        title: b.title,
        author: (b.authors || []).join(', '),
        cover: b.thumbnail
      }));
    } else {
      // 구글북스 — 키 불필요 폴백
      const r = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=8&country=KR`
      );
      const d = await r.json();
      items = (d.items || []).map(v => {
        const vi = v.volumeInfo || {};
        let cov = vi.imageLinks ? (vi.imageLinks.thumbnail || vi.imageLinks.smallThumbnail) : '';
        if (cov) cov = cov.replace('http://', 'https://');
        return { title: vi.title || '제목없음', author: (vi.authors || []).join(', '), cover: cov };
      });
    }
    if (items.length === 0) {
      results.innerHTML = '<div class="loading">결과가 없어요. 직접 추가도 가능해요.</div>';
      return;
    }
    results.innerHTML = items.map((b, i) => `
      <div class="result" data-i="${i}">
        ${b.cover ? `<img class="r-cov" src="${b.cover}">` : '<div class="r-cov"></div>'}
        <div class="r-info">
          <div class="r-t">${esc(b.title)}</div>
          <div class="r-a">${esc(b.author)}</div>
        </div>
      </div>`).join('');
    results.querySelectorAll('.result').forEach(el => el.onclick = () => pickBook(items[el.dataset.i]));
  } catch (e) {
    results.innerHTML = '<div class="loading">검색 연결에 실패했어요. 직접 제목을 추가해보세요.</div>';
  }
}

function pickBook(b) {
  selectedBookForAdd = b;
  // 선택된 책 표시 + 한 줄 입력 노출
  $('#results').innerHTML = `<div class="result" style="background:rgba(192,71,43,.12)">
    ${b.cover ? `<img class="r-cov" src="${b.cover}">` : '<div class="r-cov"></div>'}
    <div class="r-info">
      <div class="r-t">✓ ${esc(b.title)}</div>
      <div class="r-a">${esc(b.author)}</div>
    </div></div>`;
  if (currentShelfTarget === 'read') $('#quoteField').style.display = 'block';
  const acts = $('#addModal .modal-actions');
  acts.innerHTML = `<button class="btn btn-ghost" id="cancelAdd2">닫기</button>
    <button class="btn btn-primary" id="confirmAdd">책장에 추가</button>`;
  $('#cancelAdd2').onclick = closeAdd;
  $('#confirmAdd').onclick = () => {
    const q = $('#quoteInput').value.trim();
    addBook(b, currentShelfTarget, q);
    closeAdd();
    toast(currentShelfTarget === 'read' ? '책장에 꽂았어요 📖' : '위시리스트에 담았어요 🔖');
  };
}

function addBook(b, shelf, quote = '') {
  state.books.unshift({
    id: Date.now() + Math.random().toString(36).slice(2, 6),
    title: b.title,
    author: b.author || '',
    cover: b.cover || '',
    quote: quote,
    shelf: shelf,
    year: thisYear()
  });
  saveState();
  renderShelves();
  renderStats();
  // 새 책 꽂히는 드롭 애니메이션 (시그니처)
  if (shelf === 'read') {
    setTimeout(() => {
      const first = $('#readShelf .book');
      if (first) first.classList.add('new-drop');
    }, 50);
  }
}

// ----- 책 추가 모달 제어 -----
let selectedBookForAdd = null;
let currentShelfTarget = 'read';
let detailBookId = null;

$('#fabBtn').onclick = () => openAdd();

function openAdd() {
  $('#addModal').classList.add('show');
  $('#searchInput').value = '';
  $('#results').innerHTML = '';
  $('#quoteInput').value = '';
  $('#quoteField').style.display = 'none';
  selectedBookForAdd = null;
  $('#addModal .modal-actions').innerHTML = '<button class="btn btn-ghost" id="cancelAdd">닫기</button>';
  $('#cancelAdd').onclick = closeAdd;
  setShelfSeg(currentShelfTarget);
}

function closeAdd() { $('#addModal').classList.remove('show'); }

$('#searchBtn').onclick = () => { const q = $('#searchInput').value.trim(); if (q) searchBooks(q); };
$('#searchInput').onkeydown = e => { if (e.key === 'Enter') { const q = e.target.value.trim(); if (q) searchBooks(q); } };

function setShelfSeg(s) {
  currentShelfTarget = s;
  $('#segRead').classList.toggle('on', s === 'read');
  $('#segWish').classList.toggle('on', s === 'wish');
}

$('#segRead').onclick = () => setShelfSeg('read');
$('#segWish').onclick = () => setShelfSeg('wish');

// ============================================================
//  완료 모달 (타이머 끝 → 오늘 읽은 책 고르고 한 줄)
// ============================================================
let donePickId = null;

function openDoneModal() {
  const read = state.books.filter(b => b.shelf === 'read');
  $('#doneTitle').textContent = `${state.timerMin}분 완독! 🎉`;
  donePickId = null;
  $('#doneQuote').value = '';
  const pick = $('#bookPick');
  if (read.length === 0) {
    $('#doneSub').textContent = '먼저 읽은 책을 추가하면 거기에 한 줄을 남길 수 있어요';
    pick.innerHTML = '<div style="font-size:.82rem;color:var(--ink-soft);padding:6px">아래 닫기 후 ＋로 책을 추가해보세요</div>';
  } else {
    $('#doneSub').textContent = '오늘 읽은 책을 고르고 한 줄을 남겨요';
    pick.innerHTML = read.map(b => `<div class="bp" data-id="${b.id}">
      ${b.cover ? `<img src="${b.cover}">` : `<div class="bp-no">${esc(b.title)}</div>`}
      <div class="bp-name">${esc(b.title)}</div></div>`).join('');
    pick.querySelectorAll('.bp').forEach(el => el.onclick = () => {
      pick.querySelectorAll('.bp').forEach(x => x.classList.remove('sel'));
      el.classList.add('sel');
      donePickId = el.dataset.id;
    });
  }
  $('#doneModal').classList.add('show');
}

$('#saveQuote').onclick = () => {
  const q = $('#doneQuote').value.trim();
  if (donePickId && q) {
    const b = state.books.find(x => x.id == donePickId);
    if (b) { b.quote = q; saveState(); renderShelves(); }
    toast('한 줄을 책장에 새겼어요 ✍️');
    // 한 줄 탭이 열려있으면 즉시 갱신
    if (document.querySelector('.tab.active')?.dataset.tab === 'quotes') renderQuotes();
  }
  $('#doneModal').classList.remove('show');
};

$('#skipQuote').onclick = () => $('#doneModal').classList.remove('show');

// ============================================================
//  책 상세 모달
// ============================================================
function openDetail(id) {
  const b = state.books.find(x => x.id == id);
  if (!b) return;
  detailBookId = id;
  $('#detailTitle').textContent = b.title;
  $('#detailAuthor').textContent = b.author || '';
  $('#detailQuote').textContent = b.quote ? `"${b.quote}"` : '아직 남긴 한 줄이 없어요';
  $('#detailQuote').style.display = 'block';
  $('#detailModal').classList.add('show');
}

$('#deleteBook').onclick = () => {
  state.books = state.books.filter(x => x.id != detailBookId);
  saveState();
  renderShelves();
  renderStats();
  $('#detailModal').classList.remove('show');
  toast('책장에서 뺐어요');
};

$('#closeDetail').onclick = () => $('#detailModal').classList.remove('show');

// 모달 배경 클릭 시 닫기
document.querySelectorAll('.modal-bg').forEach(m => m.onclick = e => {
  if (e.target === m) m.classList.remove('show');
});

// ============================================================
//  초기화
// ============================================================
loadState();
initTimerFromState();
renderShelves();
renderStats();
renderStreak();
renderHeatmap();
