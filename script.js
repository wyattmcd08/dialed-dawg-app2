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
    {day:'SAT', name:'Legs', exercises:['Front​​​​​​​​​​​​​​​​
