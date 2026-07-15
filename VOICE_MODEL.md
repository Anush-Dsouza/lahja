# Bundled Gulf Arabic voice

Lahja's synthetic lesson audio was generated with
[`vadimbelsky/qwen3-TTS-KSA`](https://huggingface.co/vadimbelsky/qwen3-TTS-KSA),
an Apache-2.0 Qwen3-TTS fine-tune for Saudi/Khaleeji Arabic.

- Fixed embedded speaker: `ksa_speaker`
- Output format: mono MP3, 24 kHz, 64 kbit/s
- Runtime in the website: ordinary static audio files; no model, server, API key,
  subscription, trial, or device speech synthesizer is required.
- Source text: the public `Vocabulary Mastery` sheet's `Arabic` and
  `Bahrain Example` columns.

The generated files and their text mapping live in `public/audio/`. To refresh
the pack after changing the sheet, run `work/voice-lab/generate_static_pack.py`
from the parent workspace in an environment containing `qwen-tts`, PyTorch,
SoundFile, and FFmpeg.
