/*
  Электронный дневник (демо)
  - Мобильная портретная верстка
  - Светлая/темная тема с сохранением
  - Фейковые данные: хорошие оценки (10-балльная шкала)
  - Без зависимостей
*/

(function () {
  'use strict';

  // ---------- Utilities ----------
  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
  function formatDate(date) {
    return date.toLocaleDateString('ru-RU', { weekday: 'long', day: '2-digit', month: 'long' });
  }
  function formatShort(date) {
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
  }
  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function weightedGrade() {
    // Bias toward 8-10
    const roll = Math.random();
    if (roll < 0.55) return 10;
    if (roll < 0.85) return 9;
    if (roll < 0.95) return 8;
    if (roll < 0.985) return 7;
    return randomInt(5, 6);
  }

  // ---------- Theme ----------
  const themeKey = 'diary_theme_v1';
  const themeToggle = document.getElementById('themeToggle');
  const themeMeta = document.getElementById('theme-color-meta');

  function getPreferredTheme() {
    const saved = localStorage.getItem(themeKey);
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function updateThemeMeta(theme) {
    const light = '#0ea5e9';
    const dark = '#38bdf8';
    if (themeMeta) themeMeta.setAttribute('content', theme === 'dark' ? dark : light);
  }
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(themeKey, theme);
    updateThemeMeta(theme);
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      themeToggle.innerHTML = `<span class="icon" aria-hidden="true">${theme === 'dark' ? '🌙' : '☀️'}</span>`;
      themeToggle.title = theme === 'dark' ? 'Темная тема' : 'Светлая тема';
    }
  }
  function initTheme() {
    applyTheme(getPreferredTheme());
    if (window.matchMedia) {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      try { media.addEventListener('change', () => { if (!localStorage.getItem(themeKey)) applyTheme(getPreferredTheme()); }); } catch {}
    }
    if (themeToggle) themeToggle.addEventListener('click', () => applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));
  }

  // ---------- Fake data ----------
  const dataKey = 'diary_data_v1';
  const subjects = [
    'Математика','Русский язык','Литература','Английский язык','История','Обществознание','Физика','Химия','Биология','География','Информатика','Физкультура','Технология','Музыка','ИЗО'
  ];
  const praise = ['Отлично!','Молодец','Активная работа','Грамотно выполнено','Прекрасный ответ','Заслуженная оценка','Хороший прогресс'];
  const homeworkSamples = ['Параграф ','Упр. ','Повторить тему','Подготовить доклад','Решить задачи №'];

  function schoolDaysBack(numDays) {
    const days = [];
    let date = new Date();
    let count = 0;
    while (count < numDays) {
      const day = date.getDay();
      if (day !== 0 && day !== 6) { // Mon-Fri
        days.push(new Date(date));
        count++;
      }
      date.setDate(date.getDate() - 1);
    }
    return days.reverse();
  }

  function generateDiary() {
    const days = schoolDaysBack(30);
    const entries = days.map(d => {
      const lessonsCount = randomInt(5, 7);
      const lessons = Array.from({ length: lessonsCount }, () => {
        const subject = subjects[randomInt(0, subjects.length - 1)];
        const grade = weightedGrade();
        const comment = praise[randomInt(0, praise.length - 1)];
        const hwType = homeworkSamples[randomInt(0, homeworkSamples.length - 1)];
        const homework = hwType + randomInt(5, 32);
        return { subject, grade, comment, homework };
      });
      return { date: d.toISOString(), lessons };
    });
    return entries;
  }

  function computeStats(entries) {
    const bySubject = new Map();
    for (const day of entries) {
      for (const lesson of day.lessons) {
        const list = bySubject.get(lesson.subject) || [];
        list.push(lesson.grade);
        bySubject.set(lesson.subject, list);
      }
    }
    const subjectsStats = [];
    let sumAll = 0, countAll = 0;
    for (const subject of subjects) {
      const grades = bySubject.get(subject) || [];
      const sum = grades.reduce((a, b) => a + b, 0);
      const avg = grades.length ? sum / grades.length : 0;
      sumAll += sum; countAll += grades.length;
      subjectsStats.push({ subject, avg: grades.length ? Number(avg.toFixed(1)) : 0, count: grades.length });
    }
    const avgAll = countAll ? Number((sumAll / countAll).toFixed(2)) : 0;
    return { subjectsStats, avgAll, countAll };
  }

  function loadData() {
    const raw = localStorage.getItem(dataKey);
    if (raw) {
      try { return JSON.parse(raw); } catch {/* ignore */}
    }
    const student = { name: 'Иван Петров', class: '9А' };
    const diary = generateDiary();
    const stats = computeStats(diary);
    const data = { student, diary, stats };
    localStorage.setItem(dataKey, JSON.stringify(data));
    return data;
  }

  function resetData() {
    localStorage.removeItem(dataKey);
    return loadData();
  }

  // ---------- Rendering ----------
  const diaryList = document.getElementById('diaryList');
  const subjectsList = document.getElementById('subjectsList');
  const studentShort = document.getElementById('studentShort');
  const studentName = document.getElementById('studentName');
  const studentClass = document.getElementById('studentClass');
  const avgAllEl = document.getElementById('avgAll');
  const countAllEl = document.getElementById('countAll');
  const resetBtn = document.getElementById('resetData');

  function gradeClass(grade) {
    if (grade >= 9) return 'good';
    if (grade >= 7) return 'ok';
    return 'bad';
  }

  function renderDiary(entries) {
    diaryList.innerHTML = '';
    for (const day of entries) {
      const date = new Date(day.date);
      const dayEl = document.createElement('div');
      dayEl.className = 'day card';
      dayEl.innerHTML = `
        <div class="day-header">
          <div class="day-title">${formatDate(date)}</div>
          <div class="day-sub">${formatShort(date)}</div>
        </div>
      `;
      for (const lesson of day.lessons) {
        const row = document.createElement('div');
        row.className = 'lesson';
        row.innerHTML = `
          <div class="badge ${gradeClass(lesson.grade)}" title="Оценка">${lesson.grade}</div>
          <div class="col">
            <div class="lesson-title">${lesson.subject}</div>
            <div class="lesson-sub">${lesson.comment} • ДЗ: ${lesson.homework}</div>
          </div>
          <div class="lesson-meta"></div>
        `;
        dayEl.appendChild(row);
      }
      diaryList.appendChild(dayEl);
    }
  }

  function renderSubjects(stats) {
    subjectsList.innerHTML = '';
    for (const item of stats.subjectsStats) {
      const card = document.createElement('div');
      card.className = 'subject-card card';
      const percent = clamp(Math.round((item.avg / 10) * 100), 0, 100);
      card.innerHTML = `
        <div class="row"><div class="subject-name">${item.subject}</div><div class="subject-avg">${item.avg.toFixed(1)}</div></div>
        <div class="meter" aria-valuemin="0" aria-valuemax="10" aria-valuenow="${item.avg.toFixed(1)}"><span style="width:${percent}%"></span></div>
        <div class="row"><div class="muted">Оценок: ${item.count}</div><div class="muted"></div></div>
      `;
      subjectsList.appendChild(card);
    }
  }

  function renderProfile(student, stats) {
    studentShort.textContent = `${student.name} • ${student.class}`;
    studentName.textContent = student.name;
    studentClass.textContent = student.class;
    avgAllEl.textContent = String(stats.avgAll);
    countAllEl.textContent = String(stats.countAll);
  }

  // ---------- Tabs ----------
  const tabs = Array.from(document.querySelectorAll('.tab'));
  function setActiveTab(name) {
    tabs.forEach(t => {
      const active = t.dataset.screen === name;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    const current = document.getElementById(`screen-${name}`);
    if (current) current.classList.remove('hidden');
  }
  function initTabs() {
    tabs.forEach(t => t.addEventListener('click', () => setActiveTab(t.dataset.screen)));
  }

  // ---------- Init ----------
  let appData = null;
  function renderAll() {
    renderDiary(appData.diary);
    renderSubjects(appData.stats);
    renderProfile(appData.student, appData.stats);
  }

  function init() {
    initTheme();
    initTabs();
    setActiveTab('diary');
    appData = loadData();
    renderAll();
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        appData = resetData();
        renderAll();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

