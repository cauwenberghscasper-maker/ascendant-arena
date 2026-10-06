// One short readable impact pop followed by an eased rise. Fixed DOM pool.
export function damageMotion(age, lifetime, calm, critical) {
  const progress = Math.max(0, Math.min(1, age / lifetime));
  const pop = age < .10 ? .65 + age * 6 : age < .22 ? 1.25 - (age - .10) * 2.1 : 1;
  return {
    scale: calm ? 1 : pop * (critical ? 1.08 : 1),
    rise: calm ? progress * 12 : (1 - Math.pow(1 - progress, 2)) * (critical ? 42 : 30),
    opacity: Math.min(1, (1 - progress) * 4)
  };
}
