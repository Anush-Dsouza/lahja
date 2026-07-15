export interface VoicePack {
  version: number;
  voice: {
    id: string;
    label: string;
    model: string;
    modelUrl: string;
    license: string;
    sampleRate: number;
    speaker: string;
  };
  preview: string;
  clips: Record<string, string>;
}

const packUrl = `${import.meta.env.BASE_URL}audio/manifest.json`;

function absoluteAssetUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}

export async function loadVoicePack(): Promise<VoicePack> {
  const response = await fetch(packUrl, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Voice pack failed to load (${response.status})`);
  const pack = await response.json() as VoicePack;
  if (!pack.voice?.model || !pack.preview || !pack.clips) throw new Error('Voice pack manifest is invalid.');
  return {
    ...pack,
    preview: absoluteAssetUrl(pack.preview),
    clips: Object.fromEntries(Object.entries(pack.clips).map(([text, path]) => [text, absoluteAssetUrl(path)]))
  };
}

export function audioFor(text: string | undefined, explicitUrl: string | undefined, pack: VoicePack | null) {
  return explicitUrl || (text ? pack?.clips[text] : undefined);
}
