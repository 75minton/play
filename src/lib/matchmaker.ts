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

export function generateSimpleDoublesMatches(params: {
  players: MatchPlayerInput[];
  courtCount: number;
  roundNo?: number;
  matchCount?: number;
}): GeneratedMatch[] {
  const { players, courtCount, roundNo = 1, matchCount } = params;
  if (courtCount < 1) throw new Error('코트 수는 1 이상이어야 합니다.');
  if (players.length < 4) return [];

  const targetCount = matchCount && matchCount > 0 ? matchCount : Math.floor(players.length / 4);
  const matches: GeneratedMatch[] = [];
  let currentRound = roundNo;
  let matchNo = 1;

  while (matches.length < targetCount) {
    const shuffled = shuffle(players);
    for (let i = 0; i + 3 < shuffled.length && matches.length < targetCount; i += 4) {
      const group = shuffled.slice(i, i + 4);
      const courtNo = ((matchNo - 1) % courtCount) + 1;
      matches.push({
        roundNo: currentRound,
        matchNo,
        courtNo,
        teamA: [group[0], group[1]],
        teamB: [group[2], group[3]],
      });
      matchNo += 1;
      if (((matchNo - 1) % courtCount) === 0 && matches.length < targetCount) {
        currentRound += 1;
      }
    }

    if (Math.floor(players.length / 4) === 0) break;
    if (matches.length < targetCount && matchNo > targetCount + courtCount + players.length) break;
  }

  return matches;
}

export function calcWinner(teamAScore: number, teamBScore: number): 'A' | 'B' | null {
  if (teamAScore === teamBScore) return null;
  return teamAScore > teamBScore ? 'A' : 'B';
}
