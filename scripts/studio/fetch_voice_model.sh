#!/usr/bin/env bash
# Download the Kimu Voice Engine model (Kokoro-82M, int8 ONNX, 92 MB, Apache-2.0). Run once per machine.
set -e
cd "$(dirname "$0")/../.."
mkdir -p models/kimu_voice
[ -f models/kimu_voice/kokoro-v1.0.int8.onnx ] || curl -L -o models/kimu_voice/kokoro-v1.0.int8.onnx \
  https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.int8.onnx
pip install --break-system-packages kokoro-onnx soundfile scipy numpy >/dev/null
command -v ffmpeg >/dev/null || echo "Install ffmpeg (needed for pitch shifting)."
python3 scripts/studio/kimu_voice.py cast
