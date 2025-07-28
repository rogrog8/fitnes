// Inisialisasi
let fitnessDiary = JSON.parse(localStorage.getItem('fitnessDiary')) || {};
const today = new Date().toISOString().split('T')[0];

// Update UI Saat Load
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('currentDate').textContent = formatDate(today);
    renderTodayExercises();
    renderProgressChart();
});

// 1. Variabel baru untuk tracking
let lastWorkoutDate = null;
const MIDNIGHT_RESET_KEY = 'lastMidnightReset';

// 2. Fungsi deteksi hari baru (diperbarui)
function checkDayChange() {
    const today = new Date();
    const todayDateStr = today.toLocaleDateString('id-ID');
    const lastResetDate = localStorage.getItem(MIDNIGHT_RESET_KEY);
    
    // Jika belum pernah reset atau sudah ganti hari
    if (!lastResetDate || lastResetDate !== todayDateStr) {
        resetTimer();
        localStorage.setItem(MIDNIGHT_RESET_KEY, todayDateStr);
        console.log('Auto-reset: Hari baru terdeteksi');
    }
}

// 3. Fungsi reset yang diperbarui
function resetTimer() {
    clearInterval(timerInterval);
    seconds = 0;
    if (workoutTimeEl) workoutTimeEl.textContent = formatTime(0);
    isRunning = false;
    if (startBtn) startBtn.disabled = false;
    if (pauseBtn) pauseBtn.disabled = true;
    localStorage.removeItem('currentWorkoutTime');
}

// 4. Panggil saat inisialisasi
document.addEventListener('DOMContentLoaded', () => {
    // Jalankan pengecekan hari
    checkDayChange();
    
    // Cek juga setiap 5 menit (fallback)
    setInterval(checkDayChange, 300000);
    
    // Load waktu yang belum tersimpan
    const savedTime = localStorage.getItem('currentWorkoutTime');
    if (savedTime) {
        seconds = parseInt(savedTime);
        if (workoutTimeEl) workoutTimeEl.textContent = formatTime(seconds);
    }
});

// ===== [1] STOPWATCH SYSTEM ===== //
let timerInterval;
let seconds = 0;
let isRunning = false;

// Elements
const startBtn = document.getElementById('startTimer');
const pauseBtn = document.getElementById('pauseTimer');
const workoutTimeEl = document.getElementById('workoutTime');

// Update formatTime function
function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  
  // Format minimalis untuk mobile: "45m" atau "1h 5m"
  if (mins < 60) {
    return `${mins}m`;
  } else {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  }
}

// Update di semua bagian yang menggunakan formatTime()

// Update timer
function updateTimer() {
  seconds++;
  workoutTimeEl.textContent = formatTime(seconds);
  localStorage.setItem('currentWorkoutTime', seconds);
}
// DOM Elements
const todayBtn = document.getElementById('todayBtn');
const historyBtn = document.getElementById('historyBtn');
const exportBtn = document.getElementById('exportBtn');
const historySection = document.getElementById('historySection');
const historyList = document.getElementById('historyList');

// Toggle View
todayBtn.addEventListener('click', () => {
  historySection.classList.add('hidden');
  document.querySelector('.today-exercises').classList.remove('hidden');
  todayBtn.classList.add('active');
  historyBtn.classList.remove('active');
});

historyBtn.addEventListener('click', () => {
  renderHistory();
  historySection.classList.remove('hidden');
  document.querySelector('.today-exercises').classList.add('hidden');
  historyBtn.classList.add('active');
  todayBtn.classList.remove('active');
});

// Render History
function renderHistory() {
  historyList.innerHTML = '';
  
  Object.entries(fitnessDiary).sort((a, b) => new Date(b[0]) - new Date(a[0])).forEach(([date, exercises]) => {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    
    let exercisesHTML = '';
    let totalExercises = 0;
    
    Object.entries(exercises).forEach(([name, data]) => {
      if (name !== 'workoutTime') {
        exercisesHTML += `
          <div class="history-exercise">
            <span>${name.replace('-', ' ').toUpperCase()}</span>
            <span>${data.completed}/${data.target}</span>
          </div>
        `;
        totalExercises++;
      }
    });
    
    historyItem.innerHTML = `
      <h3>${formatDisplayDate(date)}</h3>
      <p>${totalExercises} latihan diselesaikan</p>
      ${exercisesHTML}
    `;
    
    historyList.appendChild(historyItem);
  });
}

// Format Tanggal untuk Tampilan
function formatDisplayDate(dateString) {
  const options = { weekday: 'long', day: 'numeric', month: 'long' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
}

// Event Listeners
startBtn.addEventListener('click', () => {
  if (!isRunning) {
    isRunning = true;
    timerInterval = setInterval(updateTimer, 1000);
    startBtn.disabled = true;
    pauseBtn.disabled = false;
  }
});

pauseBtn.addEventListener('click', () => {
  clearInterval(timerInterval);
  isRunning = false;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
});

// Load waktu yang belum tersimpan
window.addEventListener('load', () => {
  const savedTime = localStorage.getItem('currentWorkoutTime');
  if (savedTime) {
    seconds = parseInt(savedTime);
    workoutTimeEl.textContent = formatTime(seconds);
  }
});

// ===== [2] INTEGRASI DENGAN FITNESS DIARY ===== //
function saveWorkout() {
  const today = new Date().toISOString().split('T')[0];
  const exercise = document.getElementById('exerciseType').value;
  const target = parseInt(document.getElementById('targetReps').value);
  const completed = parseInt(document.getElementById('completedReps').value);

  if (!fitnessDiary[today]) {
    fitnessDiary[today] = {};
  }

  // Simpan latihan
  fitnessDiary[today][exercise] = { target, completed };
  
  // Simpan waktu latihan jika ada
  if (seconds > 0) {
    fitnessDiary[today].workoutTime = seconds;
    seconds = 0; // Reset setelah disimpan
    workoutTimeEl.textContent = formatTime(0);
    localStorage.removeItem('currentWorkoutTime');
  }

  localStorage.setItem('fitnessDiary', JSON.stringify(fitnessDiary));
  renderTodayExercises();
}

// ===== [3] UPDATE PROGRESS SUMMARY ===== //
function updateProgressSummary() {
  const today = new Date().toISOString().split('T')[0];
  if (!fitnessDiary[today]) return;

  let totalCalories = 0;
  let totalWorkoutTime = 0;

  Object.entries(fitnessDiary[today]).forEach(([key, data]) => {
    if (key === 'workoutTime') {
      totalWorkoutTime = data;
    } else if (typeof data === 'object') {
      totalCalories += data.completed * 5; // 5 kalori per repetisi
    }
  });

  document.getElementById('caloriesBurned').textContent = totalCalories;
  document.getElementById('workoutTime').textContent = formatTime(totalWorkoutTime);
}

// Format Tanggal
function formatDate(dateString) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

// Simpan Latihan
function saveWorkout() {
    const exercise = document.getElementById('exerciseType').value;
    const target = parseInt(document.getElementById('targetReps').value);
    const completed = parseInt(document.getElementById('completedReps').value);

    if (!fitnessDiary[today]) {
        fitnessDiary[today] = {};
    }

    fitnessDiary[today][exercise] = { target, completed };
    localStorage.setItem('fitnessDiary', JSON.stringify(fitnessDiary));
    
    renderTodayExercises();
    updateProgressSummary();
}

// Render Daftar Latihan
function renderTodayExercises() {
  const today = new Date().toISOString().split('T')[0];
  const container = document.getElementById('exercisesList');
  container.innerHTML = '';

  if (!fitnessDiary[today] || Object.keys(fitnessDiary[today]).length === 0) {
    container.innerHTML = '<p class="empty-state">Belum ada latihan hari ini</p>';
    return;
  }

  // Hanya tampilkan data hari ini
  for (const [exercise, data] of Object.entries(fitnessDiary[today])) {
    if (exercise === 'workoutTime') continue;
    
    const progress = Math.min(100, (data.completed / data.target) * 100);
    const exerciseEl = document.createElement('div');
    exerciseEl.className = 'exercise-item';
    exerciseEl.innerHTML = `
      <div>
        <span class="exercise-name">${exercise.toUpperCase()}</span>
        <div class="progress-bar" style="width: ${progress}%"></div>
      </div>
      <span class="exercise-progress">${data.completed}/${data.target}</span>
    `;
    container.appendChild(exerciseEl);
  }
}

// Update Progress Summary
function updateProgressSummary() {
    if (!fitnessDiary[today]) return;
    
    let totalCalories = 0;
    Object.entries(fitnessDiary[today]).forEach(([exercise, data]) => {
        // Estimasi kalori (contoh: 5 kalori per rep)
        totalCalories += data.completed * 5; 
    });
    
    document.getElementById('caloriesBurned').textContent = totalCalories;
}

function purgeOldData() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30); // Hapus data >1 bulan

  Object.keys(fitnessDiary).forEach(date => {
    if (new Date(date) < cutoffDate) {
      delete fitnessDiary[date];
    }
  });

  localStorage.setItem('fitnessDiary', JSON.stringify(fitnessDiary));
}

// Jalankan seminggu sekali
setInterval(purgeOldData, 604800000);

// Grafik Progress
function renderProgressChart() {
    const ctx = document.getElementById('progressChart').getContext('2d');
    
    // Ambil data 7 hari terakhir
    const dates = [];
    const pushupData = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dates.push(new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }));
        
        if (fitnessDiary[dateStr]?.push-up) {
            pushupData.push(fitnessDiary[dateStr]['push-up'].completed);
        } else {
            pushupData.push(0);
        }
    }
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [{
                label: 'Push-Up Completed',
                data: pushupData,
                backgroundColor: '#6c5ce7',
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            }
        }
    });
}
