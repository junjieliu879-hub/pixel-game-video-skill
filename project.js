export const project = {
  title: 'RUNE QUEST', duration: 20, fps: 24,
  starts: [2, 4.5, 7, 9.5, 12, 14.5],
  ends: [4.5, 7, 9.5, 12, 14.5, 18],
  labels: ['LOOK', 'LINK', 'ORDER', 'TRACE', 'MERGE', 'OPEN'],
  actions: ['LIGHT A RUNE', 'JOIN THE CLUES', 'PLACE THE RUNES', 'CHOOSE A PATH', 'CONNECT THE ROUTES', 'UNLOCK THE GATE'],
  feedback: ['A RUNE ANSWERS', 'TWO CLUES CONNECT', 'THREE RUNES ALIGN', 'A PATH REACHES THE END', 'THE ROUTES CONVERGE', 'A NEW WORLD OPENS'],
};

const clamp = n => Math.max(0, Math.min(1, n));
const ease = n => { n = clamp(n); return n * n * (3 - 2 * n); };
export function stateAt(time) {
  const t = Math.max(0, Math.min(project.duration, time));
  let tier = 0;
  for (let i = 0; i < project.starts.length; i++) if (t >= project.starts[i]) tier = i;
  const local = t < 2 ? 0 : clamp((t - project.starts[tier]) / (project.ends[tier] - project.starts[tier]));
  const active = t < 2 ? 0 : Math.min(6, tier + (local >= 0.58 ? 1 : 0));
  const entering = t >= 17.1 && t < 18;
  const previousX = tier === 0 ? 58 : 65 + (tier - 1) * 13;
  let heroX = t < 2 ? 28 + 30 * ease(t / 2) : previousX + (65 + tier * 13 - previousX) * ease(local / 0.18);
  if (entering) heroX = 130 + 110 * ease((t - 17.1) / 0.85);
  return {tier, local, active, heroX: Math.round(heroX), entering,
    casting: t >= 2 && local > 0.18 && local < 0.66 && !entering};
}

// Sound cues use the exact same state-change times as the visual response.
export const soundEvents = project.starts.map((start, i) => ({
  time: start + 0.58 * (project.ends[i] - start), kind: 'rune', pitch: 620 + i * 105,
})).concat([{time: 16.58, kind: 'door', pitch: 90}, {time: 18, kind: 'finish', pitch: 659.25}]);
