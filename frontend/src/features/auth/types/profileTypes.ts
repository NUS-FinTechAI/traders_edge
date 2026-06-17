export interface UserProfileResponse {
  user_id: string;
  user_name: string;
  user_email: string;
}

export type AchievementIconKey =
  | 'Baby'
  | 'Puzzle'
  | 'Infinity'
  | 'Veteran'
  | 'Account_created'
  | 'Medal'
  | 'Star'
  | 'Trophy'
  | 'Flame'
  | 'Swords'
  | 'Target'
  | 'ShieldQuestion';

export interface Achievement {
  id: string;
  title: string;
  hint: string;
  description: string;
  iconKey: AchievementIconKey;
  achieved: boolean;
}


