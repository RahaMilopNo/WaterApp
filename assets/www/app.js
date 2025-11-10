let appData = {
  name: '',
  goal: 2000,
  current: 0,
  history: [],
  reminders: false,
  reminderInterval: 60, 
  setupComplete: false
};

function loadData() {
  const saved = localStorage.getItem('waterTrackerData');
  if (saved) appData = JSON.parse(saved);
}

function saveData() {
  localStorage.setItem('waterTrackerData', JSON.stringify(appData));
}

function init() {
  loadData();
  if (appData.setupComplete) showScreen('home');
  else showScreen('welcome');
  updateDisplay();
  setupReminders();
}

function completeSetup() {
  const name = document.getElementById('userName').value.trim();
  if (!name) return alert('Введите имя');
  appData.name = name;
  appData.setupComplete = true;
  saveData();
  showScreen('home');
  setupReminders();
}

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const screens = ['home', 'history', 'stats', 'profile', 'settings', 'achievements'];
  const index = screens.indexOf(screenId);
  if (index >= 0 && document.querySelectorAll('.nav-item')[index]) {
    document.querySelectorAll('.nav-item')[index].classList.add('active');
  }

  if (screenId === 'history') updateHistory();
  if (screenId === 'stats') updateStats();
  if (screenId === 'profile') updateProfile();
  if (screenId === 'settings') loadSettings();
  if (screenId === 'achievements') updateAchievements();
}

function addWater(amount) {
  appData.current += amount;
  const today = new Date().toLocaleDateString();
  const todayEntry = appData.history.find(h => h.date === today);
  if (todayEntry) todayEntry.amount += amount;
  else appData.history.push({ date: today, amount });
  saveData();
  updateDisplay();
}

function showCustomAmount() { showScreen('custom'); }

function addCustomWater() {
  const amount = parseInt(document.getElementById('customAmount').value);
  if (isNaN(amount) || amount <= 0) return alert('Введите корректное количество');
  addWater(amount);
  document.getElementById('customAmount').value = '';
  showScreen('home');
}

function updateDisplay() {
  document.getElementById('currentAmount').textContent = appData.current + ' мл';
  document.getElementById('goalDisplay').textContent = appData.goal;
  const progress = Math.min((appData.current / appData.goal) * 100, 100);
  document.getElementById('progressFill').style.width = progress + '%';
}

function updateHistory() {
  const list = document.getElementById('historyList');
  if (appData.history.length === 0)
    list.innerHTML = '<div class="welcome-text">История пуста</div>';
  else
    list.innerHTML = appData.history.slice().reverse().map(h =>
      `<div class="history-item"><span class="history-date">${h.date}</span><span class="history-amount">${h.amount} мл</span></div>`
    ).join('');
}

function updateStats() {
  const today = new Date().toLocaleDateString();
  const todayEntry = appData.history.find(h => h.date === today);
  document.getElementById('todayTotal').textContent = todayEntry ? todayEntry.amount : 0;

  const lastWeek = appData.history.slice(-7);
  const weekAvg = lastWeek.length ? Math.round(lastWeek.reduce((s, h) => s + h.amount, 0) / lastWeek.length) : 0;
  document.getElementById('weekAverage').textContent = weekAvg;
  document.getElementById('totalDays').textContent = appData.history.length;
  document.getElementById('achievedDays').textContent = appData.history.filter(h => h.amount >= appData.goal).length;
}

function updateProfile() {
  document.getElementById('profileName').textContent = appData.name || 'Пользователь';
  document.getElementById('profileGoal').textContent = appData.goal + ' мл';
  const total = appData.history.reduce((s, h) => s + h.amount, 0);
  document.getElementById('profileTotal').textContent = (total / 1000).toFixed(1) + ' л';
}

function loadSettings() {
  document.getElementById('settingsName').value = appData.name;
  document.getElementById('goalInput').value = appData.goal;
  document.getElementById('reminderInterval').value = appData.reminderInterval;
  const toggle = document.getElementById('reminderToggle');
  if (appData.reminders) toggle.classList.add('active');
  else toggle.classList.remove('active');
}

function saveSettings() {
  appData.name = document.getElementById('settingsName').value;
  appData.goal = parseInt(document.getElementById('goalInput').value) || 2000;
  saveData();
  updateDisplay();
  setupReminders();
  alert('Настройки сохранены');
  showScreen('home');
}

function toggleReminder() {
  const toggle = document.getElementById('reminderToggle');
  appData.reminders = !appData.reminders;
  toggle.classList.toggle('active');
  saveData();
  setupReminders();
}

function saveReminders() {
  appData.reminderInterval = parseInt(document.getElementById('reminderInterval').value) || 60;
  saveData();
  setupReminders();
  alert('Настройки напоминаний сохранены');
}

let reminderTimer = null;

function setupReminders() {
  stopReminders();
  if (!appData.reminders) return;
  startReminders();
}

function startReminders() {
  reminderTimer = setInterval(() => {
    const now = new Date();
    const hours = now.getHours();
    if (hours >= 8 && hours <= 22) {
      alert('💧 Не забудь выпить воды!');
    }
  }, appData.reminderInterval * 60 * 1000);
}

function stopReminders() {
  if (reminderTimer) clearInterval(reminderTimer);
  reminderTimer = null;
}

function checkStreak(days) {
  if (appData.history.length < days) return false;

  const sorted = appData.history
    .filter(h => h.amount >= appData.goal) 
    .map(h => new Date(h.date))
    .sort((a, b) => a - b);

  if (sorted.length < days) return false;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = (sorted[i] - sorted[i - 1]) / (1000 * 60 * 60 * 24);
    if (diff <= 1.1) streak++;
    else streak = 1;
    if (streak >= days) return true;
  }
  return false;
}

function updateAchievements() {
  const list = document.getElementById('achievementsList');
  if (!list) return;

  const achievements = [
    { title: 'Первый шаг', desc: 'Выпей первый стакан воды', achieved: appData.history.length > 0 },
    { title: '3 дня подряд', desc: 'Пей воду 3 дня без пропусков', achieved: checkStreak(3) },
    { title: 'Неделя успеха', desc: 'Пей воду 7 дней подряд', achieved: checkStreak(7) },
    { title: 'Цель достигнута', desc: 'Достигни дневной цели', achieved: appData.history.some(h => h.amount >= appData.goal) }
  ];

  list.innerHTML = achievements.map(a => `
    <div class="stats-card ${a.achieved ? 'achieved' : ''}">
      <div style="font-size:40px;margin-bottom:10px;">${a.achieved ? '🏆' : '🔒'}</div>
      <div class="stats-label">${a.title}</div>
      <div class="welcome-text">${a.desc}</div>
    </div>
  `).join('');
}

function checkNewDay() {
  const today = new Date().toLocaleDateString();
  const lastDate = appData.history.length ? appData.history[appData.history.length - 1].date : '';
  if (lastDate !== today) {
    appData.current = 0;
    saveData();
    updateDisplay();
  }
}

function logout() {
  if (confirm('Вы уверены, что хотите выйти?')) {
    localStorage.removeItem('waterTrackerData');
    appData = { name: '', goal: 2000, current: 0, history: [], reminders: false, reminderInterval: 60, setupComplete: false };
    showScreen('welcome');
    stopReminders();
  }
}

init();
checkNewDay();
setInterval(checkNewDay, 60000);
