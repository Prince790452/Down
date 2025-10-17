import { authService } from './services/auth.js';
import { dataService } from './services/data.js';

const currentYear = new Date().getFullYear();
const startTime = new Date(`${currentYear}-10-14T18:18:00`);
const deadline = new Date(`${currentYear}-12-07T23:59:59`);

const scareSayings = [
  "⏳ Time is slipping away!",
  "🔥 Every second counts!",
  "😱 Your exams are almost here!",
  "💼 Only the prepared will pass!",
  "⚖️ Justice favors the diligent!",
  "🚨 Wake up, Counsel! The clock is ticking!",
  "📖 Read now — rest later!",
  "🎯 Focus is your superpower!",
  "💪 Consistency beats intensity!",
  "🧠 Knowledge is your best weapon!"
];

const alertAudio = new Audio("https://www.soundjay.com/button/beep-07.mp3");

const units = [
  {
    title: "Civil Proceedings",
    subjects: ["Pleadings", "Interlocutory Applications", "Trials", "Judgment & Appeals", "Execution of Decrees"],
    color: "from-blue-500 to-cyan-500",
    borderColor: "border-l-blue-500"
  },
  {
    title: "Criminal Proceedings",
    subjects: ["Jurisdiction", "Charge & Information", "Bail & Remand", "Trial Process", "Sentencing & Appeals"],
    color: "from-red-500 to-pink-500",
    borderColor: "border-l-red-500"
  },
  {
    title: "Family Law Practice",
    subjects: ["Marriage & Divorce", "Custody & Maintenance", "Adoption & Guardianship", "Matrimonial Property", "Domestic Violence"],
    color: "from-green-500 to-emerald-500",
    borderColor: "border-l-green-500"
  },
  {
    title: "Corporate & Commercial Practice",
    subjects: ["Company Formation", "Contracts", "Insolvency", "Mergers & Acquisitions", "Taxation"],
    color: "from-purple-500 to-indigo-500",
    borderColor: "border-l-purple-500"
  },
  {
    title: "Land Practice",
    subjects: ["Land Registration", "Conveyancing", "Mortgages", "Leases", "Dispute Resolution"],
    color: "from-amber-500 to-orange-500",
    borderColor: "border-l-amber-500"
  }
];

let studyPlan = [];
let userProgress = {};
let isTimetableView = true;
let currentUser = null;
let currentPage = 'dashboard';

async function init() {
  const user = await authService.getCurrentUser();

  if (user) {
    currentUser = user;
    await loadUserData();
    showCountdownScreen();
  } else {
    showLoginScreen();
  }

  setupEventListeners();

  authService.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      currentUser = await authService.getCurrentUser();
      await loadUserData();
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      studyPlan = [];
      userProgress = {};
    }
  });

  setInterval(() => {
    if (currentUser) {
      autoSaveData();
    }
  }, 120000);
}

async function loadUserData() {
  if (!currentUser) return;

  userProgress = await dataService.loadUserProgress(currentUser.user.id);
  studyPlan = await dataService.loadStudyPlans(currentUser.user.id);
}

async function autoSaveData() {
  if (!currentUser) return;
  await dataService.syncAllData(currentUser.user.id, userProgress, studyPlan);
}

function setupEventListeners() {
  document.getElementById("loginBtn").addEventListener("click", handleLogin);
  document.getElementById("registerBtn").addEventListener("click", handleRegister);
  document.getElementById("showRegister").addEventListener("click", showRegisterForm);
  document.getElementById("showLogin").addEventListener("click", showLoginForm);
  document.getElementById("enterAppBtn").addEventListener("click", showAppScreen);
  document.getElementById("userMenuBtn").addEventListener("click", toggleUserMenu);
  document.getElementById("logoutBtn").addEventListener("click", handleLogout);
  document.getElementById("logoutBtnAccount").addEventListener("click", handleLogout);

  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
      const page = this.getAttribute('data-page');
      navigateTo(page);
    });
  });

  document.querySelectorAll('[data-page]').forEach(button => {
    if (button.classList.contains('nav-item')) return;
    button.addEventListener('click', function() {
      const page = this.getAttribute('data-page');
      navigateTo(page);
    });
  });

  document.addEventListener('click', (e) => {
    const userMenu = document.getElementById('userMenu');
    const userMenuBtn = document.getElementById('userMenuBtn');
    if (userMenu && userMenuBtn && !userMenu.contains(e.target) && !userMenuBtn.contains(e.target)) {
      userMenu.classList.add('hidden');
    }
  });

  ['loginEmail', 'loginPassword'].forEach(id => {
    document.getElementById(id).addEventListener('keypress', function(e) {
      if (e.key === 'Enter') handleLogin();
    });
  });

  ['registerName', 'registerEmail', 'registerPassword'].forEach(id => {
    document.getElementById(id).addEventListener('keypress', function(e) {
      if (e.key === 'Enter') handleRegister();
    });
  });
}

function showLoginScreen() {
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('loginCard').classList.remove('hidden');
  document.getElementById('countdownScreen').classList.add('hidden');
  document.getElementById('appContainer').classList.add('hidden');

  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('registerName').value = '';
  document.getElementById('registerEmail').value = '';
  document.getElementById('registerPassword').value = '';

  showLoginForm();
}

function showCountdownScreen() {
  document.getElementById('loginScreen').classList.add('hidden');

  setTimeout(() => {
    document.getElementById('countdownScreen').classList.remove('hidden');
  }, 500);
}

function showAppScreen() {
  document.getElementById('countdownScreen').classList.add('hidden');

  setTimeout(() => {
    document.getElementById('appContainer').classList.remove('hidden');
    document.getElementById('appContainer').classList.add('visible');

    if (currentUser && currentUser.profile) {
      document.getElementById('userName').textContent = currentUser.profile.full_name;
      document.getElementById('menuUserName').textContent = currentUser.profile.full_name;
      document.getElementById('menuUserEmail').textContent = currentUser.profile.email;
    }

    initializeApp();
  }, 800);
}

function initializeApp() {
  document.getElementById("manualDate").valueAsDate = new Date();

  populateSubjects();
  renderUnits();
  updateProgress();
  updateCountdown();
  renderStudyPlan();
  updateStatistics();
  updateDashboard();

  document.getElementById("addToPlan").addEventListener("click", addToPlan);
  document.getElementById("printBtn").addEventListener("click", () => window.print());
  document.getElementById("clearPlanBtn").addEventListener("click", clearStudyPlan);
  document.getElementById("toggleDark").addEventListener("click", toggleDarkMode);
  document.getElementById("toggleView").addEventListener("click", toggleView);

  setInterval(updateCountdown, 1000);
}

function showLoginForm() {
  document.getElementById('loginForm').classList.remove('hidden');
  document.getElementById('registerForm').classList.add('hidden');
  removeAuthErrors();
}

function showRegisterForm() {
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('registerForm').classList.remove('hidden');
  removeAuthErrors();
}

async function handleLogin() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    showAuthError('Please enter both email and password', 'loginForm');
    return;
  }

  const result = await authService.login(email, password);

  if (result.success) {
    currentUser = { user: result.user, profile: result.profile };
    await loadUserData();
    showCountdownScreen();
  } else {
    showAuthError(result.error, 'loginForm');
  }
}

async function handleRegister() {
  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;

  if (!name || !email || !password) {
    showAuthError('Please fill in all fields', 'registerForm');
    return;
  }

  if (password.length < 6) {
    showAuthError('Password must be at least 6 characters long', 'registerForm');
    return;
  }

  const result = await authService.register(email, password, name);

  if (result.success) {
    const loginResult = await authService.login(email, password);
    if (loginResult.success) {
      currentUser = { user: loginResult.user, profile: loginResult.profile };
      await loadUserData();
      showCountdownScreen();
    }
  } else {
    showAuthError(result.error, 'registerForm');
  }
}

async function handleLogout() {
  await authService.logout();
  currentUser = null;
  studyPlan = [];
  userProgress = {};
  document.getElementById('userMenu').classList.add('hidden');

  document.getElementById('appContainer').classList.remove('visible');
  setTimeout(() => {
    showLoginScreen();
  }, 500);
}

function toggleUserMenu() {
  document.getElementById('userMenu').classList.toggle('hidden');
}

function showAuthError(message, formId) {
  removeAuthErrors();

  const errorEl = document.createElement('div');
  errorEl.className = 'auth-error bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4';
  errorEl.textContent = message;

  const currentForm = document.getElementById(formId);
  currentForm.insertBefore(errorEl, currentForm.firstChild);

  setTimeout(() => {
    if (errorEl.parentNode) {
      errorEl.remove();
    }
  }, 5000);
}

function removeAuthErrors() {
  const existingErrors = document.querySelectorAll('.auth-error');
  existingErrors.forEach(error => error.remove());
}

function navigateTo(page) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });

  document.querySelectorAll(`[data-page="${page}"]`).forEach(item => {
    item.classList.add('active');
  });

  document.querySelectorAll('.page').forEach(pageEl => {
    pageEl.classList.remove('active');
    pageEl.classList.add('hidden');
  });

  setTimeout(() => {
    const targetPage = document.getElementById(`${page}-page`);
    targetPage.classList.remove('hidden');
    setTimeout(() => {
      targetPage.classList.add('active');
    }, 50);
  }, 300);

  currentPage = page;

  if (page === 'dashboard') {
    updateDashboard();
  } else if (page === 'account') {
    updateAccountPage();
  }
}

function updateDashboard() {
  const recentActivity = document.getElementById('recentActivity');

  if (studyPlan && studyPlan.length > 0) {
    const latestPlan = studyPlan[studyPlan.length - 1];
    recentActivity.innerHTML = `
      <div class="bg-green-50 border border-green-200 rounded-lg p-4">
        <div class="flex items-center">
          <i class="fas fa-calendar-check text-green-500 mr-3"></i>
          <div>
            <p class="font-semibold text-green-800">Latest Study Session Added</p>
            <p class="text-sm text-green-600">${formatDate(latestPlan.date)} - ${latestPlan.sessions.length} subjects</p>
          </div>
        </div>
      </div>
    `;
  }
}

function updateAccountPage() {
  if (currentUser && currentUser.profile) {
    document.getElementById('accountName').value = currentUser.profile.full_name || '';
    document.getElementById('accountEmail').value = currentUser.profile.email || '';

    const total = units.reduce((sum, u) => sum + u.subjects.length, 0);
    const done = units.flatMap((u, i) =>
      u.subjects.map((_, j) => userProgress[`unit${i}_subject${j}`] === true)
    ).filter(x => x).length;

    const remaining = total - done;
    const totalSessions = studyPlan.reduce((sum, day) => sum + day.sessions.length, 0);
    const totalHours = studyPlan.reduce((sum, day) => sum + (day.sessions.length * parseFloat(day.duration || 2)), 0);

    document.getElementById('accountStats').innerHTML = `
      <div class="p-3 bg-blue-50 rounded-lg">
        <div class="text-2xl font-bold text-blue-600">${done}</div>
        <div class="text-sm text-blue-800">Completed</div>
      </div>
      <div class="p-3 bg-green-50 rounded-lg">
        <div class="text-2xl font-bold text-green-600">${remaining}</div>
        <div class="text-sm text-green-800">Remaining</div>
      </div>
      <div class="p-3 bg-purple-50 rounded-lg">
        <div class="text-2xl font-bold text-purple-600">${totalSessions}</div>
        <div class="text-sm text-purple-800">Sessions</div>
      </div>
      <div class="p-3 bg-orange-50 rounded-lg">
        <div class="text-2xl font-bold text-orange-600">${totalHours}h</div>
        <div class="text-sm text-orange-800">Total Hours</div>
      </div>
    `;
  }
}

function populateSubjects() {
  const select = document.getElementById("manualSubjects");
  select.innerHTML = "";

  units.forEach(unit => {
    const group = document.createElement("optgroup");
    group.label = unit.title;

    unit.subjects.forEach(sub => {
      const option = document.createElement("option");
      option.value = sub;
      option.textContent = sub;
      group.appendChild(option);
    });

    select.appendChild(group);
  });
}

function updateCountdown() {
  const now = new Date();
  const countdownEl = document.getElementById("countdown");
  const scareTextEl = document.getElementById("scareText");

  if (now < startTime) {
    countdownEl.textContent = "⏳ Countdown starts at 18:18 today!";
    scareTextEl.textContent = "Get ready, Counsel!";
    return;
  }

  const diff = deadline - now;
  if (diff <= 0) {
    countdownEl.textContent = "🚨 EXAMS HAVE BEGUN!";
    scareTextEl.textContent = "All the best, Counsel!";
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  countdownEl.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s left`;
  scareTextEl.textContent = scareSayings[Math.floor(Math.random() * scareSayings.length)];

  if (days < 10) {
    alertAudio.play().catch(e => console.log("Audio play failed:", e));
  }
}

function renderUnits() {
  const container = document.getElementById("unitsContainer");
  container.innerHTML = "";

  units.forEach((unit, uIndex) => {
    const card = document.createElement("div");
    card.className = `bg-white border border-gray-200 rounded-2xl shadow-sm p-5 subject-card`;

    const title = document.createElement("h3");
    title.className = `font-bold text-white text-lg mb-3 p-2 rounded-lg bg-gradient-to-r ${unit.color}`;
    title.textContent = unit.title;
    card.appendChild(title);

    const list = document.createElement("ul");
    list.className = "space-y-2";

    unit.subjects.forEach((subject, sIndex) => {
      const li = document.createElement("li");
      li.className = "flex items-center space-x-2";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500";

      const label = document.createElement("label");
      label.textContent = subject;
      label.className = "text-gray-700 flex-1";

      const key = `unit${uIndex}_subject${sIndex}`;
      checkbox.checked = userProgress[key] === true;

      if (checkbox.checked) {
        label.classList.add("completed");
      }

      checkbox.addEventListener("change", async () => {
        userProgress[key] = checkbox.checked;

        if (currentUser) {
          await dataService.saveProgress(currentUser.user.id, key, checkbox.checked);
        }

        if (checkbox.checked) {
          label.classList.add("completed");
          showCompletionAlert(subject, unit.title);
        } else {
          label.classList.remove("completed");
        }

        updateProgress();
        updateStatistics();
        renderStudyPlan();
        updateDashboard();
      });

      li.appendChild(checkbox);
      li.appendChild(label);
      list.appendChild(li);
    });

    card.appendChild(list);
    container.appendChild(card);
  });
}

function showCompletionAlert(subject, unitTitle) {
  const alertDiv = document.createElement("div");
  alertDiv.className = "fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm";
  alertDiv.innerHTML = `
    <div class="flex items-center">
      <i class="fas fa-check-circle mr-2 text-xl"></i>
      <div>
        <p class="font-semibold">Subject Completed!</p>
        <p class="text-sm">${subject} (${unitTitle})</p>
      </div>
    </div>
  `;

  document.body.appendChild(alertDiv);

  setTimeout(() => {
    alertDiv.remove();
  }, 3000);
}

function updateProgress() {
  const total = units.reduce((sum, u) => sum + u.subjects.length, 0);
  const done = units.flatMap((u, i) =>
    u.subjects.map((_, j) => userProgress[`unit${i}_subject${j}`] === true)
  ).filter(x => x).length;

  const percent = Math.round((done / total) * 100);
  document.getElementById("progressBar").style.width = percent + "%";
  document.getElementById("progressText").textContent = `${done}/${total} Subjects (${percent}%) Completed`;
}

function updateStatistics() {
  const total = units.reduce((sum, u) => sum + u.subjects.length, 0);
  const done = units.flatMap((u, i) =>
    u.subjects.map((_, j) => userProgress[`unit${i}_subject${j}`] === true)
  ).filter(x => x).length;

  const remaining = total - done;
  const totalSessions = studyPlan.reduce((sum, day) => sum + day.sessions.length, 0);

  const statsHTML = `
    <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
      <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">${done}</div>
      <div class="text-sm text-blue-800 dark:text-blue-300">Completed</div>
    </div>
    <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
      <div class="text-2xl font-bold text-green-600 dark:text-green-400">${remaining}</div>
      <div class="text-sm text-green-800 dark:text-green-300">Remaining</div>
    </div>
    <div class="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
      <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">${totalSessions}</div>
      <div class="text-sm text-purple-800 dark:text-purple-300">Sessions</div>
    </div>
    <div class="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
      <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">${Math.round((done/total)*100)}%</div>
      <div class="text-sm text-orange-800 dark:text-orange-300">Progress</div>
    </div>
  `;

  document.getElementById('stats').innerHTML = statsHTML;
}

async function addToPlan() {
  const date = document.getElementById("manualDate").value;
  const duration = document.getElementById("studyDuration").value;
  const selected = Array.from(document.getElementById("manualSubjects").selectedOptions).map(o => o.value);

  if (!date || selected.length === 0) {
    showErrorAlert("Please select a date and at least one subject!");
    return;
  }

  const newPlan = { date, duration, sessions: selected };
  studyPlan.push(newPlan);

  if (currentUser) {
    await dataService.saveStudyPlan(currentUser.user.id, newPlan);
    studyPlan = await dataService.loadStudyPlans(currentUser.user.id);
  }

  renderStudyPlan();
  updateStatistics();
  updateDashboard();

  document.getElementById("manualSubjects").selectedIndex = -1;
}

function showErrorAlert(message) {
  const alertDiv = document.createElement("div");
  alertDiv.className = "fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm";
  alertDiv.innerHTML = `
    <div class="flex items-center">
      <i class="fas fa-exclamation-triangle mr-2 text-xl"></i>
      <div>
        <p class="font-semibold">Attention Needed</p>
        <p class="text-sm">${message}</p>
      </div>
    </div>
  `;

  document.body.appendChild(alertDiv);

  setTimeout(() => {
    alertDiv.remove();
  }, 3000);
}

async function clearStudyPlan() {
  if (studyPlan.length === 0) {
    showErrorAlert("Study plan is already empty!");
    return;
  }

  if (confirm("Are you sure you want to clear your entire study plan?")) {
    if (currentUser) {
      await dataService.clearAllStudyPlans(currentUser.user.id);
    }

    studyPlan = [];
    renderStudyPlan();
    updateStatistics();
    updateDashboard();
  }
}

function toggleView() {
  const timetable = document.getElementById("timetableView");
  const list = document.getElementById("listView");
  const toggleBtn = document.getElementById("toggleView");

  isTimetableView = !isTimetableView;

  if (isTimetableView) {
    timetable.classList.remove("hidden");
    list.classList.add("hidden");
    toggleBtn.innerHTML = '<i class="fas fa-th-large mr-1"></i>Toggle View';
  } else {
    timetable.classList.add("hidden");
    list.classList.remove("hidden");
    toggleBtn.innerHTML = '<i class="fas fa-list mr-1"></i>Toggle View';
  }

  renderStudyPlan();
}

function renderStudyPlan() {
  const timetable = document.getElementById("timetableView");
  const list = document.getElementById("listView");
  const planSection = document.getElementById("planSection");
  const planStats = document.getElementById("planStats");

  timetable.innerHTML = "";
  list.innerHTML = "";

  if (studyPlan.length === 0) {
    planSection.classList.add("hidden");
    return;
  }

  planSection.classList.remove("hidden");

  studyPlan.sort((a, b) => new Date(a.date) - new Date(b.date));

  const totalSessions = studyPlan.reduce((sum, day) => sum + day.sessions.length, 0);
  const totalHours = studyPlan.reduce((sum, day) => sum + (day.sessions.length * parseFloat(day.duration || 2)), 0);
  planStats.textContent = `${studyPlan.length} days, ${totalSessions} sessions, ${totalHours} hours`;

  const weeks = groupStudyPlanByWeek(studyPlan);
  renderTimetableView(weeks, timetable);
  renderListView(studyPlan, list);
}

function groupStudyPlanByWeek(studyPlan) {
  const weeks = [];
  let currentWeek = [];
  let currentWeekStart = null;

  studyPlan.forEach(day => {
    const date = new Date(day.date);
    const weekStart = getWeekStart(date);

    if (!currentWeekStart || weekStart.getTime() !== currentWeekStart.getTime()) {
      if (currentWeek.length > 0) {
        weeks.push(currentWeek);
      }
      currentWeek = [day];
      currentWeekStart = weekStart;
    } else {
      currentWeek.push(day);
    }
  });

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return weeks;
}

function getWeekStart(date) {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

function renderTimetableView(weeks, container) {
  weeks.forEach((week, weekIndex) => {
    const weekElement = document.createElement("div");
    weekElement.className = "mb-8";

    const weekHeader = document.createElement("div");
    weekHeader.className = "flex justify-between items-center mb-4 p-3 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg";

    const weekTitle = document.createElement("h3");
    weekTitle.className = "font-bold text-indigo-700 text-lg";
    weekTitle.textContent = `Week ${weekIndex + 1} (${formatDate(week[0].date)} - ${formatDate(week[week.length-1].date)})`;

    const weekStats = document.createElement("div");
    weekStats.className = "text-sm text-indigo-600";
    const weekSessions = week.reduce((sum, day) => sum + day.sessions.length, 0);
    weekStats.textContent = `${weekSessions} sessions`;

    weekHeader.appendChild(weekTitle);
    weekHeader.appendChild(weekStats);
    weekElement.appendChild(weekHeader);

    const daysGrid = document.createElement("div");
    daysGrid.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4";

    week.forEach(day => {
      const dayElement = document.createElement("div");
      dayElement.className = "timetable-day bg-white border border-gray-200 rounded-xl p-4 shadow-sm";

      const dayHeader = document.createElement("div");
      dayHeader.className = "flex justify-between items-center mb-3 pb-2 border-b border-gray-100";

      const dateElement = document.createElement("div");
      dateElement.className = "font-semibold text-indigo-700";
      dateElement.innerHTML = `<i class="far fa-calendar mr-2"></i>${formatDate(day.date)}`;

      const dayStats = document.createElement("div");
      dayStats.className = "flex items-center space-x-2";

      const durationElement = document.createElement("span");
      durationElement.className = "text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full";
      durationElement.innerHTML = `<i class="far fa-clock mr-1"></i>${day.duration || 2}h/session`;

      const progress = calculateDayProgress(day);
      const progressElement = document.createElement("span");
      progressElement.className = `text-xs px-2 py-1 rounded-full ${progress === 100 ? 'bg-green-100 text-green-700' : progress >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`;
      progressElement.textContent = `${progress}%`;

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "text-red-400 hover:text-red-600 transition-colors";
      deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
      deleteBtn.onclick = async () => {
        if (day.id && currentUser) {
          await dataService.deleteStudyPlan(day.id);
          studyPlan = await dataService.loadStudyPlans(currentUser.user.id);
        } else {
          const index = studyPlan.findIndex(d => d.date === day.date);
          if (index !== -1) {
            studyPlan.splice(index, 1);
          }
        }

        renderStudyPlan();
        updateStatistics();
        updateDashboard();
      };

      dayStats.appendChild(durationElement);
      dayStats.appendChild(progressElement);
      dayStats.appendChild(deleteBtn);

      dayHeader.appendChild(dateElement);
      dayHeader.appendChild(dayStats);
      dayElement.appendChild(dayHeader);

      const sessionsList = document.createElement("div");
      sessionsList.className = "space-y-2";

      day.sessions.forEach(session => {
        const sessionElement = document.createElement("div");
        sessionElement.className = "session-card bg-gray-50 p-3 rounded-lg";

        const unit = units.find(u => u.subjects.includes(session));
        const isCompleted = unit && userProgress[`unit${units.indexOf(unit)}_subject${unit.subjects.indexOf(session)}`] === true;

        sessionElement.className += ` ${unit ? unit.borderColor : 'border-l-gray-400'} ${isCompleted ? 'opacity-70' : ''}`;

        const sessionContent = document.createElement("div");
        sessionContent.className = "flex justify-between items-center";

        const sessionTitle = document.createElement("div");
        sessionTitle.className = `font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-gray-700'}`;
        sessionTitle.textContent = session;

        const sessionStatus = document.createElement("div");
        sessionStatus.className = "text-xs";

        if (isCompleted) {
          sessionStatus.innerHTML = '<i class="fas fa-check-circle text-green-500"></i>';
        } else {
          sessionStatus.innerHTML = '<i class="far fa-circle text-gray-400"></i>';
        }

        sessionContent.appendChild(sessionTitle);
        sessionContent.appendChild(sessionStatus);
        sessionElement.appendChild(sessionContent);

        sessionsList.appendChild(sessionElement);
      });

      dayElement.appendChild(sessionsList);
      daysGrid.appendChild(dayElement);
    });

    weekElement.appendChild(daysGrid);
    container.appendChild(weekElement);
  });
}

function renderListView(studyPlan, container) {
  studyPlan.forEach((day, index) => {
    const dayElement = document.createElement("div");
    dayElement.className = "border border-gray-200 rounded-lg p-4 hover:shadow-md transition";

    const progress = calculateDayProgress(day);

    dayElement.innerHTML = `
      <div class="flex justify-between mb-2">
        <span class="font-semibold text-indigo-700">${formatDate(day.date)}</span>
        <div class="flex items-center space-x-2">
          <span class="text-sm ${progress === 100 ? 'text-green-500' : progress >= 50 ? 'text-yellow-500' : 'text-red-500'}">${progress}% Completed</span>
          <button class="text-red-400 hover:text-red-600 delete-day" data-index="${index}">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      <div class="text-sm text-gray-500 mb-2">
        <i class="far fa-clock mr-1"></i>${day.duration || 2} hours per session
      </div>
      <ul class="list-disc ml-5 text-sm space-y-1">
        ${day.sessions.map(session => {
          const unit = units.find(u => u.subjects.includes(session));
          const isCompleted = unit && userProgress[`unit${units.indexOf(unit)}_subject${unit.subjects.indexOf(session)}`] === true;
          return `<li class="${isCompleted ? 'line-through text-gray-400' : ''}">${session} ${isCompleted ? '<i class="fas fa-check-circle text-green-500 ml-1"></i>' : ''}</li>`;
        }).join("")}
      </ul>
    `;

    container.appendChild(dayElement);
  });

  document.querySelectorAll('.delete-day').forEach(button => {
    button.addEventListener('click', async function() {
      const index = parseInt(this.getAttribute('data-index'));
      const day = studyPlan[index];

      if (day.id && currentUser) {
        await dataService.deleteStudyPlan(day.id);
        studyPlan = await dataService.loadStudyPlans(currentUser.user.id);
      } else {
        studyPlan.splice(index, 1);
      }

      renderStudyPlan();
      updateStatistics();
      updateDashboard();
    });
  });
}

function calculateDayProgress(day) {
  const done = day.sessions.filter(session => {
    return units.some((unit, uIndex) =>
      unit.subjects.includes(session) &&
      userProgress[`unit${uIndex}_subject${unit.subjects.indexOf(session)}`] === true
    );
  }).length;

  return Math.round((done / day.sessions.length) * 100) || 0;
}

function formatDate(dateString) {
  const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  const button = document.getElementById("toggleDark");

  if (document.body.classList.contains("dark-mode")) {
    button.innerHTML = '<i class="fas fa-sun mr-2"></i>Toggle Light Mode';
  } else {
    button.innerHTML = '<i class="fas fa-moon mr-2"></i>Toggle Dark Mode';
  }
}

document.addEventListener('DOMContentLoaded', init);
