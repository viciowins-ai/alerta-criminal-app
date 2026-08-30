export interface LevelInfo {
  name: string;
  badge: string;
  color: string;
  verified: boolean;
}

export function getLevelInfo(points: number = 0): LevelInfo {
  if (points < 50) return { name: 'Iniciante', badge: 'Bronze', color: 'text-amber-600', verified: false };
  if (points < 200) return { name: 'Guardião Prata', badge: 'Prata', color: 'text-slate-300', verified: false };
  if (points < 500) return { name: 'Guardião Ouro', badge: 'Ouro', color: 'text-yellow-400', verified: true };
  if (points < 1000) return { name: 'Guardião Diamante', badge: 'Diamante', color: 'text-cyan-400', verified: true };
  return { name: 'Mestre da Segurança', badge: 'Mestre', color: 'text-purple-400', verified: true };
}
