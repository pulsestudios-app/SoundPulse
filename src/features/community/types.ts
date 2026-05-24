export type CommunitySoundRow = {
  id: string;
  user_id: string;
  title: string | null;
  prompt: string | null;
  audio_url: string;
  duration: number | null;
  tags: string[] | null;
  is_public: boolean;
  report_count: number;
  is_hidden: boolean;
  created_at: string | null;
};

export type CommunitySound = CommunitySoundRow & {
  creatorName: string;
  pulseCount: number;
  pulses24h: number;
  hasPulsed: boolean;
  hasSaved: boolean;
};

export type ShareCommunitySoundInput = {
  userId: string;
  title: string;
  prompt: string;
  audioUrl: string;
  duration: number;
  tags: string[];
};

export type CreatorProfile = {
  userId: string;
  displayName: string;
  email: string | null;
  soundsShared: number;
  totalPulses: number;
  sounds: CommunitySound[];
};
