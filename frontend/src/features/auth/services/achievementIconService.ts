import {
  Trophy,
  Flame,
  Star,
  Swords,
  Target,
  ShieldQuestion,
  Baby,
  Puzzle,
  Infinity as InfinityIcon,
  Calendar1,
  ScanFace,
  Medal
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const ACHIEVEMENT_ICONS: Record<string, LucideIcon> = {
  Trophy,
  Flame,
  Star,
  Swords,
  Target,
  ShieldQuestion,
  Baby,
  Puzzle,
  Infinity: InfinityIcon,
  Calendar1,
  ScanFace,
  Medal,
  Veteran: Medal,
  Account_created: ScanFace,
};

export const DEFAULT_ACHIEVEMENT_ICON: LucideIcon = Trophy;
