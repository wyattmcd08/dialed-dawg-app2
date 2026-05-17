/* ============================================
   DIALED DAWG — script.js
   Zero fake data. Everything earned by logging.
   ============================================ */
'use strict';

const QUOTES = [
  '"The only bad workout is the one that didn\'t happen."',
  '"Iron never lies to you."',
  '"Suffer the pain of discipline or suffer the pain of regret."',
  '"Every rep is a vote for the person you want to become."',
  '"Your body can stand almost anything. It\'s your mind you have to convince."',
  '"Train insane or remain the same."',
  '"Strength doesn\'t come from what you can do — it comes from overcoming what you thought you couldn\'t."',
  '"Don\'t count the days. Make the days count."',
  '"Champions are made from something deep inside them — a desire, a dream, a vision."',
  '"Be proud of every scar on your mind. Each one holds a lesson."'
];

const EXERCISES = [
  {name:'Bench Press',       muscle:'chest'},
  {name:'Incline DB Press',  muscle:'chest'},
  {name:'Decline Press',     muscle:'chest'},
  {name:'Cable Fly',         muscle:'chest'},
  {name:'Dips',              muscle:'chest'},
  {name:'Deadlift',          muscle:'back'},
  {name:'Barbell Row',       muscle:'back'},
  {name:'Pull-Ups',          muscle:'back'},
  {name:'Lat Pulldown',      muscle:'back'},
  {name:'Cable Row',         muscle:'back'},
  {name:'Face Pulls',        muscle:'back'},
  {name:'Squat',             muscle:'legs'},
  {name:'Romanian Deadlift', muscle:'legs'},
  {name:'Leg Press',         muscle:'legs'},
  {name:'Leg Curl',          muscle:'legs'},
  {name:'Leg Extension',     muscle:'legs'},
  {name:'Calf Raises',       muscle:'legs'},
  {name:'OHP',               muscle:'shoulders'},
  {name:'Lateral Raises',    muscle:'shoulders'},
  {name:'DB Shoulder Press', muscle:'shoulders'},
  {name:'Bicep Curls',       muscle:'arms'},
  {name:'Hammer Curls',      muscle:'arms'},
  {name:'Tricep Pushdowns',  muscle:'arms'},
  {name:'Skull Crushers',    muscle:'arms'},
  {name:'Plank',             muscle:'core'},
  {name:'Cable Crunch',      muscle:'core'},
  {name:'Hanging Leg Raise', muscle:'core'}
];

const SPLIT_DEFAULT = {
  name: 'PPL 6-Day',
  days: [
    {day:'MON', name:'Push', exercises:['Bench Press','Incline DB Press','Lateral Raises','Tricep Pushdowns']},
    {day:'TUE', name:'Pull', exercises:['Deadlift','Barbell Row','Pull-Ups','Face Pulls','Bicep Curls']},
    {day:'WED', name:'Legs', exercises:['Squat','Romanian Deadlift','Leg Press','Leg Curl','Calf Raises']},
    {day:'THU', name:'Push', exercises:['OHP','DB Shoulder Press','Lateral Raises','Dips']},
    {day:'FRI', name:'Pull', exercises:['Rack Pull','Cable Row','Lat Pulldown','Hammer Curls']},
    {day:'SAT', name:'Legs', exercises:['Front Squat','Hack Squat','Leg Extension','Nordic Curl']},
    {day:'SUN', name:'Rest', exercises:[]}
  ]
};

const FAVORITES_DEFAULT = [
  {name:'Chicken Breast (100g)', cals:165, protein:31, carbs:0,  fat:3.6},
  {name:'White Rice (100g)',     cals:130, protein:2.7,carbs:28, fat:0.3},
  {name:'Whole Eggs (2)',        cals:140, protein:12, carbs:1,  fat:10},
  {name:'Greek Yogurt (150g)',   cals:88,  protein:15, carbs:5,  fat:0.7},
  {name:'Whey Protein (1 scoop)',cals:120, protein:25, carbs:3,  fat:1.5},
  {name:'Oats (80g)',            cals:304, protein:11, carbs:52, fat:6}
];

// ─── DEFAULT STATE ────────────────────────────

function freshToday() {
  return {
    date: new Date().toDateString(),
    caloriesEaten:  0,
    caloriesBurned: 0,
    protein: 0,
    carbs:   0,
    fat:     0,
    water:   0,
    sleep:   null,
    weight:  null,
    checklist: {},
    meals: {breakfast:[], lunch:[], dinner:[], snacks:[]}
  };
}

function buildDefault() {
  return {
    user:            {name:'Athlete'},
    targets:         {calories:0, protein:0, carbs:0, fat:0, water:8},
    today:           freshToday(),
    streak:          0,
    bestStreak:      0,
    prs:             {bench:null, squat:null, deadlift:null},
    prMap:           {},
    bodyStats:       {weight:null, bodyFat:null, chest:null, waist:null, arms:null, legs:null},
    muscleFatigue:   {chest:100, back:100, legs:100, shoulders:100, arms:100, core:100},
    weightHistory:   [],
    strengthHistory: {},
    peptides:        [],
    injectionLog:    {},
    workoutLog:      {},
    split:           SPLIT_DEFAULT,
    favorites:       FAVORITES_DEFAULT
  };
}

// ─── STATE & STORAGE ──────────────────────────

var S = {};

function save() {
  try { localStorage.setItem('dd_v2', JSON.stringify(S)); }
  catch(e) { console.warn('Storage error', e); }
}

function load() {
  try {
    var raw = localStorage.getItem('dd_v2');
    if (raw) {
      S = deepMerge(buildDefault(), JSON.parse(raw));
    } else {
      S = buildDefault();
    }
  } catch(e) {
    S = buildDefault();
  }
  var today = new Date().toDateString();
  if (S.today.date !== today) {
    tickRecovery();
    S.today = freshToday();
    save();
  }
}

function deepMerge(def, saved) {
  var out = Object.assign({}, def);
  for (var key in saved) {
    if (saved[key] !== null && typeof saved[key] === 'object' && !Array.isArray(saved[key]) &&
        def[key] !== null && typeof def[key] === 'object' && !Array.isArray(def[key])) {
      out[key] = deepMerge(def[key], saved[key]);
    } else {
      out[key] = saved[key];
    }
  }
  return out;
}

function tickRecovery() {
  Object.keys(S.muscleFatigue).forEach(function(m) {
    S.muscleFatigue[m] = Math.min(100, (S.muscleFatigue[m] || 100) + 15);
  });
}

// ─── INIT ─────────────────────────────────────

function showApp() {
  var splash = document.getElementById('splash');
  var app    = document.getElementById('app');
  if (splash) splash.style.display = 'none';
  if (app)    { app.style.display = 'flex'; app.classList.remove('hidden'); }
}

document.addEventListener('DOMContentLoaded', function() {
  try { load(); } catch(e) { console.error('Load error:', e); }

  setTimeout(function() {
    showApp();
    try { boot(); } catch(e) { console.error('Boot error:', e); }
  }, 1200);
});

// Failsafe: show app no matter what after 3s
window.addEventListener('load', function() {
  setTimeout(showApp, 3000);
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

// ─── NAVIGATION ───────────────────────────────

function bindNav() {
  document.querySelectorAll('.nav-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { navigateTo(btn.dataset.page); });
  });
  var av = document.getElementById('avatarCircle');
  if (av) av.addEventListener('click', function() { navigateTo('settings'); });
}

function navigateTo(pageId) {
  document.querySelectorAll('.nav-btn').forEach(function(b) {
    b.classList.toggle('active', b.dataset.page === pageId);
  });
  document.querySelectorAll('.page').forEach(function(p) {
    p.classList.toggle('active', p.id === 'page-' + pageId);
  });
}

// ─── GREETING ─────────────────────────────────

function setGreeting() {
  var h = new Date().getHours();
  var g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  var el = document.getElementById('greeting');
  if (el) el.textContent = g;
}

function updateUserDisplay() {
  var n = S.user.name || 'Athlete';
  setText('userName',       n.toUpperCase());
  setText('avatarCircle',   n[0].toUpperCase());
  setText('settingsAvatar', n[0].toUpperCase());
  setText('settingsName',   n);
  setText('siName',         n);
}

// ─── HOME ─────────────────────────────────────

function renderHome() {
  setText('dailyQuote', QUOTES[new Date().getDay() % QUOTES.length]);

  var cGoal  = S.targets.calories;
  var eaten  = S.today.caloriesEaten;
  var burned = S.today.caloriesBurned;
  var left   = cGoal > 0 ? Math.max(0, cGoal - eaten + burned) : null;

  setText('calGoal',      cGoal > 0 ? cGoal.toLocaleString() : 'Not set');
  setText('calEaten',     eaten.toLocaleString());
  setText('calBurned',    burned.toLocaleString());
  setText('calRemaining', left !== null ? left.toLocaleString() : '—');

  var circ = 326.7;
  var pct  = (cGoal > 0 && eaten > 0) ? Math.min(eaten / cGoal, 1) : 0;
  var ring = document.getElementById('calRingCircle');
  if (ring) ring.style.strokeDashoffset = circ - pct * circ;

  renderMacroGroup(
    S.today.protein, S.today.carbs, S.today.fat,
    S.targets.protein, S.targets.carbs, S.targets.fat,
    'protFill','carbFill','fatFill','protVal','carbVal','fatVal'
  );

  setText('waterVal',  S.today.water > 0 ? S.today.water + ' cups' : '—');
  setText('sleepVal',  S.today.sleep  != null ? S.today.sleep + 'h' : '—');
  setText('streakVal', S.streak);
  setText('weightVal', S.today.weight != null ? S.today.weight + ' lb' : '—');

  var dayMap = {0:'SUN',1:'MON',2:'TUE',3:'WED',4:'THU',5:'FRI',6:'SAT'};
  var todayKey = dayMap[new Date().getDay()];
  var splitDay = S.split.days.find(function(d) { return d.day === todayKey; }) || S.split.days[0];
  setText('todayWorkoutBadge', splitDay.name.toUpperCase());
  setText('todayWorkoutName',  splitDay.name !== 'Rest' ? splitDay.name + ' Day' : 'Rest Day');
  var wList = document.getElementById('todayWorkoutList');
  if (wList) {
    wList.innerHTML = splitDay.exercises.length
      ? splitDay.exercises.slice(0,4).map(function(ex) {
          return '<div class="wt-row"><span>' + ex + '</span><span class="wt-sets">4 × 8</span></div>';
        }).join('')
      : '<div class="wt-row" style="color:var(--sub)">Rest — stretch and recover</div>';
  }

  var rec = calcOverallRecovery();
  var hasWorkouts = Object.keys(S.workoutLog).length > 0;
  if (hasWorkouts) {
    setText('recoveryScore', rec);
    var bar = document.getElementById('recoveryBar');
    if (bar) { bar.style.width = rec + '%'; bar.style.background = recoveryColor(rec); }
    setText('recoveryStatus', recoveryLabel(rec));
  } else {
    setText('recoveryScore',  '—');
    var bar2 = document.getElementById('recoveryBar');
    if (bar2) bar2.style.width = '0%';
    setText('recoveryStatus', 'Log a workout to track recovery');
  }

  var prList = document.getElementById('homePRList');
  if (prList) {
    var prEntries = Object.entries(S.prMap);
    if (prEntries.length === 0) {
      prList.innerHTML = '<div class="empty-state"><div class="es-text">No PRs yet. Finish a workout to set records.</div></div>';
    } else {
      prList.innerHTML = prEntries.slice(-5).reverse().map(function(e) {
        return '<div class="pr-item"><span class="pr-ex">' + e[0] + '</span><span class="pr-val">' + e[1].weight + ' lbs × ' + e[1].reps + '</span><span class="pr-when">' + timeAgo(e[1].date) + '</span></div>';
      }).join('');
    }
  }

  document.querySelectorAll('.check-inp').forEach(function(c) {
    c.checked = !!(S.today.checklist[c.dataset.key]);
  });
}

function bindHomeEvents() {
  document.querySelectorAll('.check-inp').forEach(function(inp) {
    inp.addEventListener('change', function() {
      S.today.checklist[inp.dataset.key] = inp.checked;
      save();
    });
  });

  on('quickAddMeal', 'click', function() {
    S._pendingMeal = 'breakfast';
    openModal('addFoodModal');
    renderFavorites();
  });

  on('quickAddWater', 'click', function() {
    if (S.today.water < 20) {
      S.today.water++;
      save(); renderHome(); renderNutrition();
    }
  });

  on('quickAddWeight', 'click', function() {
    openInput('Log Body Weight', 'Weight in lbs', '', function(val) {
      var w = parseFloat(val);
      if (!isNaN(w) && w > 0) {
        S.today.weight = w;
        S.bodyStats.weight = w;
        S.weightHistory.push({date: new Date().toDateString(), weight: w});
        save(); renderHome(); renderProgress();
      }
    });
  });

  on('startWorkoutBtn', 'click', function() {
    var dayMap = {0:'SUN',1:'MON',2:'TUE',3:'WED',4:'THU',5:'FRI',6:'SAT'};
    var todayKey = dayMap[new Date().getDay()];
    var splitDay = S.split.days.find(function(d) { return d.day === todayKey; }) || S.split.days[0];
    if (splitDay.name === 'Rest' || splitDay.exercises.length === 0) {
      alert('Today is a rest day! Enjoy the recovery 🔄');
      return;
    }
    navigateTo('workout');
    startWorkout(splitDay);
  });

  on('qsWater', 'click', function() {
    openInput('Log Water', 'Cups of water today', S.today.water || '', function(val) {
      var w = parseInt(val);
      if (!isNaN(w) && w >= 0) { S.today.water = w; save(); renderHome(); renderNutrition(); }
    });
  });
  on('qsSleep', 'click', function() {
    openInput('Log Sleep', 'Hours of sleep', S.today.sleep || '', function(val) {
      var s = parseFloat(val);
      if (!isNaN(s) && s >= 0) { S.today.sleep = s; save(); renderHome(); }
    });
  });
  on('qsWeight', 'click', function() {
    openInput('Log Body Weight', 'Weight in lbs', S.today.weight || '', function(val) {
      var w = parseFloat(val);
      if (!isNaN(w) && w > 0) {
        S.today.weight = w; S.bodyStats.weight = w;
        S.weightHistory.push({date: new Date().toDateString(), weight: w});
        save(); renderHome(); renderProgress();
      }
    });
  });
}

// ─── WORKOUT ──────────────────────────────────

var _wTimer = null;
var _wElapsed = 0;

function renderWorkout() {
  setText('splitNameLabel', S.split.name);
  var cont = document.getElementById('splitDays');
  if (!cont) return;
  cont.innerHTML = S.split.days.map(function(d, i) {
    return '<div class="split-day" data-idx="' + i + '">' +
      '<span class="sd-day">' + d.day + '</span>' +
      '<span class="sd-name">' + d.name + '</span>' +
      '<span class="sd-meta">' + (d.exercises.length > 0 ? d.exercises.length + ' exercises' : 'REST') + '</span>' +
      '</div>';
  }).join('');
  cont.querySelectorAll('.split-day').forEach(function(row) {
    row.addEventListener('click', function() {
      var d = S.split.days[parseInt(row.dataset.idx)];
      if (d.exercises.length > 0) startWorkout(d);
    });
  });
  renderExList('all');
}

function renderExList(muscle) {
  var searchEl = document.getElementById('exerciseSearch');
  var search = searchEl ? searchEl.value.toLowerCase() : '';
  var list = document.getElementById('exerciseList');
  if (!list) return;
  var filtered = EXERCISES.filter(function(ex) {
    return (muscle === 'all' || ex.muscle === muscle) &&
           (!search || ex.name.toLowerCase().includes(search));
  });
  list.innerHTML = filtered.map(function(ex) {
    return '<div class="ex-item" data-name="' + ex.name + '" data-muscle="' + ex.muscle + '">' +
      '<div><div class="ex-name">' + ex.name + '</div><div class="ex-muscle">' + cap(ex.muscle) + '</div></div>' +
      '<span class="ex-add">＋</span></div>';
  }).join('');
  list.querySelectorAll('.ex-item').forEach(function(item) {
    item.addEventListener('click', function() {
      if (S._activeWorkout) {
        addExToWorkout(item.dataset.name);
        var ov = document.getElementById('activeWorkoutOverlay');
        if (ov) ov.classList.remove('hidden');
      }
    });
  });
}

function bindWorkoutEvents() {
  var es = document.getElementById('exerciseSearch');
  if (es) es.addEventListener('input', function() {
    var active = document.querySelector('.chip.active');
    renderExList(active ? active.dataset.muscle : 'all');
  });

  var mf = document.getElementById('muscleFilter');
  if (mf) mf.addEventListener('click', function(e) {
    var chip = e.target.closest('.chip');
    if (!chip) return;
    document.querySelectorAll('.chip').forEach(function(c) { c.classList.remove('active'); });
    chip.classList.add('active');
    renderExList(chip.dataset.muscle);
  });

  on('finishWorkoutBtn', 'click', finishWorkout);
  on('addExToWorkout', 'click', function() {
    var ov = document.getElementById('activeWorkoutOverlay');
    if (ov) ov.classList.add('hidden');
  });
}

function startWorkout(splitDay) {
  S._activeWorkout = {
    name: splitDay.name.toUpperCase() + ' DAY',
    splitName: splitDay.name,
    exercises: splitDay.exercises.map(function(name) {
      return {
        name: name,
        sets: [
          {weight:'', reps:'', done:false},
          {weight:'', reps:'', done:false},
          {weight:'', reps:'', done:false},
          {weight:'', reps:'', done:false}
        ]
      };
    })
  };
  _wElapsed = 0;
  setText('awTitle', S._activeWorkout.name);
  setText('awTimer', '00:00');
  var ov = document.getElementById('activeWorkoutOverlay');
  if (ov) ov.classList.remove('hidden');
  renderActiveWorkout();
  if (_wTimer) clearInterval(_wTimer);
  _wTimer = setInterval(function() {
    _wElapsed++;
    var m = Math.floor(_wElapsed/60).toString().padStart(2,'0');
    var s = (_wElapsed%60).toString().padStart(2,'0');
    setText('awTimer', m + ':' + s);
  }, 1000);
}

function renderActiveWorkout() {
  var cont = document.getElementById('awExercises');
  if (!cont || !S._activeWorkout) return;
  cont.innerHTML = S._activeWorkout.exercises.map(function(ex, eIdx) {
    return '<div class="aw-ex-card">' +
      '<div class="aw-ex-name">' + ex.name + '</div>' +
      ex.sets.map(function(set, sIdx) {
        return '<div class="aw-set-row">' +
          '<span class="aw-set-num">' + (sIdx+1) + '</span>' +
          '<input class="aw-inp" type="number" placeholder="lbs" value="' + set.weight + '" data-e="' + eIdx + '" data-s="' + sIdx + '" data-f="weight" inputmode="decimal"/>' +
          '<input class="aw-inp" type="number" placeholder="reps" value="' + set.reps + '" data-e="' + eIdx + '" data-s="' + sIdx + '" data-f="reps" inputmode="decimal"/>' +
          '<div class="aw-done ' + (set.done ? 'done' : '') + '" data-e="' + eIdx + '" data-s="' + sIdx + '">' + (set.done ? '✓' : '') + '</div>' +
          '</div>';
      }).join('') +
      '<button class="aw-add-set" data-e="' + eIdx + '">+ Add Set</button>' +
      '</div>';
  }).join('');

  cont.querySelectorAll('.aw-inp').forEach(function(inp) {
    inp.addEventListener('change', function() {
      S._activeWorkout.exercises[+inp.dataset.e].sets[+inp.dataset.s][inp.dataset.f] = inp.value;
    });
  });
  cont.querySelectorAll('.aw-done').forEach(function(btn) {
    btn.addEventListener('click', function() {
      S._activeWorkout.exercises[+btn.dataset.e].sets[+btn.dataset.s].done =
        !S._activeWorkout.exercises[+btn.dataset.e].sets[+btn.dataset.s].done;
      renderActiveWorkout();
      vibrate();
    });
  });
  cont.querySelectorAll('.aw-add-set').forEach(function(btn) {
    btn.addEventListener('click', function() {
      S._activeWorkout.exercises[+btn.dataset.e].sets.push({weight:'', reps:'', done:false});
      renderActiveWorkout();
    });
  });
}

function addExToWorkout(name) {
  if (!S._activeWorkout) return;
  S._activeWorkout.exercises.push({
    name: name,
    sets: [{weight:'',reps:'',done:false},{weight:'',reps:'',done:false},{weight:'',reps:'',done:false}]
  });
  renderActiveWorkout();
}

function finishWorkout() {
  if (_wTimer) { clearInterval(_wTimer); _wTimer = null; }
  if (!S._activeWorkout) return;

  var w = S._activeWorkout;
  var today = new Date().toDateString();

  w.exercises.forEach(function(ex) {
    ex.sets.forEach(function(set) {
      var wt = parseFloat(set.weight);
      var r  = parseInt(set.reps);
      if (!isNaN(wt) && !isNaN(r) && wt > 0 && r > 0) {
        var existing = S.prMap[ex.name];
        if (!existing || wt > existing.weight || (wt === existing.weight && r > existing.reps)) {
          S.prMap[ex.name] = {weight: wt, reps: r, date: today};
        }
        if (ex.name === 'Bench Press' && (!S.prs.bench || wt >= S.prs.bench.weight))
          S.prs.bench = {weight:wt, reps:r};
        if (ex.name === 'Squat' && (!S.prs.squat || wt >= S.prs.squat.weight))
          S.prs.squat = {weight:wt, reps:r};
        if (ex.name === 'Deadlift' && (!S.prs.deadlift || wt >= S.prs.deadlift.weight))
          S.prs.deadlift = {weight:wt, reps:r};

        if (!S.strengthHistory[ex.name]) S.strengthHistory[ex.name] = [];
        var last = S.strengthHistory[ex.name].slice(-1)[0];
        if (!last || last.weight !== wt || last.date !== today) {
          S.strengthHistory[ex.name].push({date: today, weight: wt, reps: r});
          if (S.strengthHistory[ex.name].length > 20) S.strengthHistory[ex.name].shift();
        }
      }
    });
  });

  S.workoutLog[today] = {name: w.splitName, durationSec: _wElapsed};
  S.today.checklist.workout = true;

  var yesterday = new Date(Date.now() - 864e5).toDateString();
  S.streak = (S.workoutLog[yesterday] || S.streak === 0) ? S.streak + 1 : 1;
  if (S.streak > S.bestStreak) S.bestStreak = S.streak;

  var muscleMap = {Push:['chest','shoulders','arms'], Pull:['back','arms'], Legs:['legs','core'], Rest:[]};
  var muscles = muscleMap[w.splitName] || [];
  muscles.forEach(function(m) {
    S.muscleFatigue[m] = Math.max(0, (S.muscleFatigue[m] || 100) - 35);
  });

  S._activeWorkout = null;
  save();
  var ov = document.getElementById('activeWorkoutOverlay');
  if (ov) ov.classList.add('hidden');
  renderHome(); renderProgress(); renderRecovery(); renderCalendar();
  alert('Workout done! 💪 Great session.');
}

// ─── PROGRESS ─────────────────────────────────

function renderProgress() {
  function showPR(id, estId, pr) {
    if (pr) {
      setText(id, pr.weight + ' lbs');
      setText(estId, 'Est. 1RM: ' + Math.round(pr.weight * (1 + pr.reps / 30)) + ' lbs');
    } else {
      setText(id, '—'); setText(estId, '');
    }
  }
  showPR('pr-bench',    'pr-bench-est',    S.prs.bench);
  showPR('pr-squat',    'pr-squat-est',    S.prs.squat);
  showPR('pr-deadlift', 'pr-deadlift-est', S.prs.deadlift);

  var bs = S.bodyStats;
  setText('bsWeight', bs.weight   != null ? bs.weight   + ' lbs' : '—');
  setText('bsBF',     bs.bodyFat  != null ? bs.bodyFat  + '%'    : '—');
  setText('bsChest',  bs.chest    != null ? bs.chest    + '"'    : '—');
  setText('bsWaist',  bs.waist    != null ? bs.waist    + '"'    : '—');
  setText('bsArms',   bs.arms     != null ? bs.arms     + '"'    : '—');
  setText('bsLegs',   bs.legs     != null ? bs.legs     + '"'    : '—');

  drawWeightChart();

  var sl = document.getElementById('strengthList');
  if (!sl) return;
  var entries = Object.entries(S.strengthHistory);
  if (entries.length === 0) {
    sl.innerHTML = '<div class="empty-state"><div class="es-text">Complete workouts to track strength progress.</div></div>';
  } else {
    var maxW = Math.max.apply(null, entries.map(function(e) { return e[1][e[1].length-1] ? e[1][e[1].length-1].weight : 0; }));
    sl.innerHTML = entries.map(function(e) {
      var name    = e[0];
      var history = e[1];
      var cur  = history[history.length-1] ? history[history.length-1].weight : 0;
      var prev = history[history.length-2] ? history[history.length-2].weight : cur;
      var diff = cur - prev;
      var pct  = maxW ? (cur/maxW)*100 : 0;
      return '<div class="strength-item"><div class="si-top"><span class="si-name">' + name + '</span>' +
        '<span class="si-pr">' + cur + ' lbs' + (diff > 0 ? ' <span style="color:var(--green);font-size:10px">+' + diff + '</span>' : '') + '</span></div>' +
        '<div class="si-bar"><div class="si-fill" style="width:' + pct + '%"></div></div></div>';
    }).join('');
  }
}

function drawWeightChart() {
  var canvas  = document.getElementById('weightChart');
  var emptyEl = document.getElementById('weightChartEmpty');
  if (!canvas) return;
  var data = S.weightHistory.slice(-16);
  if (data.length < 2) {
    canvas.style.display = 'none';
    if (emptyEl) emptyEl.classList.remove('hidden');
    return;
  }
  canvas.style.display = 'block';
  if (emptyEl) emptyEl.classList.add('hidden');

  var dpr = window.devicePixelRatio || 1;
  var w   = canvas.parentElement.offsetWidth || 300;
  var h   = 120;
  canvas.width  = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width  = w + 'px';
  canvas.style.height = h + 'px';

  var ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  var weights = data.map(function(d) { return d.weight; });
  var minW = Math.min.apply(null, weights) - 2;
  var maxW = Math.max.apply(null, weights) + 2;
  var pL=8, pR=8, pT=8, pB=20;
  var cw = w - pL - pR;
  var ch = h - pT - pB;
  var xStep = cw / (data.length - 1);
  function yOf(v) { return pT + ch - ((v - minW) / (maxW - minW)) * ch; }

  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = '#1e1e1e'; ctx.lineWidth = 1;
  for (var i=0; i<=3; i++) {
    var y = pT + (ch/3)*i;
    ctx.beginPath(); ctx.moveTo(pL, y); ctx.lineTo(w-pR, y); ctx.stroke();
  }

  var grad = ctx.createLinearGradient(0, pT, 0, pT+ch);
  grad.addColorStop(0, 'rgba(200,16,46,0.25)');
  grad.addColorStop(1, 'rgba(200,16,46,0)');
  ctx.beginPath();
  data.forEach(function(d, i) {
    var x = pL + i*xStep, yy = yOf(d.weight);
    i === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
  });
  ctx.lineTo(pL + (data.length-1)*xStep, pT+ch);
  ctx.lineTo(pL, pT+ch);
  ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();

  ctx.beginPath(); ctx.strokeStyle='#c8102e'; ctx.lineWidth=2; ctx.lineJoin='round';
  data.forEach(function(d, i) {
    var x = pL + i*xStep, yy = yOf(d.weight);
    i === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
  });
  ctx.stroke();

  data.forEach(function(d, i) {
    var x = pL + i*xStep, yy = yOf(d.weight);
    ctx.beginPath(); ctx.arc(x, yy, 3, 0, Math.PI*2);
    ctx.fillStyle = '#c8102e'; ctx.fill();
    if (i === 0 || i === data.length-1 || i === Math.floor(data.length/2)) {
      ctx.fillStyle = '#555'; ctx.font = '10px Barlow,sans-serif';
      ctx.textAlign = 'center'; ctx.fillText(d.weight + 'lb', x, h-5);
    }
  });
}

function bindProgressEvents() {
  on('logBodyStatsBtn', 'click', function() { openModal('bodyStatsModal'); });
  on('addPhotoBtn', 'click', function() {
    var inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = function(e) {
      var file = e.target.files[0]; if (!file) return;
      var reader = new FileReader();
      reader.onload = function(ev) {
        var gal = document.getElementById('photoGallery');
        if (!gal) return;
        gal.innerHTML = '';
        var img = document.createElement('img');
        img.src = ev.target.result;
        gal.appendChild(img);
      };
      reader.readAsDataURL(file);
    };
    inp.click();
  });
}

// ─── NUTRITION ────────────────────────────────

function renderNutrition() {
  var t    = S.today;
  var tgt  = S.targets;
  var goal = tgt.calories;
  var left = goal > 0 ? Math.max(0, goal - t.caloriesEaten) : null;

  setText('nCalEaten', Math.round(t.caloriesEaten).toLocaleString());
  setText('nCalLeft',  left !== null ? left.toLocaleString() : '—');
  setText('nCalGoal',  goal > 0 ? goal.toLocaleString() : '—');

  var pf = document.getElementById('nutrProgFill');
  if (pf) pf.style.width = (goal > 0 ? Math.min((t.caloriesEaten/goal)*100, 100) : 0) + '%';

  renderMacroGroup(t.protein, t.carbs, t.fat, tgt.protein, tgt.carbs, tgt.fat,
    'nProtFill','nCarbFill','nFatFill','nProtVal','nCarbVal','nFatVal');

  ['breakfast','lunch','dinner','snacks'].forEach(function(meal) {
    var foods = t.meals[meal] || [];
    var total = foods.reduce(function(s,f) { return s + (f.cals||0); }, 0);
    setText('cals-' + meal, total > 0 ? total + ' kcal' : '0 kcal');
    var cont = document.getElementById('foods-' + meal);
    if (!cont) return;
    cont.innerHTML = foods.map(function(f, i) {
      return '<div class="food-entry">' +
        '<span class="fe-name">' + f.name + '</span>' +
        '<span class="fe-macro">' + f.protein + 'p · ' + f.carbs + 'c · ' + f.fat + 'f</span>' +
        '<span class="fe-cal">' + f.cals + '</span>' +
        '<button class="fe-del" data-meal="' + meal + '" data-i="' + i + '">✕</button>' +
        '</div>';
    }).join('');
    cont.querySelectorAll('.fe-del').forEach(function(btn) {
      btn.addEventListener('click', function() { removeFood(btn.dataset.meal, +btn.dataset.i); });
    });
  });

  var cups = document.getElementById('waterCups');
  var goal8 = S.targets.water || 8;
  if (cups) {
    cups.innerHTML = Array.from({length: goal8}, function(_, i) {
      return '<div class="water-cup ' + (i < t.water ? 'filled' : '') + '" data-i="' + i + '">' +
        (i < t.water ? '💧' : '') + '</div>';
    }).join('');
    cups.querySelectorAll('.water-cup').forEach(function(cup) {
      cup.addEventListener('click', function() {
        var i = +cup.dataset.i;
        S.today.water = i < S.today.water ? i : i+1;
        save(); renderNutrition(); renderHome();
      });
    });
  }
  setText('waterGoalText', t.water + ' / ' + goal8 + ' cups');
}

function removeFood(meal, idx) {
  var f = S.today.meals[meal][idx];
  S.today.caloriesEaten -= f.cals    || 0;
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
  on('openCalcBtn', 'click', function() { openModal('calcModal'); });
  document.querySelectorAll('.meal-add').forEach(function(btn) {
    btn.addEventListener('click', function() {
      S._pendingMeal = btn.dataset.meal;
      openModal('addFoodModal');
      renderFavorites();
    });
  });
}

function renderFavorites() {
  var fl = document.getElementById('favoritesList');
  if (!fl) return;
  fl.innerHTML = S.favorites.map(function(f, i) {
    return '<div class="fav-item" data-i="' + i + '"><span>' + f.name + '</span><span class="fav-cal">' + f.cals + ' kcal</span></div>';
  }).join('');
  fl.querySelectorAll('.fav-item').forEach(function(item) {
    item.addEventListener('click', function() {
      var f = S.favorites[+item.dataset.i];
      addFood(S._pendingMeal || 'snacks', Object.assign({}, f));
      closeModal('addFoodModal');
    });
  });
}

// ─── RECOVERY ─────────────────────────────────

function calcOverallRecovery() {
  var vals = Object.values(S.muscleFatigue);
  return Math.round(vals.reduce(function(a,b) { return a+b; }, 0) / vals.length);
}

function recoveryColor(score) {
  if (score >= 75) return 'var(--green)';
  if (score >= 45) return 'var(--yellow)';
  return 'var(--red)';
}

function recoveryLabel(score) {
  if (score >= 85) return 'Fully recovered — ready to crush it';
  if (score >= 70) return 'Good — train with intensity';
  if (score >= 50) return 'Moderate — manage your volume today';
  if (score >= 30) return 'Fatigued — light work only';
  return 'Overtrained — prioritize rest today';
}

function renderRecovery() {
  var overall = calcOverallRecovery();
  var hasData = Object.keys(S.workoutLog).length > 0;

  if (hasData) {
    setText('rhScore',  overall);
    setText('rhStatus', recoveryLabel(overall));
  } else {
    setText('rhScore',  '—');
    setText('rhStatus', 'Log a workout to track recovery');
  }

  document.querySelectorAll('.mz').forEach(function(zone) {
    var pct = S.muscleFatigue[zone.dataset.muscle] || 100;
    zone.classList.remove('fresh','moderate','fatigued');
    if (pct >= 75)      zone.classList.add('fresh');
    else if (pct >= 40) zone.classList.add('moderate');
    else                zone.classList.add('fatigued');
  });

  var list = document.getElementById('muscleRecoveryList');
  var muscles = ['Chest','Back','Legs','Shoulders','Arms','Core'];
  if (list) {
    list.innerHTML = muscles.map(function(m) {
      var pct = S.muscleFatigue[m.toLowerCase()] || 100;
      var col = pct >= 75 ? 'var(--green)' : pct >= 40 ? 'var(--yellow)' : 'var(--red)';
      return '<div class="mrl-item">' +
        '<div class="mrl-dot" style="background:' + col + '"></div>' +
        '<span class="mrl-name">' + m + '</span>' +
        '<div class="mrl-bar"><div class="mrl-fill" style="width:' + pct + '%;background:' + col + '"></div></div>' +
        '<span class="mrl-pct" style="color:' + col + '">' + pct + '%</span>' +
        '</div>';
    }).join('');
  }

  var recs = document.getElementById('recoveryRecs');
  if (recs) {
    recs.innerHTML = muscles.map(function(m) {
      var pct = S.muscleFatigue[m.toLowerCase()] || 100;
      if (!hasData) return '<div class="rec-item y">📋 ' + m + ' — log a workout to track fatigue</div>';
      if (pct >= 75) return '<div class="rec-item g">✅ ' + m + ' fully recovered — great day for ' + m.toLowerCase() + ' work</div>';
      if (pct >= 40) return '<div class="rec-item y">⚠️ ' + m + ' at ' + pct + '% — moderate volume recommended</div>';
      return '<div class="rec-item r">🚫 ' + m + ' fatigued — rest or light work only</div>';
    }).join('');
  }
}

function bindRecoveryEvents() {}

// ─── CALENDAR ─────────────────────────────────

var _calDate = new Date();

function renderCalendar() {
  setText('calStreak',     S.streak);
  setText('calBestStreak', S.bestStreak);
  renderCalMonth();
}

function renderCalMonth() {
  var year  = _calDate.getFullYear();
  var month = _calDate.getMonth();
  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  setText('calMonthLabel', MONTHS[month] + ' ' + year);

  var firstDow  = new Date(year, month, 1).getDay();
  var daysInMon = new Date(year, month+1, 0).getDate();
  var today     = new Date();
  var todayStr  = today.toDateString();

  var workoutsThisMonth = 0;
  var restThisMonth = 0;
  for (var d=1; d<=daysInMon; d++) {
    var dateObj = new Date(year, month, d);
    if (dateObj > today) break;
    var dateStr = dateObj.toDateString();
    if (S.workoutLog[dateStr]) workoutsThisMonth++;
    else if (dateStr !== todayStr) restThisMonth++;
  }

  var daysSoFar = (today.getMonth() === month && today.getFullYear() === year) ? today.getDate() : daysInMon;
  var consistency = daysSoFar > 0 ? Math.round((workoutsThisMonth / daysSoFar) * 100) + '%' : '—';

  setText('calConsistency', consistency);
  setText('msWorkouts',  workoutsThisMonth);
  setText('msRestDays',  restThisMonth);
  setText('msConsist',   consistency);

  var html = '';
  for (var i=0; i<firstDow; i++) html += '<div class="cal-cell empty"></div>';
  for (var d=1; d<=daysInMon; d++) {
    var dateObj = new Date(year, month, d);
    var dateStr = dateObj.toDateString();
    var isToday = dateStr === todayStr;
    var cls = '';
    if (S.workoutLog[dateStr]) cls = 'workout';
    else if (dateObj < today && !isToday) cls = 'rest';
    html += '<div class="cal-cell ' + cls + ' ' + (isToday ? 'today' : '') + '">' + d + '</div>';
  }
  var grid = document.getElementById('calGrid');
  if (grid) grid.innerHTML = html;
}

function bindCalendarEvents() {
  on('calPrev', 'click', function() { _calDate.setMonth(_calDate.getMonth()-1); renderCalendar(); });
  on('calNext', 'click', function() { _calDate.setMonth(_calDate.getMonth()+1); renderCalendar(); });
}

// ─── PEPTIDES ─────────────────────────────────

function renderPeptides() {
  var stack = document.getElementById('peptideStack');
  if (!stack) return;
  if (S.peptides.length === 0) {
    stack.innerHTML = '<div class="empty-state"><div class="es-text">No peptides added yet. Tap + ADD.</div></div>';
  } else {
    stack.innerHTML = S.peptides.map(function(p, i) {
      return '<div class="pep-item">' +
        '<div><div class="pep-name">' + p.name + '</div><div class="pep-freq">' + p.freq + '</div></div>' +
        '<span class="pep-dose">' + p.dose + '</span>' +
        '<button class="pep-del" data-i="' + i + '">✕</button>' +
        '</div>';
    }).join('');
    stack.querySelectorAll('.pep-del').forEach(function(btn) {
      btn.addEventListener('click', function() {
        S.peptides.splice(+btn.dataset.i, 1);
        save(); renderPeptides();
      });
    });
  }
  renderInjSchedule();
}

function renderInjSchedule() {
  var sched = document.getElementById('injSchedule');
  if (!sched) return;
  if (S.peptides.length === 0) {
    sched.innerHTML = '<div class="empty-state"><div class="es-text">Add peptides to see your schedule.</div></div>';
    return;
  }
  var today = new Date().toDateString();
  sched.innerHTML = S.peptides.map(function(p, pi) {
    var key  = today + '-' + pi;
    var done = S.injectionLog[key];
    return '<div class="inj-item">' +
      '<span class="inj-day">' + p.freq.slice(0,3).toUpperCase() + '</span>' +
      '<span class="inj-name">' + p.name + '</span>' +
      '<span class="inj-dose">' + p.dose + '</span>' +
      '<div class="inj-check ' + (done ? 'done' : '') + '" data-key="' + key + '">' + (done ? '✓' : '') + '</div>' +
      '</div>';
  }).join('');
  sched.querySelectorAll('.inj-check').forEach(function(btn) {
    btn.addEventListener('click', function() {
      S.injectionLog[btn.dataset.key] = !S.injectionLog[btn.dataset.key];
      save(); renderInjSchedule(); vibrate();
    });
  });
}

function bindPeptideEvents() {
  on('addPeptideBtn', 'click', function() { openModal('addPeptideModal'); });
  on('calcReconBtn',  'click', calcRecon);
}

function calcRecon() {
  var vialMg    = parseFloat(g('vialSize').value);
  var bacMl     = parseFloat(g('bacWater').value);
  var doseMcg   = parseFloat(g('desiredDose').value);
  var syringeIU = parseInt(g('syringeUnits').value);
  if (isNaN(vialMg) || isNaN(bacMl) || isNaN(doseMcg)) return;
  var concMcgMl = (vialMg*1000) / bacMl;
  var doseVolMl = doseMcg / concMcgMl;
  var drawIU    = Math.round(doseVolMl / (1/syringeIU));
  setText('rrUnits', drawIU);
  setText('rrml',    doseVolMl.toFixed(3) + ' ml');
  setText('rrConc',  'Concentration: ' + concMcgMl.toFixed(1) + ' mcg/ml');
  var rr = document.getElementById('reconResult');
  if (rr) rr.classList.remove('hidden');
}

// ─── SETTINGS ─────────────────────────────────

function renderSettings() {
  var n = S.user.name || 'Athlete';
  setText('settingsAvatar',  n[0].toUpperCase());
  setText('settingsName',    n);
  setText('siName',          n);
  setText('siCalGoal',       S.targets.calories > 0 ? S.targets.calories.toLocaleString() + ' kcal' : 'Not set');
  setText('siProteinGoal',   S.targets.protein  > 0 ? S.targets.protein + 'g' : 'Not set');
  setText('siCarbGoal',      S.targets.carbs    > 0 ? S.targets.carbs   + 'g' : 'Not set');
  setText('siFatGoal',       S.targets.fat      > 0 ? S.targets.fat     + 'g' : 'Not set');
}

function bindSettingsEvents() {
  on('editNameSetting', 'click', function() {
    openInput('Display Name', 'Your name', S.user.name, function(val) {
      if (val.trim()) { S.user.name = val.trim(); save(); updateUserDisplay(); renderSettings(); }
    });
  });
  on('editCalGoalSetting', 'click', function() {
    openInput('Calorie Goal', 'Daily calories (kcal)', S.targets.calories || '', function(val) {
      var v = parseInt(val);
      if (!isNaN(v) && v > 0) { S.targets.calories = v; save(); renderHome(); renderNutrition(); renderSettings(); }
    });
  });
  on('editProteinGoalSetting', 'click', function() {
    openInput('Protein Goal', 'Grams per day', S.targets.protein || '', function(val) {
      var v = parseInt(val);
      if (!isNaN(v) && v > 0) { S.targets.protein = v; save(); renderHome(); renderSettings(); }
    });
  });
  on('editCarbGoalSetting', 'click', function() {
    openInput('Carb Goal', 'Grams per day', S.targets.carbs || '', function(val) {
      var v = parseInt(val);
      if (!isNaN(v) && v >= 0) { S.targets.carbs = v; save(); renderHome(); renderSettings(); }
    });
  });
  on('editFatGoalSetting', 'click', function() {
    openInput('Fat Goal', 'Grams per day', S.targets.fat || '', function(val) {
      var v = parseInt(val);
      if (!isNaN(v) && v >= 0) { S.targets.fat = v; save(); renderHome(); renderSettings(); }
    });
  });
  on('openCalcSettingBtn', 'click', function() { openModal('calcModal'); });
  on('exportDataSetting', 'click', function() {
    var blob = new Blob([JSON.stringify(S, null, 2)], {type:'application/json'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'dialed-dawg-' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
  });
  on('clearDataSetting', 'click', function() {
    if (confirm('Reset ALL data? This cannot be undone.')) {
      localStorage.removeItem('dd_v2');
      location.reload();
    }
  });
}

// ─── MACRO HELPER ─────────────────────────────

function renderMacroGroup(prot, carb, fat, tgtP, tgtC, tgtF, pFId, cFId, fFId, pVId, cVId, fVId) {
  function pct(val, tgt) { return tgt > 0 ? Math.min((val/tgt)*100, 100) : 0; }
  function setW(id, v) { var e = document.getElementById(id); if (e) e.style.width = v + '%'; }
  setW(pFId, pct(prot, tgtP));
  setW(cFId, pct(carb, tgtC));
  setW(fFId, pct(fat,  tgtF));
  setText(pVId, tgtP > 0 ? Math.round(prot) + ' / ' + tgtP + 'g' : Math.round(prot) + 'g');
  setText(cVId, tgtC > 0 ? Math.round(carb) + ' / ' + tgtC + 'g' : Math.round(carb) + 'g');
  setText(fVId, tgtF > 0 ? Math.round(fat)  + ' / ' + tgtF + 'g' : Math.round(fat)  + 'g');
}

// ─── MODALS ───────────────────────────────────

var _inputCb = null;

function bindModals() {
  on('inputModalSave', 'click', function() {
    var v = g('inputModalField').value;
    closeModal('inputModal');
    if (_inputCb) { _inputCb(v); _inputCb = null; }
  });
  on('closeInputModal', 'click', function() { closeModal('inputModal'); _inputCb = null; });

  on('saveFoodBtn', 'click', function() {
    var name    = g('foodName').value.trim();
    var cals    = parseFloat(g('foodCals').value)    || 0;
    var protein = parseFloat(g('foodProtein').value) || 0;
    var carbs   = parseFloat(g('foodCarbs').value)   || 0;
    var fat     = parseFloat(g('foodFat').value)     || 0;
    if (!name) return;
    addFood(S._pendingMeal || 'snacks', {name:name, cals:cals, protein:protein, carbs:carbs, fat:fat});
    ['foodName','foodCals','foodProtein','foodCarbs','foodFat'].forEach(function(id) { g(id).value = ''; });
    closeModal('addFoodModal');
  });
  on('closeAddFoodModal', 'click', function() { closeModal('addFoodModal'); });

  on('runCalcBtn',   'click', runCalc);
  on('applyCalcBtn', 'click', applyCalc);
  on('closeCalcModal', 'click', function() { closeModal('calcModal'); });

  on('savePeptideBtn', 'click', function() {
    var name = g('pepName').value.trim();
    var dose = g('pepDose').value.trim();
    var freq = g('pepFreq').value.trim();
    if (!name || !dose) return;
    S.peptides.push({name:name, dose:dose, freq:freq||'Daily'});
    save(); renderPeptides();
    ['pepName','pepDose','pepFreq'].forEach(function(id) { g(id).value = ''; });
    closeModal('addPeptideModal');
  });
  on('closeAddPeptideModal', 'click', function() { closeModal('addPeptideModal'); });

  on('saveBodyStatsBtn', 'click', function() {
    var flds = {weight:'bsInputWeight', bodyFat:'bsInputBF', chest:'bsInputChest', waist:'bsInputWaist', arms:'bsInputArms', legs:'bsInputLegs'};
    var any = false;
    Object.keys(flds).forEach(function(key) {
      var v = parseFloat(g(flds[key]).value);
      if (!isNaN(v) && v > 0) {
        S.bodyStats[key] = v;
        if (key === 'weight') {
          S.today.weight = v;
          S.weightHistory.push({date: new Date().toDateString(), weight: v});
        }
        any = true;
      }
    });
    if (any) { save(); renderProgress(); renderHome(); }
    Object.values(flds).forEach(function(id) { g(id).value = ''; });
    closeModal('bodyStatsModal');
  });
  on('closeBodyStatsModal', 'click', function() { closeModal('bodyStatsModal'); });

  document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });
}

function openModal(id)  { var e = document.getElementById(id); if (e) e.classList.remove('hidden'); }
function closeModal(id) { var e = document.getElementById(id); if (e) e.classList.add('hidden'); }

function openInput(title, label, currentVal, cb) {
  _inputCb = cb;
  setText('inputModalTitle', title);
  setText('inputModalLabel', label);
  g('inputModalField').value = (currentVal !== null && currentVal !== undefined) ? currentVal : '';
  openModal('inputModal');
  setTimeout(function() { var f = g('inputModalField'); if (f) f.focus(); }, 80);
}

// ─── CALORIE CALCULATOR ───────────────────────

var _calcResult = {};

function runCalc() {
  var age    = parseFloat(g('calcAge').value)    || 25;
  var wtLbs  = parseFloat(g('calcWeight').value) || 180;
  var htIn   = parseFloat(g('calcHeight').value) || 70;
  var gender = g('calcGender').value;
  var act    = parseFloat(g('calcActivity').value);
  var goal   = g('calcGoalSelect').value;

  var wtKg = wtLbs * 0.453592;
  var htCm = htIn  * 2.54;
  var bmr  = gender === 'male'
    ? 10*wtKg + 6.25*htCm - 5*age + 5
    : 10*wtKg + 6.25*htCm - 5*age - 161;
  var maint = Math.round(bmr * act);
  var rec   = maint;
  var chg   = '±0 lbs/week';
  if (goal === 'cut')  { rec = maint - 500; chg = '−1 lb/week'; }
  if (goal === 'bulk') { rec = maint + 300; chg = '+0.6 lbs/week'; }

  var protein = Math.round(wtLbs * 1.0);
  var fat     = Math.round(rec * 0.25 / 9);
  var carbs   = Math.round((rec - protein*4 - fat*9) / 4);
  _calcResult = {calories:rec, protein:protein, carbs:carbs, fat:fat};

  setText('crMaintain',  maint.toLocaleString() + ' kcal');
  setText('crRecommend', rec.toLocaleString()   + ' kcal');
  setText('crChange',    chg);
  setText('crProtein',   protein + 'g');
  setText('crCarbs',     carbs   + 'g');
  setText('crFat',       fat     + 'g');
  var cr = document.getElementById('calcResults');
  if (cr) cr.classList.remove('hidden');
}

function applyCalc() {
  Object.assign(S.targets, _calcResult);
  save();
  closeModal('calcModal');
  var cr = document.getElementById('calcResults');
  if (cr) cr.classList.add('hidden');
  renderHome(); renderNutrition(); renderSettings();
  alert('Targets applied! 🎯');
}

// ─── UTILS ────────────────────────────────────

function g(id)        { return document.getElementById(id); }
function setText(id, val) { var e = document.getElementById(id); if (e) e.textContent = val; }
function on(id, ev, fn) { var e = document.getElementById(id); if (e) e.addEventListener(ev, fn); }
function cap(s)       { return s.charAt(0).toUpperCase() + s.slice(1); }
function vibrate()    { if (navigator.vibrate) navigator.vibrate(25); }

function timeAgo(dateStr) {
  if (!dateStr) return '';
  var days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 864e5);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7)  return days + 'd ago';
  return Math.floor(days/7) + 'w ago';
}

// ─── SERVICE WORKER ───────────────────────────

function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(function() {});
  }
}
