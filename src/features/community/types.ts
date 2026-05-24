export type CommunitySoundRow = {
  id: string;
  user_id: string;
  title: string | null;
  prompt: string | null;
  audio_url: string | null;
  duration: number | null;
  tags: string[] | null;
  is_public: boolean;
  report_count: number;
  is_hidden: boolean;
  kind: string | null;
  mix_layers: unknown | null;
  saved_mix_id: string | null;
  created_at: string | null;
};

export type CommunitySound = CommunitySoundRow & {
  creatorName: string;
  creatorAvatarUrl: string | null;
  pulseCount: number;
  pulses24h: number;
  hasPulsed: boolean;
  hasSaved: boolean;
};

export function isCommunityMix(sound: Pick<CommunitySound, "kind">): boolean {
  return sound.kind === "mix";
}

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
  avatarUrl: string | null;
  soundsShared: number;
  totalPulses: number;
  sounds: CommunitySound[];
};
