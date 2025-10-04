export function calculateHP(streakDays) {
  const streakMonths = streakDays / 30;
  
  if (streakMonths < 3) {
    return randomInt(50, 200);
  } else if (streakMonths >= 3 && streakMonths < 6) {
    return randomInt(200, 500);
  } else {
    return randomInt(500, 1000);
  }
}

export function calculateAttack(streakDays) {
  const streakMonths = streakDays / 30;
  
  if (streakMonths < 2) {
    return 10;
  } else if (streakMonths >= 2 && streakMonths < 4) {
    return randomInt(30, 70);
  } else if (streakMonths >= 4 && streakMonths < 8) {
    return randomInt(70, 100);
  } else if (streakMonths >= 8 && streakMonths < 12) {
    return randomInt(100, 150);
  } else {
    return 175;
  }
}

export function calculateScale(streakDays) {
  const streakMonths = streakDays / 30;
  
  if (streakMonths < 3) {
    return 1;
  } else if (streakMonths >= 3 && streakMonths < 7) {
    return 1.5;
  } else if (streakMonths >= 7 && streakMonths < 12) {
    return 2;
  } else {
    return 3;
  }
}

export function shouldUpdateStats(oldStreak, newStreak) {
  const oldMonths = oldStreak / 30;
  const newMonths = newStreak / 30;
  
  const hpThresholds = [0, 3];
  const attackThresholds = [0, 2, 4, 8, 12];
  const scaleThresholds = [0, 3, 7, 12];
  
  for (const threshold of [...hpThresholds, ...attackThresholds, ...scaleThresholds]) {
    if ((oldMonths < threshold && newMonths >= threshold) || 
        (oldMonths >= threshold && newMonths < threshold)) {
      return true;
    }
  }
  
  return false;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
