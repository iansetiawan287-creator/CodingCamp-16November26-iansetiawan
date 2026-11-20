/* =============================================
   LIFE DASHBOARD — script.js
   Modul:
   1. Greeting (jam, tanggal, nama, sapaan)
   2. To-Do List (tambah, edit, hapus, cek duplikat)
   3. Focus Timer (25 menit, start/stop/reset)
   4. Quick Links (tambah, hapus)
   5. Dark / Light Mode
   ============================================= */

/* =============================================
   MODUL 1 — GREETING
   Menampilkan jam real-time, tanggal, sapaan
   berdasarkan waktu, dan nama user yang tersimpan
   di Local Storage.
   ============================================= */

const greetingText  = document.getElementById('greeting-text');
const userNameEl    = document.getElementById('user-name');
const editNameBtn   = document.getElementById('edit-name-btn');
const nameInput     = document.getElementById('name-input');
const clockEl       = document.getElementById('clock');
const dateDisplayEl = document.getElementById('date-display');

/** Ambil nama user dari Local Storage, default "Sobat" */
function loadUserName() {
  const saved = localStorage.getItem('dashboard_name');
  userNameEl.textContent = saved || 'Sobat';
}

/** Simpan nama baru ke Local Storage */
function saveUserName(name) {
  const clean = name.trim();
  if (clean === '') return;
  localStorage.setItem('dashboard_name', clean);
  userNameEl.textContent = clean;
}

/** Tentukan sapaan berdasarkan jam saat ini */
function getGreeting(hour) {
  if (hour >= 5  && hour < 12) return 'Selamat Pagi,';
  if (hour >= 12 && hour < 15) return 'Selamat Siang,';
  if (hour >= 15 && hour < 18) return 'Selamat Sore,';
  return 'Selamat Malam,';
}

/** Perbarui jam, tanggal, dan teks sapaan setiap detik */
function updateClock() {
  const now    = new Date();
  const hour   = now.getHours();
  const minute = now.getMinutes();
  const second = now.getSeconds();

  // Format jam HH:MM:SS
  clockEl.textContent = [hour, minute, second]
    .map(n => String(n).padStart(2, '0'))
    .join(':');

  // Format tanggal lengkap bahasa Indonesia
  const days   = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const months = ['Januari','Februari','Maret','April','Mei','Juni',
                  'Juli','Agustus','September','Oktober','November','Desember'];
  dateDisplayEl.textContent =
    `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

  // Sapaan berdasarkan jam
  greetingText.textContent = getGreeting(hour);
}

// Toggle tampil/sembunyikan input nama
editNameBtn.addEventListener('click', () => {
  nameInput.classList.toggle('hidden');
  if (!nameInput.classList.contains('hidden')) {
    nameInput.value = '';
    nameInput.focus();
  }
});

// Simpan nama ketika user menekan Enter
nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    saveUserName(nameInput.value);
    nameInput.classList.add('hidden');
  }
  if (e.key === 'Escape') {
    nameInput.classList.add('hidden');
  }
});

// Inisialisasi greeting
loadUserName();
updateClock();
setInterval(updateClock, 1000);


/* =============================================
   MODUL 2 — TO-DO LIST
   - Tambah tugas (cek duplikat sebelum simpan)
   - Edit tugas inline
   - Tandai selesai (checkbox)
   - Hapus tugas
   - Semua data disimpan di Local Storage
   ============================================= */

const todoInput        = document.getElementById('todo-input');
const todoAddBtn       = document.getElementById('todo-add-btn');
const todoListEl       = document.getElementById('todo-list');
const todoDuplicateMsg = document.getElementById('todo-duplicate-msg');
const todoSummaryEl    = document.getElementById('todo-summary');

const STORAGE_KEY_TODOS = 'dashboard_todos';

/** Ambil semua todo dari Local Storage */
function getTodos() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY_TODOS) || '[]');
}

/** Simpan array todo ke Local Storage */
function saveTodos(todos) {
  localStorage.setItem(STORAGE_KEY_TODOS, JSON.stringify(todos));
}

/** Cek apakah teks tugas sudah ada (case-insensitive) */
function isDuplicate(text, todos) {
  return todos.some(t => t.text.toLowerCase() === text.toLowerCase());
}

/** Render ulang seluruh daftar todo ke DOM */
function renderTodos() {
  const todos = getTodos();
  todoListEl.innerHTML = '';

  todos.forEach((todo, index) => {
    const li = document.createElement('li');
    li.className = `todo-item${todo.done ? ' done' : ''}`;
    li.dataset.index = index;

    li.innerHTML = `
      <input type="checkbox" class="todo-checkbox" ${todo.done ? 'checked' : ''} />
      <span class="todo-text">${escapeHTML(todo.text)}</span>
      <div class="todo-actions">
        <button class="btn-edit" title="Edit">✏️</button>
        <button class="btn-delete" title="Hapus">🗑️</button>
      </div>
    `;
    todoListEl.appendChild(li);
  });

  updateTodoSummary(todos);
}

/** Hitung dan tampilkan sisa tugas yang belum selesai */
function updateTodoSummary(todos) {
  const remaining = todos.filter(t => !t.done).length;
  todoSummaryEl.textContent = remaining === 0
    ? '✅ Semua tugas selesai!'
    : `${remaining} tugas tersisa`;
}

/** Tambah tugas baru */
function addTodo() {
  const text  = todoInput.value.trim();
  const todos = getTodos();

  if (text === '') return;

  // Cek duplikat
  if (isDuplicate(text, todos)) {
    todoDuplicateMsg.classList.remove('hidden');
    setTimeout(() => todoDuplicateMsg.classList.add('hidden'), 2500);
    return;
  }

  todos.push({ text, done: false });
  saveTodos(todos);
  renderTodos();
  todoInput.value = '';
  todoDuplicateMsg.classList.add('hidden');
}

/** Aktifkan mode edit inline pada item todo */
function startEdit(li, index) {
  const todos   = getTodos();
  const current = todos[index].text;

  // Ganti span teks dengan input
  const textSpan = li.querySelector('.todo-text');
  const actions  = li.querySelector('.todo-actions');

  const editInput = document.createElement('input');
  editInput.type      = 'text';
  editInput.value     = current;
  editInput.className = 'todo-edit-input';
  editInput.maxLength = 100;

  textSpan.replaceWith(editInput);
  editInput.focus();

  // Ganti tombol dengan tombol Simpan
  actions.innerHTML = `<button class="btn-save" title="Simpan">💾</button>`;

  const saveBtn = actions.querySelector('.btn-save');

  function saveEdit() {
    const newText = editInput.value.trim();
    if (newText === '' || newText === current) {
      renderTodos(); // batalkan, kembalikan ke tampilan semula
      return;
    }
    todos[index].text = newText;
    saveTodos(todos);
    renderTodos();
  }

  saveBtn.addEventListener('click', saveEdit);
  editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  saveEdit();
    if (e.key === 'Escape') renderTodos();
  });
}

// Event delegation untuk checkbox, edit, delete
todoListEl.addEventListener('click', (e) => {
  const li    = e.target.closest('.todo-item');
  if (!li) return;
  const index = parseInt(li.dataset.index, 10);
  const todos = getTodos();

  if (e.target.classList.contains('todo-checkbox')) {
    todos[index].done = e.target.checked;
    saveTodos(todos);
    renderTodos();
  } else if (e.target.classList.contains('btn-edit')) {
    startEdit(li, index);
  } else if (e.target.classList.contains('btn-delete')) {
    todos.splice(index, 1);
    saveTodos(todos);
    renderTodos();
  }
});

// Tambah via tombol atau Enter
todoAddBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTodo();
});

// Inisialisasi todo
renderTodos();


/* =============================================
   MODUL 3 — FOCUS TIMER
   - 25 menit countdown
   - Tombol Start, Stop, Reset
   - Notifikasi saat waktu habis
   ============================================= */

const timerDisplayEl = document.getElementById('timer-display');
const timerStatusEl  = document.getElementById('timer-status');
const timerStartBtn  = document.getElementById('timer-start');
const timerStopBtn   = document.getElementById('timer-stop');
const timerResetBtn  = document.getElementById('timer-reset');

const FOCUS_DURATION = 25 * 60; // 25 menit dalam detik

let timerInterval  = null;
let timeRemaining  = FOCUS_DURATION;
let timerIsRunning = false;

/** Format detik menjadi MM:SS */
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Perbarui tampilan timer */
function updateTimerDisplay() {
  timerDisplayEl.textContent = formatTime(timeRemaining);
}

/** Mulai timer */
function startTimer() {
  if (timerIsRunning) return;
  timerIsRunning = true;

  timerDisplayEl.classList.remove('finished');
  timerDisplayEl.classList.add('running');
  timerStatusEl.textContent = '🔥 Fokus sedang berjalan...';

  timerInterval = setInterval(() => {
    timeRemaining--;
    updateTimerDisplay();

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      timerIsRunning = false;
      timerDisplayEl.classList.remove('running');
      timerDisplayEl.classList.add('finished');
      timerStatusEl.textContent = '🎉 Sesi fokus selesai! Istirahat dulu ya.';
      // Notifikasi browser jika diizinkan
      if (Notification && Notification.permission === 'granted') {
        new Notification('Focus Timer', { body: 'Sesi 25 menit selesai! Waktu istirahat 🎉' });
      }
    }
  }, 1000);
}

/** Hentikan (pause) timer */
function stopTimer() {
  if (!timerIsRunning) return;
  clearInterval(timerInterval);
  timerIsRunning = false;
  timerDisplayEl.classList.remove('running');
  timerStatusEl.textContent = '⏸ Timer dijeda.';
}

/** Reset timer ke 25:00 */
function resetTimer() {
  clearInterval(timerInterval);
  timerIsRunning = false;
  timeRemaining  = FOCUS_DURATION;
  timerDisplayEl.classList.remove('running', 'finished');
  updateTimerDisplay();
  timerStatusEl.textContent = 'Siap fokus? 🎯';
}

timerStartBtn.addEventListener('click', startTimer);
timerStopBtn.addEventListener('click', stopTimer);
timerResetBtn.addEventListener('click', resetTimer);

// Minta izin notifikasi saat halaman dimuat
if (Notification && Notification.permission === 'default') {
  Notification.requestPermission();
}

// Inisialisasi timer
updateTimerDisplay();


/* =============================================
   MODUL 4 — QUICK LINKS
   - Tambah link (nama + URL)
   - Hapus link
   - Simpan di Local Storage
   ============================================= */

const linkNameInput = document.getElementById('link-name-input');
const linkUrlInput  = document.getElementById('link-url-input');
const linkAddBtn    = document.getElementById('link-add-btn');
const linksListEl   = document.getElementById('links-list');

const STORAGE_KEY_LINKS = 'dashboard_links';

/** Ambil semua links dari Local Storage */
function getLinks() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY_LINKS) || '[]');
}

/** Simpan array links ke Local Storage */
function saveLinks(links) {
  localStorage.setItem(STORAGE_KEY_LINKS, JSON.stringify(links));
}

/** Pastikan URL memiliki protokol */
function normalizeUrl(url) {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url;
  }
  return url;
}

/** Render ulang seluruh daftar link */
function renderLinks() {
  const links = getLinks();
  linksListEl.innerHTML = '';

  links.forEach((link, index) => {
    const item = document.createElement('div');
    item.className = 'link-item';
    item.innerHTML = `
      <a href="${escapeHTML(link.url)}" target="_blank" rel="noopener noreferrer">
        🔗 ${escapeHTML(link.name)}
      </a>
      <button class="link-delete" data-index="${index}" title="Hapus">✕</button>
    `;
    linksListEl.appendChild(item);
  });
}

/** Tambah link baru */
function addLink() {
  const name = linkNameInput.value.trim();
  const url  = linkUrlInput.value.trim();

  if (name === '' || url === '') return;

  const links = getLinks();
  links.push({ name, url: normalizeUrl(url) });
  saveLinks(links);
  renderLinks();

  linkNameInput.value = '';
  linkUrlInput.value  = '';
}

// Event delegation untuk hapus link
linksListEl.addEventListener('click', (e) => {
  if (e.target.classList.contains('link-delete')) {
    const index = parseInt(e.target.dataset.index, 10);
    const links = getLinks();
    links.splice(index, 1);
    saveLinks(links);
    renderLinks();
  }
});

linkAddBtn.addEventListener('click', addLink);
linkUrlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addLink();
});

// Inisialisasi links
renderLinks();


/* =============================================
   MODUL 5 — DARK / LIGHT MODE
   - Tombol toggle 🌙 / ☀️
   - Simpan preferensi di Local Storage
   ============================================= */

const themeToggleBtn = document.getElementById('theme-toggle');
const STORAGE_KEY_THEME = 'dashboard_theme';

/** Terapkan tema ke body */
function applyTheme(isDark) {
  if (isDark) {
    document.body.classList.add('dark');
    themeToggleBtn.textContent = '☀️';
    themeToggleBtn.title = 'Switch ke Light Mode';
  } else {
    document.body.classList.remove('dark');
    themeToggleBtn.textContent = '🌙';
    themeToggleBtn.title = 'Switch ke Dark Mode';
  }
}

/** Load preferensi tema dari Local Storage */
function loadTheme() {
  const saved = localStorage.getItem(STORAGE_KEY_THEME);
  // Jika belum pernah disimpan, ikuti preferensi sistem
  if (saved === null) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark);
  } else {
    applyTheme(saved === 'dark');
  }
}

themeToggleBtn.addEventListener('click', () => {
  const isDark = !document.body.classList.contains('dark');
  applyTheme(isDark);
  localStorage.setItem(STORAGE_KEY_THEME, isDark ? 'dark' : 'light');
});

// Inisialisasi tema
loadTheme();


/* =============================================
   UTILITY
   ============================================= */

/** Escape karakter HTML untuk mencegah XSS */
function escapeHTML(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(str).replace(/[&<>"']/g, m => map[m]);
}
