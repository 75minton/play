import type { MatchPlayerInput } from './types';

export interface GeneratedMatch {
  roundNo: number;
  matchNo: number;
  courtNo: number;
  teamA: MatchPlayerInput[];
  teamB: MatchPlayerInput[];
}

function shuffle<T>(items: T[]): T[] {
  const copied = [...items];
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
}

function playerKey(player: MatchPlayerInput) {
  return player.memberId;
}

export function generateSimpleDoublesMatches(params: {
  players: MatchPlayerInput[];
  courtCount: number;
  roundNo?: number;
  matchCount?: number;
  existingPlayCounts?: Record<string, number>;
  startMatchNo?: number;
}): GeneratedMatch[] {
  const { players, courtCount, roundNo = 1, matchCount, existingPlayCounts = {}, startMatchNo = 1 } = params;
  if (courtCount < 1) throw new Error('코트 수는 1 이상이어야 합니다.');
  if (players.length < 4) return [];

  const targetCount = matchCount && matchCount > 0 ? matchCount : Math.floor(players.length / 4);
  const playCounts = new Map<string, number>();
  players.forEach((player) => playCounts.set(playerKey(player), existingPlayCounts[playerKey(player)] || 0));

  const matches: GeneratedMatch[] = [];
  let currentRound = roundNo;
  let matchNo = startMatchNo;

  while (matches.length < targetCount) {
    const ordered = shuffle(players).sort((a, b) => (playCounts.get(playerKey(a)) || 0) - (playCounts.get(playerKey(b)) || 0));
    const group = ordered.slice(0, 4);
    if (group.length < 4) break;

    const courtNo = ((matchNo - 1) % courtCount) + 1;
    matches.push({
      roundNo: currentRound,
      matchNo,
      courtNo,
      teamA: [group[0], group[3]],
      teamB: [group[1], group[2]],
    });

    group.forEach((player) => playCounts.set(playerKey(player), (playCounts.get(playerKey(player)) || 0) + 1));
    matchNo += 1;
    if (((matchNo - 1) % courtCount) === 0 && matches.length < targetCount) currentRound += 1;
  }

  return matches;
}

export function calcWinner(teamAScore: number, teamBScore: number): 'A' | 'B' | null {
  if (teamAScore === teamBScore) return null;
  return teamAScore > teamBScore ? 'A' : 'B';
}
