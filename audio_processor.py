import librosa
import numpy as np


def analyze_audio_file(file_path: str, max_points: int = 800) -> dict:
    y, sr = librosa.load(file_path, sr=22050)

    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    bpm = float(tempo[0]) if isinstance(tempo, np.ndarray) else float(tempo)

    step_wave = max(1, len(y) // max_points)
    waveform = y[::step_wave]

    S = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=64)
    S_dB = librosa.power_to_db(S, ref=np.max)

    step_spec = max(1, S_dB.shape[1] // max_points)
    spectrogram = S_dB[:, ::step_spec]

    mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    mfccs_downsampled = mfccs[:, ::step_spec]

    return {
        "bpm": round(bpm, 1),
        "waveform": [round(float(val), 3) for val in waveform],
        "spectrogram": [[round(float(val), 2) for val in row] for row in spectrogram],
        "mfcc": [[round(float(val), 2) for val in row] for row in mfccs_downsampled],
    }
