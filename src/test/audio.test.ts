import { describe, expect, it } from 'vitest';
import { audioFor, type VoicePack } from '../lib/audio';

const pack: VoicePack = {
  version: 1,
  voice: { id: 'gulf', label: 'Gulf', model: 'model', modelUrl: 'https://example.com', license: 'Apache-2.0', sampleRate: 24000, speaker: 'speaker' },
  preview: '/preview.mp3',
  clips: { 'شكراً': '/gulf.mp3' }
};

describe('bundled Gulf audio', () => {
  it('uses the bundled clip instead of device speech synthesis', () => {
    expect(audioFor('شكراً', undefined, pack)).toBe('/gulf.mp3');
  });

  it('keeps an explicit source recording as the highest priority', () => {
    expect(audioFor('شكراً', '/source.mp3', pack)).toBe('/source.mp3');
  });

  it('does not invent a device voice when a phrase is missing', () => {
    expect(audioFor('عبارة جديدة', undefined, pack)).toBeUndefined();
  });
});
