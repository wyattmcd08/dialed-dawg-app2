/* ============================================
DIALED DAWG — script.js
Zero fake data. Everything earned by logging.
============================================ */
‘use strict’;

// ─── CONSTANTS ───────────────────────────────

const QUOTES = [
‘“The only bad workout is the one that didn't happen.”’,
‘“Iron never lies to you.”’,
‘“Suffer the pain of discipline or suffer the pain of regret.”’,
‘“Every rep is a vote for the person you want to become.”’,
‘“Your body can stand almost anything. It's your mind you have to convince.”’,
‘“Train insane or remain the same.”’,
‘“Strength doesn't come from what you can do — it comes from overcoming what you thought you couldn't.”’,
‘“Don't count the days. Make the days count.”’,
‘“Champions are made from something deep inside them — a desire, a dream, a vision.”’,
‘“Be proud of every scar on your mind. Each one holds a lesson.”’
];

const EXERCISES = [
{name:‘Bench Press’,       muscle:‘chest’},
{name:‘Incline DB Press’,  muscle:‘chest’},
{name:‘Decline Press’,     muscle:‘chest’},
{name:‘Cable Fly’,         muscle:‘chest’},
{name:‘Dips’,              muscle:‘chest’},
{name:‘Deadlift’,          muscle:‘back’},
{name:‘Barbell Row’,       muscle:‘back’},
{name:‘Pull-Ups’,          muscle:‘back’},
{name:‘Lat Pulldown’,      muscle:‘back’},
{name:‘Cable Row’,         muscle:‘back’},
{name:‘Face Pulls’,        muscle:‘back’},
{name:‘Squat’,             muscle:‘legs’},
{name:‘Romanian Deadlift’, muscle:‘legs’},
{name:‘Leg Press’,         muscle:‘legs’},
{name:‘Leg Curl’,          muscle:‘legs’},
{name:‘Leg Extension’,     muscle:‘legs’},
{name:‘Calf Raises’,       muscle:‘legs’},
{name:‘OHP’,               muscle:‘shoulders’},
{name:‘Lateral Raises’,    muscle:‘shoulders’},
{name:‘DB Shoulder Press’, muscle:‘shoulders’},
{name:‘Bicep Curls’,       muscle:‘arms’},
{name:‘Hammer Curls’,      muscle:‘arms’},
{name:‘Tricep Pushdowns’,  muscle:‘arms’},
{name:‘Skull Crushers’,    muscle:‘arms’},
{name:‘Plank’,             muscle:‘core’},
{name:‘Cable Crunch’,      muscle:‘core’},
{name:‘Hanging Leg Raise’, muscle:‘core’}
];

const SPLIT_DEFAULT = {
name: ‘PPL 6-Day’,
days: [
{day:‘MON’, name:‘Push’, exercises:[‘Bench Press’,‘Incline DB Press’,‘Lateral Raises’,‘Tricep Pushdowns’]},
{day:‘TUE’, name:‘Pull’, exercises:[‘Deadlift’,‘Barbell Row’,‘Pull-Ups’,‘Face Pulls’,‘Bicep Curls’]},
{day:‘WED’, name:‘Legs’, exercises:[‘Squat’,‘Romanian Deadlift’,‘Leg Press’,‘Leg Curl’,‘Calf Raises’]},
{day:‘THU’, name:‘Push’, exercises:[‘OHP’,‘DB Shoulder Press’,‘Lateral Raises’,‘Dips’]},
{day:‘FRI’, name:‘Pull’, exercises:[‘Rack Pull’,‘Cable Row’,‘Lat Pulldown’,‘Hammer Curls’]},
{day:‘SAT’, name:‘Legs’, exercises:[‘Front Squat’,‘Hack Squat’,‘Leg Extension’,‘Nordic Curl’]},
{day:‘SUN’, name:‘Rest’, exercises:[]}
]
};

const FAVORITES_DEFAULT = [
{name:‘Chicken Breast (100g)’, cals:165, protein:31, carbs:0,  fat:3.6},
{name:‘White Rice (100g)’,     cals:130, protein:2.7,carbs:28, fat:0.3},
{name:‘Whole Eggs (2)’,        cals:140, protein:12, carbs:1,  fat:10},
{name:‘Greek Yogurt (150g)’,   cals:88,  protein:15, carbs:5,  fat:0.7},
{name:‘Whey Protein (1 scoop)’,cals:120, protein:25, carbs:3,  fat:1.5},
{name:‘Oats (80g)’,            cals:304, protein:11, carbs:52, fat:6}
];

// ─── DEFAULT STATE ─────────────────────────── (all truly zero / null)

function freshToday() {
return {
date: new Date().toDateString(),
caloriesEaten:  0,
caloriesBurned: 0,
protein: 0,
carbs:   0,
fat:     0,
water:   0,
sleep:   null,   // null = not yet logged
weight:  null,   // null = not yet logged
checklist: {},
meals: {breakfast:[], lunch:[], dinner:[], snacks:[]}
};
}

function buildDefault() {
return {
user:    {name:‘Athlete’},
targets: {calories:0, protein:0, carbs:0, fat:0, water:8},
today:   freshToday(),
streak:      0,
bestStreak:  0,
prs:     {bench:null, squat:null, deadlift:null},
// per-exercise PR store: {exerciseName: {weight, reps, date}}
prMap:   {},
bodyStats:   {weight:null, bodyFat:null, chest:null, waist:null, arms:null, legs:null},
// muscle recovery 0–100 (100 = fully fresh). Starts fresh; decreases on workout log.
muscleFatigue: {chest:100, back:100, legs:100, shoulders:100, arms:100, core:100},
// weight history: [{date, weight}]  — only real logged entries
weightHistory: [],
// strength history: {exerciseName: [{date, weight, reps}]}
strengthHistory: {},
peptides:     [],
injectionLog: {},
// workoutLog: {dateString: {name, exercises, durationSec}}
workoutLog:   {},
split:        SPLIT_DEFAULT,
favorites:    FAVORITES_DEFAULT
};
}

// ─── STATE & STORAGE ─────────────────────────

let S = {};

function save() {
try { localStorage.setItem(‘dd_v2’, JSON.stringify(S)); }
catch(e){ console.warn(‘Storage error’, e); }
}

function load() {
try {
const raw = localStorage.getItem(‘dd_v2’);
if (raw) {
const parsed = JSON.parse(raw);
S = deepMerge(buildDefault(), parsed);
} else {
S = buildDefault();
}
} catch(e) {
S = buildDefault();
}
// Reset today if date changed
const today = new Date().toDateString();
if (S.today.date !== today) {
// Tick recovery before resetting
tickRecovery();
S.today = freshToday();
save();
}
}

// Shallow-deep merge: keeps saved values, fills missing keys from defaults
function deepMerge(def, saved) {
const out = Object.assign({}, def);
for (const key of Object.keys(saved)) {
if (saved[key] !== null && typeof saved[key] === ‘object’ && !Array.isArray(saved[key]) &&
def[key] !== null && typeof def[key] === ‘object’ && !Array.isArray(def[key])) {
out[key] = deepMerge(def[key], saved[key]);
} else {
out[key] = saved[key];
}
}
return out;
}

// Recovery ticks up 15% per day (called on midnight rollover)
function tickRecovery() {
for (const m of Object.keys(S.muscleFatigue)) {
S.muscleFatigue[m] = Math.min(100, (S.muscleFatigue[m] || 100) + 15);
}
}

// ─── INIT ────────────────────────────────────

document.addEventListener(‘DOMContentLoaded’, () => {
load();
setTimeout(() => {
document.getElementById(‘splash’).classList.add(‘hidden’);
document.getElementById(‘app’).classList.remove(‘hidden’);
boot();
}, 1600);
});

function boot() {
setGreeting();
updateUserDisplay();
bindNav();
bindHomeEvents();
bindWorkoutEvents();
bindProgressEvents();
bindNutritionEvents();
bindRecoveryEvents();
bindCalendarEvents();
bindPeptideEvents();
bindSettingsEvents();
bindModals();
// Render all pages
renderHome();
renderWorkout();
renderProgress();
renderNutrition();
renderRecovery();
renderCalendar();
renderPeptides();
renderSettings();
registerSW();
}

// ─── NAVIGATION ──────────────────────────────

function bindNav() {
document.querySelectorAll(’.nav-btn’).forEach(btn => {
btn.addEventListener(‘click’, () => navigateTo(btn.dataset.page));
});
// Avatar tap → settings
document.getElementById(‘avatarCircle’).addEventListener(‘click’, () => navigateTo(‘settings’));
}

function navigateTo(pageId) {
document.querySelectorAll(’.nav-btn’).forEach(b => b.classList.toggle(‘active’, b.dataset.page === pageId));
document.querySelectorAll(’.page’).forEach(p => p.classList.toggle(‘active’, p.id === ‘page-’ + pageId));
}

// ─── GREETING ────────────────────────────────

function setGreeting() {
const h = new Date().getHours();
const g = h < 12 ? ‘Good morning’ : h < 17 ? ‘Good afternoon’ : ‘Good evening’;
el(‘greeting’).textContent = g;
}

function updateUserDisplay() {
const n = S.user.name || ‘Athlete’;
el(‘userName’).textContent       = n.toUpperCase();
el(‘avatarCircle’).textContent   = n[0].toUpperCase();
el(‘settingsAvatar’).textContent = n[0].toUpperCase();
el(‘settingsName’).textContent   = n;
el(‘siName’).textContent         = n;
}

// ─── HOME ────────────────────────────────────

function renderHome() {
// Quote
el(‘dailyQuote’).textContent = QUOTES[new Date().getDay() % QUOTES.length];

// Calories
const cGoal = S.targets.calories;
const eaten = S.today.caloriesEaten;
const burned = S.today.caloriesBurned;
const left  = cGoal > 0 ? Math.max(0, cGoal - eaten + burned) : null;

el(‘calGoal’).textContent    = cGoal  > 0 ? cGoal.toLocaleString()  : ‘Not set’;
el(‘calEaten’).textContent   = eaten.toLocaleString();
el(‘calBurned’).textContent  = burned.toLocaleString();
el(‘calRemaining’).textContent = left !== null ? left.toLocaleString() : ‘—’;

// Ring
const circ = 326.7;
const pct  = (cGoal > 0 && eaten > 0) ? Math.min(eaten / cGoal, 1) : 0;
el(‘calRingCircle’).style.strokeDashoffset = circ - pct * circ;

// Macro bars
renderMacroGroup(
S.today.protein, S.today.carbs, S.today.fat,
S.targets.protein, S.targets.carbs, S.targets.fat,
‘protFill’,‘carbFill’,‘fatFill’,‘protVal’,‘carbVal’,‘fatVal’
);

// Quick stats
el(‘waterVal’).textContent  = S.today.water > 0 ? S.today.water + ’ cups’ : ‘—’;
el(‘sleepVal’).textContent  = S.today.sleep  != null ? S.today.sleep + ‘h’  : ‘—’;
el(‘streakVal’).textContent = S.streak;
el(‘weightVal’).textContent = S.today.weight != null ? S.today.weight + ’ lb’ : ‘—’;

// Today’s workout
const dayIdx = new Date().getDay(); // 0=Sun
const dayMap = {0:‘SUN’,1:‘MON’,2:‘TUE’,3:‘WED’,4:‘THU’,5:‘FRI’,6:‘SAT’};
const todayKey = dayMap[dayIdx];
const splitDay = S.split.days.find(d => d.day === todayKey) || S.split.days[dayIdx % S.split.days.length];
el(‘todayWorkoutBadge’).textContent = splitDay.name.toUpperCase();
el(‘todayWorkoutName’).textContent  = splitDay.name !== ‘Rest’ ? splitDay.name + ’ Day’ : ‘Rest Day’;
el(‘todayWorkoutList’).innerHTML = splitDay.exercises.length
? splitDay.exercises.slice(0,4).map(ex =>
`<div class="wt-row"><span>${ex}</span><span class="wt-sets">4 × 8</span></div>`).join(’’)
: ‘<div class="wt-row" style="color:var(--sub)">Active rest — stretch, walk, recover</div>’;

// Recovery
const rec = calcOverallRecovery();
if (Object.values(S.workoutLog).length > 0 || rec < 100) {
el(‘recoveryScore’).textContent = rec;
el(‘recoveryBar’).style.width   = rec + ‘%’;
el(‘recoveryBar’).style.background = recoveryColor(rec);
el(‘recoveryStatus’).textContent   = recoveryLabel(rec);
} else {
el(‘recoveryScore’).textContent  = ‘—’;
el(‘recoveryBar’).style.width    = ‘0%’;
el(‘recoveryStatus’).textContent = ‘Log a workout to track recovery’;
}

// PRs
const prList = el(‘homePRList’);
const prEntries = Object.entries(S.prMap);
if (prEntries.length === 0) {
prList.innerHTML = ‘<div class="empty-state"><div class="es-text">No PRs yet. Finish a workout to set records.</div></div>’;
} else {
prList.innerHTML = prEntries.slice(-5).reverse().map(([name, pr]) =>
`<div class="pr-item"> <span class="pr-ex">${name}</span> <span class="pr-val">${pr.weight} lbs × ${pr.reps}</span> <span class="pr-when">${timeAgo(pr.date)}</span> </div>`
).join(’’);
}

// Checklist
document.querySelectorAll(’.check-inp’).forEach(c => {
c.checked = !!(S.today.checklist[c.dataset.key]);
});
}

function bindHomeEvents() {
document.querySelectorAll(’.check-inp’).forEach(inp => {
inp.addEventListener(‘change’, () => {
S.today.checklist[inp.dataset.key] = inp.checked;
save();
});
});

el(‘quickAddMeal’).addEventListener(‘click’, () => {
S._pendingMeal = ‘breakfast’;
openModal(‘addFoodModal’);
renderFavorites();
});

el(‘quickAddWater’).addEventListener(‘click’, () => {
if (S.today.water < 20) {
S.today.water++;
save();
renderHome();
renderNutrition();
}
});

el(‘quickAddWeight’).addEventListener(‘click’, () => {
openInput(‘Log Body Weight’, ‘Weight in lbs’, ‘’, val => {
const w = parseFloat(val);
if (!isNaN(w) && w > 0) {
S.today.weight = w;
S.bodyStats.weight = w;
S.weightHistory.push({date: new Date().toDateString(), weight: w});
save();
renderHome();
renderProgress();
}
});
});

el(‘startWorkoutBtn’).addEventListener(‘click’, () => {
const dayIdx = new Date().getDay();
const dayMap = {0:‘SUN’,1:‘MON’,2:‘TUE’,3:‘WED’,4:‘THU’,5:‘FRI’,6:‘SAT’};
const todayKey = dayMap[dayIdx];
const splitDay = S.split.days.find(d => d.day === todayKey) || S.split.days[dayIdx % S.split.days.length];
if (splitDay.name === ‘Rest’ || splitDay.exercises.length === 0) {
alert(‘Today is a rest day! Enjoy the recovery 🔄’);
return;
}
navigateTo(‘workout’);
startWorkout(splitDay);
});

el(‘qsWater’).addEventListener(‘click’, () => {
openInput(‘Log Water’, ‘Cups of water today’, S.today.water || ‘’, val => {
const w = parseInt(val);
if (!isNaN(w) && w >= 0) { S.today.water = w; save(); renderHome(); renderNutrition(); }
});
});
el(‘qsSleep’).addEventListener(‘click’, () => {
openInput(‘Log Sleep’, ‘Hours of sleep’, S.today.sleep || ‘’, val => {
const s = parseFloat(val);
if (!isNaN(s) && s >= 0) { S.today.sleep = s; save(); renderHome(); }
});
});
el(‘qsWeight’).addEventListener(‘click’, () => {
openInput(‘Log Body Weight’, ‘Weight in lbs’, S.today.weight || ‘’, val => {
const w = parseFloat(val);
if (!isNaN(w) && w > 0) {
S.today.weight = w; S.bodyStats.weight = w;
S.weightHistory.push({date: new Date().toDateString(), weight: w});
save(); renderHome(); renderProgress();
}
});
});
}

// ─── WORKOUT ─────────────────────────────────

let _wTimer = null;
let _wElapsed = 0;

function renderWorkout() {
el(‘splitNameLabel’).textContent = S.split.name;
const cont = el(‘splitDays’);
cont.innerHTML = S.split.days.map((d, i) => ` <div class="split-day" data-idx="${i}"> <span class="sd-day">${d.day}</span> <span class="sd-name">${d.name}</span> <span class="sd-meta">${d.exercises.length > 0 ? d.exercises.length + ' exercises' : 'REST'}</span> </div>`).join(’’);
cont.querySelectorAll(’.split-day’).forEach(row => {
row.addEventListener(‘click’, () => {
const d = S.split.days[parseInt(row.dataset.idx)];
if (d.exercises.length > 0) startWorkout(d);
});
});
renderExList(‘all’);
}

function renderExList(muscle) {
const search = (el(‘exerciseSearch’).value || ‘’).toLowerCase();
const list = el(‘exerciseList’);
const filtered = EXERCISES.filter(ex =>
(muscle === ‘all’ || ex.muscle === muscle) &&
(!search || ex.name.toLowerCase().includes(search))
);
list.innerHTML = filtered.map(ex => ` <div class="ex-item" data-name="${ex.name}" data-muscle="${ex.muscle}"> <div><div class="ex-name">${ex.name}</div><div class="ex-muscle">${cap(ex.muscle)}</div></div> <span class="ex-add">＋</span> </div>`).join(’’);
list.querySelectorAll(’.ex-item’).forEach(item => {
item.addEventListener(‘click’, () => {
if (S._activeWorkout) {
addExToWorkout(item.dataset.name);
el(‘activeWorkoutOverlay’).classList.remove(‘hidden’);
}
});
});
}

function bindWorkoutEvents() {
el(‘exerciseSearch’).addEventListener(‘input’, () => {
const m = document.querySelector(’.chip.active’)?.dataset.muscle || ‘all’;
renderExList(m);
});
el(‘muscleFilter’).addEventListener(‘click’, e => {
const chip = e.target.closest(’.chip’);
if (!chip) return;
document.querySelectorAll(’.chip’).forEach(c => c.classList.remove(‘active’));
chip.classList.add(‘active’);
renderExList(chip.dataset.muscle);
});
el(‘finishWorkoutBtn’).addEventListener(‘click’, finishWorkout);
el(‘addExToWorkout’).addEventListener(‘click’, () => {
el(‘activeWorkoutOverlay’).classList.add(‘hidden’);
});
}

function startWorkout(splitDay) {
S._activeWorkout = {
name: splitDay.name.toUpperCase() + ’ DAY’,
splitName: splitDay.name,
exercises: splitDay.exercises.map(name => ({
name,
sets: [{weight:’’, reps:’’, done:false}, {weight:’’, reps:’’, done:false}, {weight:’’, reps:’’, done:false}, {weight:’’, reps:’’, done:false}]
}))
};
_wElapsed = 0;
el(‘awTitle’).textContent = S._activeWorkout.name;
el(‘awTimer’).textContent = ‘00:00’;
el(‘activeWorkoutOverlay’).classList.remove(‘hidden’);
renderActiveWorkout();

if (_wTimer) clearInterval(_wTimer);
_wTimer = setInterval(() => {
_wElapsed++;
const m = Math.floor(_wElapsed/60).toString().padStart(2,‘0’);
const s = (_wElapsed%60).toString().padStart(2,‘0’);
el(‘awTimer’).textContent = `${m}:${s}`;
}, 1000);
}

function renderActiveWorkout() {
const cont = el(‘awExercises’);
cont.innerHTML = S._activeWorkout.exercises.map((ex, eIdx) => `<div class="aw-ex-card"> <div class="aw-ex-name">${ex.name}</div> ${ex.sets.map((set, sIdx) =>`
<div class="aw-set-row">
<span class="aw-set-num">${sIdx+1}</span>
<input class="aw-inp" type="number" placeholder="lbs" value="${set.weight}"
data-e="${eIdx}" data-s="${sIdx}" data-f="weight" inputmode="decimal"/>
<input class="aw-inp" type="number" placeholder="reps" value="${set.reps}"
data-e="${eIdx}" data-s="${sIdx}" data-f="reps" inputmode="decimal"/>
<div class="aw-done ${set.done?'done':''}" data-e="${eIdx}" data-s="${sIdx}">
${set.done?‘✓’:’’}
</div>
</div>`).join('')} <button class="aw-add-set" data-e="${eIdx}">+ Add Set</button> </div>`).join(’’);

cont.querySelectorAll(’.aw-inp’).forEach(inp => {
inp.addEventListener(‘change’, () => {
S._activeWorkout.exercises[+inp.dataset.e].sets[+inp.dataset.s][inp.dataset.f] = inp.value;
});
});
cont.querySelectorAll(’.aw-done’).forEach(btn => {
btn.addEventListener(‘click’, () => {
const ex = S._activeWorkout.exercises[+btn.dataset.e];
ex.sets[+btn.dataset.s].done = !ex.sets[+btn.dataset.s].done;
renderActiveWorkout();
vibrate();
});
});
cont.querySelectorAll(’.aw-add-set’).forEach(btn => {
btn.addEventListener(‘click’, () => {
S._activeWorkout.exercises[+btn.dataset.e].sets.push({weight:’’, reps:’’, done:false});
renderActiveWorkout();
});
});
}

function addExToWorkout(name) {
S._activeWorkout.exercises.push({
name,
sets: [{weight:’’,reps:’’,done:false},{weight:’’,reps:’’,done:false},{weight:’’,reps:’’,done:false}]
});
renderActiveWorkout();
}

function finishWorkout() {
if (_wTimer) { clearInterval(_wTimer); _wTimer = null; }

const w = S._activeWorkout;
const today = new Date().toDateString();

// Update PRs from sets
w.exercises.forEach(ex => {
ex.sets.forEach(set => {
const wt = parseFloat(set.weight);
const r  = parseInt(set.reps);
if (!isNaN(wt) && !isNaN(r) && wt > 0 && r > 0) {
// Update prMap
const existing = S.prMap[ex.name];
if (!existing || wt > existing.weight || (wt === existing.weight && r > existing.reps)) {
S.prMap[ex.name] = {weight: wt, reps: r, date: today};
}
// Big 3 shortcuts
if (ex.name === ‘Bench Press’)
if (!S.prs.bench || wt >= S.prs.bench.weight) S.prs.bench = {weight:wt, reps:r};
if (ex.name === ‘Squat’)
if (!S.prs.squat || wt >= S.prs.squat.weight) S.prs.squat = {weight:wt, reps:r};
if (ex.name === ‘Deadlift’)
if (!S.prs.deadlift || wt >= S.prs.deadlift.weight) S.prs.deadlift = {weight:wt, reps:r};

```
    // Strength history
    if (!S.strengthHistory[ex.name]) S.strengthHistory[ex.name] = [];
    const last = S.strengthHistory[ex.name].slice(-1)[0];
    if (!last || last.weight !== wt || last.date !== today) {
      S.strengthHistory[ex.name].push({date: today, weight: wt, reps: r});
      if (S.strengthHistory[ex.name].length > 20) S.strengthHistory[ex.name].shift();
    }
  }
});
```

});

// Log workout to calendar
S.workoutLog[today] = {name: w.splitName, durationSec: _wElapsed};
S.today.checklist.workout = true;

// Update streak
const yesterday = new Date(Date.now() - 864e5).toDateString();
if (S.workoutLog[yesterday] || S.streak === 0) {
S.streak++;
} else {
S.streak = 1;
}
if (S.streak > S.bestStreak) S.bestStreak = S.streak;

// Decrease muscle fatigue for muscles trained
const muscleMap = {
Push: [‘chest’,‘shoulders’,‘arms’],
Pull: [‘back’,‘arms’],
Legs: [‘legs’,‘core’],
Rest: []
};
const muscles = muscleMap[w.splitName] || [];
muscles.forEach(m => {
S.muscleFatigue[m] = Math.max(0, (S.muscleFatigue[m] || 100) - 35);
});

S._activeWorkout = null;
save();
el(‘activeWorkoutOverlay’).classList.add(‘hidden’);
renderHome();
renderProgress();
renderRecovery();
renderCalendar();
alert(‘Workout done! 💪 Great session.’);
}

// ─── PROGRESS ────────────────────────────────

function renderProgress() {
// Big 3
const renderPR = (id, estId, prObj) => {
if (prObj) {
el(id).textContent    = prObj.weight + ’ lbs’;
const est = Math.round(prObj.weight * (1 + prObj.reps / 30));
el(estId).textContent = `Est. 1RM: ${est} lbs`;
} else {
el(id).textContent    = ‘—’;
el(estId).textContent = ‘’;
}
};
renderPR(‘pr-bench’,    ‘pr-bench-est’,    S.prs.bench);
renderPR(‘pr-squat’,    ‘pr-squat-est’,    S.prs.squat);
renderPR(‘pr-deadlift’, ‘pr-deadlift-est’, S.prs.deadlift);

// Body stats
const bs = S.bodyStats;
el(‘bsWeight’).textContent = bs.weight   != null ? bs.weight + ’ lbs’  : ‘—’;
el(‘bsBF’).textContent     = bs.bodyFat  != null ? bs.bodyFat + ‘%’     : ‘—’;
el(‘bsChest’).textContent  = bs.chest    != null ? bs.chest + ‘”’       : ‘—’;
el(‘bsWaist’).textContent  = bs.waist    != null ? bs.waist + ‘”’       : ‘—’;
el(‘bsArms’).textContent   = bs.arms     != null ? bs.arms + ‘”’        : ‘—’;
el(‘bsLegs’).textContent   = bs.legs     != null ? bs.legs + ‘”’        : ‘—’;

// Weight chart
drawWeightChart();

// Strength list
const sl = el(‘strengthList’);
const shEntries = Object.entries(S.strengthHistory);
if (shEntries.length === 0) {
sl.innerHTML = ‘<div class="empty-state"><div class="es-text">Complete workouts to track strength progress.</div></div>’;
} else {
const maxW = Math.max(…shEntries.map(([,h]) => h[h.length-1]?.weight || 0));
sl.innerHTML = shEntries.map(([name, history]) => {
const cur  = history[history.length-1]?.weight || 0;
const prev = history[history.length-2]?.weight || cur;
const diff = cur - prev;
const pct  = maxW ? (cur/maxW)*100 : 0;
return `<div class="strength-item"> <div class="si-top"> <span class="si-name">${name}</span> <span class="si-pr">${cur} lbs${diff > 0 ? ` <span style="color:var(--green);font-size:10px">+${diff}</span>` : ''}</span> </div> <div class="si-bar"><div class="si-fill" style="width:${pct}%"></div></div> </div>`;
}).join(’’);
}
}

function drawWeightChart() {
const canvas  = el(‘weightChart’);
const emptyEl = el(‘weightChartEmpty’);
const data    = S.weightHistory.slice(-16);

if (data.length < 2) {
canvas.style.display = ‘none’;
emptyEl.classList.remove(‘hidden’);
return;
}
canvas.style.display = ‘block’;
emptyEl.classList.add(‘hidden’);

const dpr = window.devicePixelRatio || 1;
const w   = canvas.parentElement.offsetWidth || 300;
const h   = 120;
canvas.width  = w * dpr;
canvas.height = h * dpr;
canvas.style.width  = w + ‘px’;
canvas.style.height = h + ‘px’;

const ctx = canvas.getContext(‘2d’);
ctx.scale(dpr, dpr);

const weights = data.map(d => d.weight);
const minW = Math.min(…weights) - 2;
const maxW = Math.max(…weights) + 2;
const pL=8, pR=8, pT=8, pB=20;
const cw = w - pL - pR;
const ch = h - pT - pB;
const xStep = cw / (data.length - 1);
const yOf  = v => pT + ch - ((v - minW) / (maxW - minW)) * ch;

ctx.clearRect(0, 0, w, h);

// Gridlines
ctx.strokeStyle = ‘#1e1e1e’; ctx.lineWidth = 1;
for (let i=0; i<=3; i++) {
const y = pT + (ch/3)*i;
ctx.beginPath(); ctx.moveTo(pL, y); ctx.lineTo(w-pR, y); ctx.stroke();
}

// Gradient fill
const grad = ctx.createLinearGradient(0, pT, 0, pT+ch);
grad.addColorStop(0, ‘rgba(200,16,46,0.25)’);
grad.addColorStop(1, ‘rgba(200,16,46,0)’);
ctx.beginPath();
data.forEach((d,i) => { const x=pL+i*xStep, y=yOf(d.weight); i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
ctx.lineTo(pL+(data.length-1)*xStep, pT+ch);
ctx.lineTo(pL, pT+ch);
ctx.closePath();
ctx.fillStyle = grad; ctx.fill();

// Line
ctx.beginPath(); ctx.strokeStyle=’#c8102e’; ctx.lineWidth=2; ctx.lineJoin=‘round’;
data.forEach((d,i) => { const x=pL+i*xStep, y=yOf(d.weight); i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
ctx.stroke();

// Dots + labels
ctx.fillStyle = ‘#6b6b6b’; ctx.font = `10px Barlow,sans-serif`; ctx.textAlign=‘center’;
data.forEach((d,i) => {
const x=pL+i*xStep, y=yOf(d.weight);
ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fillStyle=’#c8102e’; ctx.fill();
if (i===0 || i===data.length-1 || i===Math.floor(data.length/2)) {
ctx.fillStyle=’#555’; ctx.fillText(d.weight+‘lb’, x, h-5);
}
});
}

function bindProgressEvents() {
el(‘logBodyStatsBtn’).addEventListener(‘click’, () => openModal(‘bodyStatsModal’));
el(‘addPhotoBtn’).addEventListener(‘click’, () => {
const inp = document.createElement(‘input’);
inp.type = ‘file’; inp.accept = ‘image/*’;
inp.onchange = e => {
const file = e.target.files[0]; if (!file) return;
const reader = new FileReader();
reader.onload = ev => {
const gal = el(‘photoGallery’);
gal.innerHTML = ‘’;
const img = document.createElement(‘img’);
img.src = ev.target.result;
gal.appendChild(img);
};
reader.readAsDataURL(file);
};
inp.click();
});
}

// ─── NUTRITION ───────────────────────────────

function renderNutrition() {
const t   = S.today;
const tgt = S.targets;
const goal = tgt.calories;
const left  = goal > 0 ? Math.max(0, goal - t.caloriesEaten) : null;

el(‘nCalEaten’).textContent = Math.round(t.caloriesEaten).toLocaleString();
el(‘nCalLeft’).textContent  = left !== null ? left.toLocaleString() : ‘—’;
el(‘nCalGoal’).textContent  = goal > 0 ? goal.toLocaleString() : ‘—’;

const fillPct = goal > 0 ? Math.min((t.caloriesEaten / goal)*100, 100) : 0;
el(‘nutrProgFill’).style.width = fillPct + ‘%’;

renderMacroGroup(
t.protein, t.carbs, t.fat,
tgt.protein, tgt.carbs, tgt.fat,
‘nProtFill’,‘nCarbFill’,‘nFatFill’,‘nProtVal’,‘nCarbVal’,‘nFatVal’
);

// Meals
[‘breakfast’,‘lunch’,‘dinner’,‘snacks’].forEach(meal => {
const foods = t.meals[meal] || [];
const total = foods.reduce((s,f)=>s+(f.cals||0), 0);
el(‘cals-’+meal).textContent = total > 0 ? total + ’ kcal’ : ‘0 kcal’;
const cont = el(‘foods-’+meal);
cont.innerHTML = foods.map((f,i) => ` <div class="food-entry"> <span class="fe-name">${f.name}</span> <span class="fe-macro">${f.protein}p · ${f.carbs}c · ${f.fat}f</span> <span class="fe-cal">${f.cals}</span> <button class="fe-del" data-meal="${meal}" data-i="${i}">✕</button> </div>`).join(’’);
cont.querySelectorAll(’.fe-del’).forEach(btn => {
btn.addEventListener(‘click’, () => removeFood(btn.dataset.meal, +btn.dataset.i));
});
});

// Water cups
const cups = el(‘waterCups’);
const goal8 = S.targets.water || 8;
cups.innerHTML = Array.from({length: goal8}, (_,i) =>
`<div class="water-cup ${i < t.water ? 'filled' : ''}" data-i="${i}"> ${i < t.water ? '💧' : ''} </div>`).join(’’);
cups.querySelectorAll(’.water-cup’).forEach(cup => {
cup.addEventListener(‘click’, () => {
const i = +cup.dataset.i;
S.today.water = i < S.today.water ? i : i+1;
save(); renderNutrition(); renderHome();
});
});
el(‘waterGoalText’).textContent = `${t.water} / ${goal8} cups`;
}

function removeFood(meal, idx) {
const f = S.today.meals[meal][idx];
S.today.caloriesEaten -= f.cals  || 0;
S.today.protein       -= f.protein || 0;
S.today.carbs         -= f.carbs   || 0;
S.today.fat           -= f.fat     || 0;
S.today.meals[meal].splice(idx, 1);
save(); renderNutrition(); renderHome();
}

function addFood(meal, food) {
if (!S.today.meals[meal]) S.today.meals[meal] = [];
S.today.meals[meal].push(food);
S.today.caloriesEaten += food.cals     || 0;
S.today.protein       += food.protein  || 0;
S.today.carbs         += food.carbs    || 0;
S.today.fat           += food.fat      || 0;
save(); renderNutrition(); renderHome();
}

function bindNutritionEvents() {
el(‘openCalcBtn’).addEventListener(‘click’, () => openModal(‘calcModal’));

document.querySelectorAll(’.meal-add’).forEach(btn => {
btn.addEventListener(‘click’, () => {
S._pendingMeal = btn.dataset.meal;
openModal(‘addFoodModal’);
renderFavorites();
});
});
}

function renderFavorites() {
el(‘favoritesList’).innerHTML = S.favorites.map((f,i) => ` <div class="fav-item" data-i="${i}"> <span>${f.name}</span> <span class="fav-cal">${f.cals} kcal</span> </div>`).join(’’);
el(‘favoritesList’).querySelectorAll(’.fav-item’).forEach(item => {
item.addEventListener(‘click’, () => {
const f = S.favorites[+item.dataset.i];
addFood(S._pendingMeal || ‘snacks’, {…f});
closeModal(‘addFoodModal’);
});
});
}

// ─── RECOVERY ────────────────────────────────

function calcOverallRecovery() {
const vals = Object.values(S.muscleFatigue);
return Math.round(vals.reduce((a,b) => a+b, 0) / vals.length);
}

function recoveryColor(score) {
if (score >= 75) return ‘var(–green)’;
if (score >= 45) return ‘var(–yellow)’;
return ‘var(–red)’;
}

function recoveryLabel(score) {
if (score >= 85) return ‘Fully recovered — ready to crush it’;
if (score >= 70) return ‘Good — train with intensity’;
if (score >= 50) return ‘Moderate — manage your volume today’;
if (score >= 30) return ‘Fatigued — light work only’;
return ‘Overtrained — prioritize rest today’;
}

function renderRecovery() {
const overall = calcOverallRecovery();
const hasData = Object.values(S.workoutLog).length > 0;

if (hasData) {
el(‘rhScore’).textContent  = overall;
el(‘rhStatus’).textContent = recoveryLabel(overall);
} else {
el(‘rhScore’).textContent  = ‘—’;
el(‘rhStatus’).textContent = ‘Log a workout to track recovery’;
}

// Body SVG coloring
document.querySelectorAll(’.mz’).forEach(zone => {
const m   = zone.dataset.muscle;
const pct = S.muscleFatigue[m] ?? 100;
zone.classList.remove(‘fresh’,‘moderate’,‘fatigued’);
if (pct >= 75)      zone.classList.add(‘fresh’);
else if (pct >= 40) zone.classList.add(‘moderate’);
else                zone.classList.add(‘fatigued’);
});

// Muscle list
const list = el(‘muscleRecoveryList’);
const muscles = [‘Chest’,‘Back’,‘Legs’,‘Shoulders’,‘Arms’,‘Core’];
list.innerHTML = muscles.map(m => {
const key = m.toLowerCase();
const pct = S.muscleFatigue[key] ?? 100;
const col = pct >= 75 ? ‘var(–green)’ : pct >= 40 ? ‘var(–yellow)’ : ‘var(–red)’;
return `<div class="mrl-item"> <div class="mrl-dot" style="background:${col}"></div> <span class="mrl-name">${m}</span> <div class="mrl-bar"><div class="mrl-fill" style="width:${pct}%;background:${col}"></div></div> <span class="mrl-pct" style="color:${col}">${pct}%</span> </div>`;
}).join(’’);

// Recommendations
el(‘recoveryRecs’).innerHTML = muscles.map(m => {
const key = m.toLowerCase();
const pct = S.muscleFatigue[key] ?? 100;
if (!hasData) return `<div class="rec-item y">📋 ${m} — log a workout to track fatigue</div>`;
if (pct >= 75) return `<div class="rec-item g">✅ ${m} fully recovered — great day for ${m.toLowerCase()} work</div>`;
if (pct >= 40) return `<div class="rec-item y">⚠️ ${m} at ${pct}% — moderate volume recommended</div>`;
return `<div class="rec-item r">🚫 ${m} fatigued — rest or very light work only</div>`;
}).join(’’);
}

function bindRecoveryEvents() { /* future: manual override */ }

// ─── CALENDAR ────────────────────────────────

let _calDate = new Date();

function renderCalendar() {
el(‘calStreak’).textContent     = S.streak;
el(‘calBestStreak’).textContent = S.bestStreak;
renderCalMonth();
}

function renderCalMonth() {
const year  = _calDate.getFullYear();
const month = _calDate.getMonth();
const MONTHS = [‘January’,‘February’,‘March’,‘April’,‘May’,‘June’,‘July’,‘August’,‘September’,‘October’,‘November’,‘December’];
el(‘calMonthLabel’).textContent = `${MONTHS[month]} ${year}`;

const firstDow   = new Date(year, month, 1).getDay();
const daysInMon  = new Date(year, month+1, 0).getDate();
const today      = new Date();
const todayStr   = today.toDateString();

// Count workouts this month
let workoutsThisMonth = 0;
let restThisMonth = 0;
for (let d=1; d<=daysInMon; d++) {
const dateObj = new Date(year, month, d);
if (dateObj > today) break;
const dateStr = dateObj.toDateString();
if (S.workoutLog[dateStr]) workoutsThisMonth++;
else if (dateStr !== todayStr) restThisMonth++;
}
const daysSoFar  = today.getMonth() === month && today.getFullYear() === year
? today.getDate() : daysInMon;
const consistency = daysSoFar > 0
? Math.round((workoutsThisMonth / daysSoFar) * 100) + ‘%’
: ‘—’;

el(‘calConsistency’).textContent = consistency;
el(‘msWorkouts’).textContent  = workoutsThisMonth;
el(‘msRestDays’).textContent  = restThisMonth;
el(‘msConsist’).textContent   = consistency;

// Build grid
let html = ‘’;
// Empty leading cells
for (let i=0; i<firstDow; i++) html += ‘<div class="cal-cell empty"></div>’;
// Days
for (let d=1; d<=daysInMon; d++) {
const dateObj = new Date(year, month, d);
const dateStr = dateObj.toDateString();
const isToday = dateStr === todayStr;
let cls = ‘’;
if (S.workoutLog[dateStr]) cls = ‘workout’;
else if (dateObj < today && !isToday) cls = ‘rest’;
html += `<div class="cal-cell ${cls} ${isToday?'today':''}">${d}</div>`;
}
el(‘calGrid’).innerHTML = html;
}

function bindCalendarEvents() {
el(‘calPrev’).addEventListener(‘click’, () => { _calDate.setMonth(_calDate.getMonth()-1); renderCalendar(); });
el(‘calNext’).addEventListener(‘click’, () => { _calDate.setMonth(_calDate.getMonth()+1); renderCalendar(); });
}

// ─── PEPTIDES ────────────────────────────────

function renderPeptides() {
const stack = el(‘peptideStack’);
if (S.peptides.length === 0) {
stack.innerHTML = ‘<div class="empty-state"><div class="es-text">No peptides in stack. Tap + ADD to add one.</div></div>’;
} else {
stack.innerHTML = S.peptides.map((p,i) => ` <div class="pep-item"> <div><div class="pep-name">${p.name}</div><div class="pep-freq">${p.freq}</div></div> <span class="pep-dose">${p.dose}</span> <button class="pep-del" data-i="${i}">✕</button> </div>`).join(’’);
stack.querySelectorAll(’.pep-del’).forEach(btn => {
btn.addEventListener(‘click’, () => {
S.peptides.splice(+btn.dataset.i, 1);
save(); renderPeptides();
});
});
}
renderInjSchedule();
}

function renderInjSchedule() {
const sched = el(‘injSchedule’);
if (S.peptides.length === 0) {
sched.innerHTML = ‘<div class="empty-state"><div class="es-text">Add peptides to see your injection schedule.</div></div>’;
return;
}
const today = new Date().toDateString();
sched.innerHTML = S.peptides.map((p,pi) => {
const key  = `${today}-${pi}`;
const done = S.injectionLog[key];
return `<div class="inj-item"> <span class="inj-day">${p.freq.slice(0,3).toUpperCase()}</span> <span class="inj-name">${p.name}</span> <span class="inj-dose">${p.dose}</span> <div class="inj-check ${done?'done':''}" data-key="${key}">${done?'✓':''}</div> </div>`;
}).join(’’);
sched.querySelectorAll(’.inj-check’).forEach(btn => {
btn.addEventListener(‘click’, () => {
S.injectionLog[btn.dataset.key] = !S.injectionLog[btn.dataset.key];
save(); renderInjSchedule(); vibrate();
});
});
}

function bindPeptideEvents() {
el(‘addPeptideBtn’).addEventListener(‘click’, () => openModal(‘addPeptideModal’));
el(‘calcReconBtn’).addEventListener(‘click’, calcRecon);
}

function calcRecon() {
const vialMg    = parseFloat(el(‘vialSize’).value);
const bacMl     = parseFloat(el(‘bacWater’).value);
const doseMcg   = parseFloat(el(‘desiredDose’).value);
const syringeIU = parseInt(el(‘syringeUnits’).value);
if ([vialMg,bacMl,doseMcg].some(isNaN)) return;
const concMcgMl  = (vialMg*1000) / bacMl;
const doseVolMl  = doseMcg / concMcgMl;
const mlPerIU    = 1 / syringeIU;
const drawIU     = Math.round(doseVolMl / mlPerIU);
el(‘rrUnits’).textContent = drawIU;
el(‘rrml’).textContent    = doseVolMl.toFixed(3) + ’ ml’;
el(‘rrConc’).textContent  = `Concentration: ${concMcgMl.toFixed(1)} mcg/ml`;
el(‘reconResult’).classList.remove(‘hidden’);
}

// ─── SETTINGS ────────────────────────────────

function renderSettings() {
const n = S.user.name || ‘Athlete’;
el(‘settingsAvatar’).textContent = n[0].toUpperCase();
el(‘settingsName’).textContent   = n;
el(‘siName’).textContent         = n;
el(‘siCalGoal’).textContent     = S.targets.calories > 0 ? S.targets.calories.toLocaleString() + ’ kcal’ : ‘Not set’;
el(‘siProteinGoal’).textContent  = S.targets.protein  > 0 ? S.targets.protein + ‘g’ : ‘Not set’;
el(‘siCarbGoal’).textContent     = S.targets.carbs    > 0 ? S.targets.carbs   + ‘g’ : ‘Not set’;
el(‘siFatGoal’).textContent      = S.targets.fat      > 0 ? S.targets.fat     + ‘g’ : ‘Not set’;
}

function bindSettingsEvents() {
el(‘editNameSetting’).addEventListener(‘click’, () => {
openInput(‘Display Name’, ‘Your name’, S.user.name, val => {
if (val.trim()) {
S.user.name = val.trim(); save();
updateUserDisplay(); renderSettings();
}
});
});
el(‘editCalGoalSetting’).addEventListener(‘click’, () => {
openInput(‘Calorie Goal’, ‘Daily calories (kcal)’, S.targets.calories || ‘’, val => {
const v = parseInt(val);
if (!isNaN(v) && v > 0) { S.targets.calories = v; save(); renderHome(); renderNutrition(); renderSettings(); }
});
});
el(‘editProteinGoalSetting’).addEventListener(‘click’, () => {
openInput(‘Protein Goal’, ‘Grams per day’, S.targets.protein || ‘’, val => {
const v = parseInt(val);
if (!isNaN(v) && v > 0) { S.targets.protein = v; save(); renderHome(); renderSettings(); }
});
});
el(‘editCarbGoalSetting’).addEventListener(‘click’, () => {
openInput(‘Carb Goal’, ‘Grams per day’, S.targets.carbs || ‘’, val => {
const v = parseInt(val);
if (!isNaN(v) && v >= 0) { S.targets.carbs = v; save(); renderHome(); renderSettings(); }
});
});
el(‘editFatGoalSetting’).addEventListener(‘click’, () => {
openInput(‘Fat Goal’, ‘Grams per day’, S.targets.fat || ‘’, val => {
const v = parseInt(val);
if (!isNaN(v) && v >= 0) { S.targets.fat = v; save(); renderHome(); renderSettings(); }
});
});
el(‘openCalcSettingBtn’).addEventListener(‘click’, () => openModal(‘calcModal’));
el(‘exportDataSetting’).addEventListener(‘click’, () => {
const blob = new Blob([JSON.stringify(S, null, 2)], {type:‘application/json’});
const a = document.createElement(‘a’);
a.href = URL.createObjectURL(blob);
a.download = `dialed-dawg-${new Date().toISOString().split('T')[0]}.json`;
a.click();
});
el(‘clearDataSetting’).addEventListener(‘click’, () => {
if (confirm(‘Reset ALL data? This cannot be undone.’)) {
localStorage.removeItem(‘dd_v2’);
location.reload();
}
});
}

// ─── MACRO HELPER ────────────────────────────

function renderMacroGroup(prot, carb, fat, tgtP, tgtC, tgtF, pFillId, cFillId, fFillId, pValId, cValId, fValId) {
const pct = (val, tgt) => tgt > 0 ? Math.min((val/tgt)*100, 100) : 0;
el(pFillId).style.width = pct(prot, tgtP) + ‘%’;
el(cFillId).style.width = pct(carb, tgtC) + ‘%’;
el(fFillId).style.width = pct(fat,  tgtF) + ‘%’;
el(pValId).textContent  = tgtP > 0 ? `${Math.round(prot)} / ${tgtP}g` : `${Math.round(prot)}g`;
el(cValId).textContent  = tgtC > 0 ? `${Math.round(carb)} / ${tgtC}g` : `${Math.round(carb)}g`;
el(fValId).textContent  = tgtF > 0 ? `${Math.round(fat)}  / ${tgtF}g` : `${Math.round(fat)}g`;
}

// ─── MODALS ──────────────────────────────────

let _inputCb = null;

function bindModals() {
// Generic input
el(‘inputModalSave’).addEventListener(‘click’, () => {
const v = el(‘inputModalField’).value;
closeModal(‘inputModal’);
if (_inputCb) { _inputCb(v); _inputCb = null; }
});
el(‘closeInputModal’).addEventListener(‘click’, () => { closeModal(‘inputModal’); _inputCb = null; });

// Add food
el(‘saveFoodBtn’).addEventListener(‘click’, () => {
const name    = el(‘foodName’).value.trim();
const cals    = parseFloat(el(‘foodCals’).value)    || 0;
const protein = parseFloat(el(‘foodProtein’).value) || 0;
const carbs   = parseFloat(el(‘foodCarbs’).value)   || 0;
const fat     = parseFloat(el(‘foodFat’).value)     || 0;
if (!name) return;
addFood(S._pendingMeal || ‘snacks’, {name, cals, protein, carbs, fat});
[‘foodName’,‘foodCals’,‘foodProtein’,‘foodCarbs’,‘foodFat’].forEach(id => el(id).value = ‘’);
closeModal(‘addFoodModal’);
});
el(‘closeAddFoodModal’).addEventListener(‘click’, () => closeModal(‘addFoodModal’));

// Calorie calculator
el(‘runCalcBtn’).addEventListener(‘click’, runCalc);
el(‘applyCalcBtn’).addEventListener(‘click’, applyCalc);
el(‘closeCalcModal’).addEventListener(‘click’, () => closeModal(‘calcModal’));

// Add peptide
el(‘savePeptideBtn’).addEventListener(‘click’, () => {
const name = el(‘pepName’).value.trim();
const dose = el(‘pepDose’).value.trim();
const freq = el(‘pepFreq’).value.trim();
if (!name || !dose) return;
S.peptides.push({name, dose, freq: freq || ‘Daily’});
save(); renderPeptides();
[‘pepName’,‘pepDose’,‘pepFreq’].forEach(id => el(id).value = ‘’);
closeModal(‘addPeptideModal’);
});
el(‘closeAddPeptideModal’).addEventListener(‘click’, () => closeModal(‘addPeptideModal’));

// Body stats
el(‘saveBodyStatsBtn’).addEventListener(‘click’, () => {
const flds = {
weight:‘bsInputWeight’, bodyFat:‘bsInputBF’,
chest:‘bsInputChest’, waist:‘bsInputWaist’,
arms:‘bsInputArms’, legs:‘bsInputLegs’
};
let any = false;
for (const [key, id] of Object.entries(flds)) {
const v = parseFloat(el(id).value);
if (!isNaN(v) && v > 0) {
S.bodyStats[key] = v;
if (key === ‘weight’) {
S.today.weight = v;
S.weightHistory.push({date: new Date().toDateString(), weight: v});
}
any = true;
}
}
if (any) { save(); renderProgress(); renderHome(); }
[‘bsInputWeight’,‘bsInputBF’,‘bsInputChest’,‘bsInputWaist’,‘bsInputArms’,‘bsInputLegs’].forEach(id => el(id).value = ‘’);
closeModal(‘bodyStatsModal’);
});
el(‘closeBodyStatsModal’).addEventListener(‘click’, () => closeModal(‘bodyStatsModal’));

// Tap overlay backdrop to close
document.querySelectorAll(’.modal-overlay’).forEach(overlay => {
overlay.addEventListener(‘click’, e => {
if (e.target === overlay) closeModal(overlay.id);
});
});
}

function openModal(id)  { el(id).classList.remove(‘hidden’); }
function closeModal(id) { el(id).classList.add(‘hidden’); }

function openInput(title, label, currentVal, cb) {
_inputCb = cb;
el(‘inputModalTitle’).textContent = title;
el(‘inputModalLabel’).textContent = label;
el(‘inputModalField’).value = currentVal !== null && currentVal !== undefined ? currentVal : ‘’;
openModal(‘inputModal’);
setTimeout(() => el(‘inputModalField’).focus(), 80);
}

// ─── CALORIE CALCULATOR ──────────────────────

let _calcResult = {};

function runCalc() {
const age    = parseFloat(el(‘calcAge’).value)    || 25;
const wtLbs  = parseFloat(el(‘calcWeight’).value) || 180;
const htIn   = parseFloat(el(‘calcHeight’).value) || 70;
const gender = el(‘calcGender’).value;
const act    = parseFloat(el(‘calcActivity’).value);
const goal   = el(‘calcGoalSelect’).value;

const wtKg  = wtLbs * 0.453592;
const htCm  = htIn  * 2.54;
const bmr   = gender === ‘male’
? 10*wtKg + 6.25*htCm - 5*age + 5
: 10*wtKg + 6.25*htCm - 5*age - 161;
const maint = Math.round(bmr * act);

let rec   = maint;
let chgTxt = ‘±0 lbs/week’;
if (goal === ‘cut’)  { rec = maint - 500; chgTxt = ‘−1 lb/week’; }
if (goal === ‘bulk’) { rec = maint + 300; chgTxt = ‘+0.6 lbs/week’; }

const protein = Math.round(wtLbs * 1.0);
const fat     = Math.round(rec * 0.25 / 9);
const carbs   = Math.round((rec - protein*4 - fat*9) / 4);

_calcResult = {calories:rec, protein, carbs, fat};

el(‘crMaintain’).textContent  = maint.toLocaleString() + ’ kcal’;
el(‘crRecommend’).textContent = rec.toLocaleString()   + ’ kcal’;
el(‘crChange’).textContent    = chgTxt;
el(‘crProtein’).textContent   = protein + ‘g’;
el(‘crCarbs’).textContent     = carbs   + ‘g’;
el(‘crFat’).textContent       = fat     + ‘g’;
el(‘calcResults’).classList.remove(‘hidden’);
}

function applyCalc() {
Object.assign(S.targets, _calcResult);
save();
closeModal(‘calcModal’);
el(‘calcResults’).classList.add(‘hidden’);
renderHome(); renderNutrition(); renderSettings();
alert(‘Targets applied! 🎯’);
}

// ─── UTILS ───────────────────────────────────

function el(id) { return document.getElementById(id); }
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function vibrate() { if (navigator.vibrate) navigator.vibrate(25); }

function timeAgo(dateStr) {
if (!dateStr) return ‘’;
const diff = Date.now() - new Date(dateStr).getTime();
const days = Math.floor(diff / 864e5);
if (days === 0) return ‘today’;
if (days === 1) return ‘yesterday’;
if (days < 7)  return days + ‘d ago’;
return Math.floor(days/7) + ‘w ago’;
}

// ─── SERVICE WORKER ──────────────────────────

function registerSW() {
if (‘serviceWorker’ in navigator) {
navigator.serviceWorker.register(’./service-worker.js’).catch(() => {});
}
}