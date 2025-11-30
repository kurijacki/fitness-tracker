// Data Model
let appData = {
  workouts: [],
  goals: {
    targetDate: null,
    targetWeight: null,
    monthlyHours: null,
  },
};

// State
let currentView = "monthly";
let currentDate = new Date();
let chart = null;

// DOM Elements
const calendarContainer = document.getElementById("calendarContainer");
const periodTitle = document.getElementById("periodTitle");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const navBtns = document.querySelectorAll(".nav-btn");
const entryModal = document.getElementById("entryModal");
const settingsModal = document.getElementById("settingsModal");
const entryForm = document.getElementById("entryForm");
const closeModal = document.getElementById("closeModal");
const closeSettingsModal = document.getElementById("closeSettingsModal");
const cancelBtn = document.getElementById("cancelBtn");
const printBtn = document.getElementById("printBtn");
const settingsBtn = document.getElementById("settingsBtn");
const deleteBtn = document.getElementById("deleteBtn");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");
const clearAllBtn = document.getElementById("clearAllBtn");
const saveGoalsBtn = document.getElementById("saveGoalsBtn");

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadData();
  setupEventListeners();
  renderCalendar();
  renderChart();
});

// Event Listeners
function setupEventListeners() {
  // Navigation
  navBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentView = btn.dataset.view;
      navBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderCalendar();
      renderChart();
    });
  });

  prevBtn.addEventListener("click", () => navigatePeriod(-1));
  nextBtn.addEventListener("click", () => navigatePeriod(1));

  // Modals
  settingsBtn.addEventListener("click", () => openSettingsModal());
  closeSettingsModal.addEventListener("click", closeSettings);
  closeModal.addEventListener("click", closeEntryModal);
  cancelBtn.addEventListener("click", closeEntryModal);

  // Entry Form
  entryForm.addEventListener("submit", saveEntry);
  deleteBtn.addEventListener("click", deleteEntry);

  // Settings
  saveGoalsBtn.addEventListener("click", saveGoals);
  exportBtn.addEventListener("click", exportJSON);
  importBtn.addEventListener("click", () => importFile.click());
  importFile.addEventListener("change", importJSON);
  clearAllBtn.addEventListener("click", clearAllData);

  // Print
  printBtn.addEventListener("click", () => window.print());

  // Close modals on outside click
  entryModal.addEventListener("click", (e) => {
    if (e.target === entryModal) closeEntryModal();
  });
  settingsModal.addEventListener("click", (e) => {
    if (e.target === settingsModal) closeSettings();
  });

  // Escape key to close modals
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeEntryModal();
      closeSettings();
    }
  });
}

// Data Management
function saveData() {
  try {
    localStorage.setItem("fitnessTrackerData", JSON.stringify(appData));
    showToast("Podaci sačuvani", "success");
  } catch (error) {
    console.error("Greška pri čuvanju:", error);
    showToast("Greška pri čuvanju podataka", "error");
  }
}

function loadData() {
  try {
    const saved = localStorage.getItem("fitnessTrackerData");
    if (saved) {
      appData = JSON.parse(saved);
      // Load goals into settings form
      if (appData.goals.targetDate) {
        document.getElementById("targetDate").value = appData.goals.targetDate;
      }
      if (appData.goals.targetWeight) {
        document.getElementById("targetWeight").value =
          appData.goals.targetWeight;
      }
      if (appData.goals.monthlyHours) {
        document.getElementById("monthlyHours").value =
          appData.goals.monthlyHours;
      }
    }
  } catch (error) {
    console.error("Greška pri učitavanju:", error);
    showToast("Greška pri učitavanju podataka", "error");
  }
}

function exportJSON() {
  try {
    const dataStr = JSON.stringify(appData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    const date = new Date().toISOString().split("T")[0];
    link.download = `fitness-tracker-backup-${date}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Podaci preuzeti", "success");
  } catch (error) {
    console.error("Greška pri exportu:", error);
    showToast("Greška pri preuzimanju podataka", "error");
  }
}

function importJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (confirm("Želite li da zamenite postojeće podatke?")) {
        appData = imported;
        saveData();
        renderCalendar();
        renderChart();
        showToast("Podaci učitani", "success");
      }
    } catch (error) {
      console.error("Greška pri importu:", error);
      showToast("Greška pri učitavanju fajla", "error");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function clearAllData() {
  if (
    confirm(
      "Da li ste sigurni da želite da obrišete sve podatke? Ova akcija se ne može poništiti."
    )
  ) {
    appData = {
      workouts: [],
      goals: { targetDate: null, targetWeight: null, monthlyHours: null },
    };
    localStorage.removeItem("fitnessTrackerData");
    renderCalendar();
    renderChart();
    showToast("Svi podaci obrisani", "success");
  }
}

function saveGoals() {
  appData.goals.targetDate =
    document.getElementById("targetDate").value || null;
  appData.goals.targetWeight =
    parseFloat(document.getElementById("targetWeight").value) || null;
  appData.goals.monthlyHours =
    parseFloat(document.getElementById("monthlyHours").value) || null;
  saveData();
  renderChart();
  showToast("Ciljevi sačuvani", "success");
}

// Calendar Rendering
function navigatePeriod(direction) {
  if (currentView === "monthly") {
    currentDate.setMonth(currentDate.getMonth() + direction);
  } else if (currentView === "weekly") {
    currentDate.setDate(currentDate.getDate() + direction * 7);
  } else if (currentView === "daily") {
    currentDate.setDate(currentDate.getDate() + direction);
  }
  renderCalendar();
  renderChart();
}

function renderCalendar() {
  if (currentView === "monthly") {
    renderMonthlyView();
  } else if (currentView === "weekly") {
    renderWeeklyView();
  } else if (currentView === "daily") {
    renderDailyView();
  }
}

function renderMonthlyView() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Adjust for Monday as first day
  const adjustedStart = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

  periodTitle.textContent = `${getMonthName(month)} ${year}`;

  const weekdays = ["Pon", "Uto", "Sre", "Čet", "Pet", "Sub", "Ned"];

  let html = '<div class="monthly-grid">';

  // Weekday headers
  weekdays.forEach((day) => {
    html += `<div class="weekday-header">${day}</div>`;
  });

  // Empty cells for days before month starts
  for (let i = 0; i < adjustedStart; i++) {
    const prevDate = new Date(year, month, -i);
    html += createDayCell(prevDate, true);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    html += createDayCell(date, false);
  }

  // Fill remaining cells
  const totalCells = adjustedStart + daysInMonth;
  const remainingCells = 7 - (totalCells % 7);
  if (remainingCells < 7) {
    for (let i = 1; i <= remainingCells; i++) {
      const nextDate = new Date(year, month + 1, i);
      html += createDayCell(nextDate, true);
    }
  }

  html += "</div>";
  calendarContainer.innerHTML = html;

  // Add click listeners
  document.querySelectorAll(".day-cell:not(.other-month)").forEach((cell) => {
    cell.addEventListener("click", () => {
      const dateStr = cell.dataset.date;
      openEntryModal(dateStr);
    });
  });
}

function renderWeeklyView() {
  const weekStart = getWeekStart(currentDate);
  periodTitle.textContent = `Nedelja ${formatDate(weekStart)} - ${formatDate(
    new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
  )}`;

  const weekdays = [
    "Ponedeljak",
    "Utorak",
    "Sreda",
    "Četvrtak",
    "Petak",
    "Subota",
    "Nedelja",
  ];

  let html = '<div class="weekly-grid">';

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const dateStr = formatDateString(date);
    const workout = getWorkoutForDate(dateStr);
    const isToday = isTodayDate(date);

    html += `
            <div class="week-day-card ${
              isToday ? "today" : ""
            }" data-date="${dateStr}">
                <div class="week-day-name">${weekdays[i]}</div>
                <div class="week-day-date">${date.getDate()}. ${getMonthName(
      date.getMonth()
    )}</div>
                <div class="week-day-details">
                    ${
                      workout
                        ? `
                        <div class="day-weight">${workout.weight} kg</div>
                        <div class="day-duration">${workout.duration} min</div>
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${Math.min(
                              (workout.duration / 120) * 100,
                              100
                            )}%"></div>
                        </div>
                    `
                        : '<div style="color: #94a3b8;">Nema podataka</div>'
                    }
                </div>
            </div>
        `;
  }

  html += "</div>";
  calendarContainer.innerHTML = html;

  document.querySelectorAll(".week-day-card").forEach((card) => {
    card.addEventListener("click", () => {
      openEntryModal(card.dataset.date);
    });
  });
}

function renderDailyView() {
  const dateStr = formatDateString(currentDate);
  const workout = getWorkoutForDate(dateStr);
  const prevWorkout = getPreviousWorkout(dateStr);
  const isToday = isTodayDate(currentDate);

  periodTitle.textContent = formatDate(currentDate);

  let changeText = "";
  if (prevWorkout && workout) {
    const weightDiff = workout.weight - prevWorkout.weight;
    const durationDiff = workout.duration - prevWorkout.duration;
    if (weightDiff !== 0 || durationDiff !== 0) {
      const changes = [];
      if (weightDiff !== 0) {
        changes.push(
          `Kilaža: ${weightDiff > 0 ? "+" : ""}${weightDiff.toFixed(1)} kg`
        );
      }
      if (durationDiff !== 0) {
        changes.push(
          `Trening: ${durationDiff > 0 ? "+" : ""}${durationDiff} min`
        );
      }
      changeText = `<div class="daily-change ${
        weightDiff < 0 || durationDiff > 0 ? "positive" : "negative"
      }">${changes.join(", ")}</div>`;
    }
  }

  const html = `
        <div class="daily-view">
            <div class="daily-card ${
              isToday ? "today" : ""
            }" data-date="${dateStr}">
                <div class="daily-date">${formatDate(currentDate)}</div>
                ${
                  workout
                    ? `
                    <div class="daily-weight">${workout.weight} kg</div>
                    <div class="daily-duration">${workout.duration} min</div>
                    ${changeText}
                `
                    : `
                    <div style="color: #94a3b8; font-size: 1.2rem;">Nema podataka za ovaj dan</div>
                    <div style="color: #94a3b8; margin-top: 1rem; font-size: 0.9rem;">Kliknite da dodate podatke</div>
                `
                }
            </div>
        </div>
    `;

  calendarContainer.innerHTML = html;

  document.querySelector(".daily-card").addEventListener("click", () => {
    openEntryModal(dateStr);
  });
}

function createDayCell(date, isOtherMonth) {
  const dateStr = formatDateString(date);
  const workout = getWorkoutForDate(dateStr);
  const isToday = isTodayDate(date);

  return `
        <div class="day-cell ${isToday ? "today" : ""} ${
    isOtherMonth ? "other-month" : ""
  }" data-date="${dateStr}">
            <div class="day-number">${date.getDate()}</div>
            ${
              workout
                ? `
                <div class="day-data">
                    <div class="day-weight">${workout.weight} kg</div>
                    <div class="day-duration">${workout.duration} min</div>
                </div>
                <div class="workout-icon">💪</div>
            `
                : ""
            }
        </div>
    `;
}

// Entry Modal
function openEntryModal(dateStr) {
  const workout = getWorkoutForDate(dateStr);
  document.getElementById("entryDate").value = dateStr;
  document.getElementById("entryWeight").value = workout ? workout.weight : "";
  document.getElementById("entryDuration").value = workout
    ? workout.duration
    : "";
  deleteBtn.style.display = workout ? "block" : "none";
  entryModal.classList.add("active");
}

function closeEntryModal() {
  entryModal.classList.remove("active");
  entryForm.reset();
}

function saveEntry(e) {
  e.preventDefault();
  const date = document.getElementById("entryDate").value;
  const weight = parseFloat(document.getElementById("entryWeight").value);
  const duration = parseInt(document.getElementById("entryDuration").value);

  if (!date || isNaN(weight) || isNaN(duration)) {
    showToast("Molimo unesite sve podatke", "error");
    return;
  }

  const existingIndex = appData.workouts.findIndex((w) => w.date === date);
  const workout = { date, weight, duration };

  if (existingIndex >= 0) {
    appData.workouts[existingIndex] = workout;
  } else {
    appData.workouts.push(workout);
  }

  // Sort by date
  appData.workouts.sort((a, b) => new Date(a.date) - new Date(b.date));

  saveData();
  renderCalendar();
  renderChart();
  closeEntryModal();
  showToast("Podaci sačuvani", "success");
}

function deleteEntry() {
  const date = document.getElementById("entryDate").value;
  if (confirm("Da li ste sigurni da želite da obrišete podatke za ovaj dan?")) {
    appData.workouts = appData.workouts.filter((w) => w.date !== date);
    saveData();
    renderCalendar();
    renderChart();
    closeEntryModal();
    showToast("Podaci obrisani", "success");
  }
}

function openSettingsModal() {
  settingsModal.classList.add("active");
}

function closeSettings() {
  settingsModal.classList.remove("active");
}

// Chart
function renderChart() {
  const ctx = document.getElementById("progressChart").getContext("2d");

  if (chart) {
    chart.destroy();
  }

  let labels, weightData, prevWeightData, durationData, prevDurationData;

  if (currentView === "monthly") {
    const { labels: monthLabels, current, previous } = getMonthlyChartData();
    labels = monthLabels;
    weightData = current;
    prevWeightData = previous;

    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Trenutni mesec",
            data: weightData,
            borderColor: "#667eea",
            backgroundColor: "rgba(102, 126, 234, 0.1)",
            tension: 0.4,
            fill: true,
          },
          {
            label: "Prethodni mesec",
            data: prevWeightData,
            borderColor: "#94a3b8",
            backgroundColor: "rgba(148, 163, 184, 0.1)",
            borderDash: [5, 5],
            tension: 0.4,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: "#f1f5f9" },
          },
        },
        scales: {
          x: {
            ticks: { color: "#94a3b8" },
            grid: { color: "rgba(255, 255, 255, 0.1)" },
          },
          y: {
            ticks: { color: "#94a3b8" },
            grid: { color: "rgba(255, 255, 255, 0.1)" },
            title: {
              display: true,
              text: "Kilaža (kg)",
              color: "#94a3b8",
            },
          },
        },
      },
    });

    // Add goal line if set
    if (appData.goals.targetWeight) {
      chart.data.datasets.push({
        label: "Ciljna kilaža",
        data: Array(labels.length).fill(appData.goals.targetWeight),
        borderColor: "#10b981",
        borderDash: [10, 5],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      });
      chart.update();
    }
  } else if (currentView === "weekly") {
    const { labels: weekLabels, current, previous } = getWeeklyChartData();
    labels = weekLabels;
    durationData = current;
    prevDurationData = previous;

    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Trenutna nedelja",
            data: durationData,
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            tension: 0.4,
            fill: true,
          },
          {
            label: "Prethodna nedelja",
            data: prevDurationData,
            borderColor: "#94a3b8",
            backgroundColor: "rgba(148, 163, 184, 0.1)",
            borderDash: [5, 5],
            tension: 0.4,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: "#f1f5f9" },
          },
        },
        scales: {
          x: {
            ticks: { color: "#94a3b8" },
            grid: { color: "rgba(255, 255, 255, 0.1)" },
          },
          y: {
            ticks: { color: "#94a3b8" },
            grid: { color: "rgba(255, 255, 255, 0.1)" },
            title: {
              display: true,
              text: "Minuti",
              color: "#94a3b8",
            },
          },
        },
      },
    });
  } else {
    // Daily view - show last 30 days
    const { labels: dailyLabels, data: dailyData } = getDailyChartData();
    labels = dailyLabels;
    weightData = dailyData;

    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Kilaža (poslednjih 30 dana)",
            data: weightData,
            borderColor: "#667eea",
            backgroundColor: "rgba(102, 126, 234, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: "#f1f5f9" },
          },
        },
        scales: {
          x: {
            ticks: { color: "#94a3b8" },
            grid: { color: "rgba(255, 255, 255, 0.1)" },
          },
          y: {
            ticks: { color: "#94a3b8" },
            grid: { color: "rgba(255, 255, 255, 0.1)" },
            title: {
              display: true,
              text: "Kilaža (kg)",
              color: "#94a3b8",
            },
          },
        },
      },
    });
  }
}

function getMonthlyChartData() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const labels = [];
  const current = [];
  const previous = [];

  // Current month
  for (let day = 1; day <= daysInMonth; day++) {
    labels.push(day);
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    const workout = getWorkoutForDate(dateStr);
    current.push(workout ? workout.weight : null);
  }

  // Previous month
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevDaysInMonth = new Date(prevYear, prevMonth + 1, 0).getDate();

  for (let day = 1; day <= Math.min(prevDaysInMonth, daysInMonth); day++) {
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;
    const workout = getWorkoutForDate(dateStr);
    previous.push(workout ? workout.weight : null);
  }

  // Pad previous month if needed
  while (previous.length < current.length) {
    previous.push(null);
  }

  return { labels, current, previous };
}

function getWeeklyChartData() {
  const weekStart = getWeekStart(currentDate);
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);

  const weekdays = ["Pon", "Uto", "Sre", "Čet", "Pet", "Sub", "Ned"];
  const labels = weekdays;
  const current = [];
  const previous = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const dateStr = formatDateString(date);
    const workout = getWorkoutForDate(dateStr);
    current.push(workout ? workout.duration : 0);

    const prevDate = new Date(prevWeekStart);
    prevDate.setDate(prevWeekStart.getDate() + i);
    const prevDateStr = formatDateString(prevDate);
    const prevWorkout = getWorkoutForDate(prevDateStr);
    previous.push(prevWorkout ? prevWorkout.duration : 0);
  }

  return { labels, current, previous };
}

function getDailyChartData() {
  const labels = [];
  const data = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = formatDateString(date);
    labels.push(formatDate(date));
    const workout = getWorkoutForDate(dateStr);
    data.push(workout ? workout.weight : null);
  }

  return { labels, data };
}

// Helper Functions
function getWorkoutForDate(dateStr) {
  return appData.workouts.find((w) => w.date === dateStr);
}

function getPreviousWorkout(dateStr) {
  const workouts = appData.workouts.filter((w) => w.date < dateStr);
  return workouts.length > 0 ? workouts[workouts.length - 1] : null;
}

function formatDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(date) {
  return `${date.getDate()}. ${getMonthName(
    date.getMonth()
  )} ${date.getFullYear()}`;
}

function getMonthName(month) {
  const months = [
    "Januar",
    "Februar",
    "Mart",
    "April",
    "Maj",
    "Jun",
    "Jul",
    "Avgust",
    "Septembar",
    "Oktobar",
    "Novembar",
    "Decembar",
  ];
  return months[month];
}

function isTodayDate(date) {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  return new Date(d.setDate(diff));
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}
