export function sortScoresDescending(scores = []) {
  return [...scores].sort((a, b) => new Date(b.playedAt) - new Date(a.playedAt));
}

export function retainLatestFiveScores(scores = []) {
  return sortScoresDescending(scores).slice(0, 5);
}

export function scoreFrequencyMap(users = []) {
  const map = new Map();

  users.forEach((user) => {
    user.scores.forEach((score) => {
      map.set(score.value, (map.get(score.value) || 0) + 1);
    });
  });

  return map;
}

