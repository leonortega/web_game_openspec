import musicAssetManifest from './musicAssetManifest.json';

type MusicLicense = 'CC0' | 'CC-BY-4.0' | 'Public Domain';

export type ActiveSustainedMusicManifestEntry = {
  assetKey: string;
  surface: 'menu' | 'stage';
  stageId?: string;
  title: string;
  creator: string;
  license: MusicLicense;
  sourceUrl: string;
  originalFileName: string;
  originalSourcePackRelativePath?: string;
  localAssetPath: string;
  webFormat: string;
  intendedMapping: string;
  volume: number;
};

export type BackupSustainedMusicManifestEntry = {
  title: string;
  creator: string;
  license: MusicLicense;
  sourceUrl: string;
  originalFileName: string;
  notes: string;
};

type MusicAssetManifest = {
  active: ActiveSustainedMusicManifestEntry[];
  backups: BackupSustainedMusicManifestEntry[];
};

const manifest = musicAssetManifest as MusicAssetManifest;

export const ACTIVE_SUSTAINED_MUSIC_MANIFEST = manifest.active;

export const BACKUP_SUSTAINED_MUSIC_MANIFEST = manifest.backups;

export const MENU_SUSTAINED_MUSIC = ACTIVE_SUSTAINED_MUSIC_MANIFEST.find(
  (entry) => entry.surface === 'menu',
) as ActiveSustainedMusicManifestEntry;

export const getAllActiveSustainedMusic = (): ActiveSustainedMusicManifestEntry[] =>
  ACTIVE_SUSTAINED_MUSIC_MANIFEST;

export const getStageSustainedMusic = (stageId: string): ActiveSustainedMusicManifestEntry | undefined =>
  ACTIVE_SUSTAINED_MUSIC_MANIFEST.find((entry) => entry.surface === 'stage' && entry.stageId === stageId);
