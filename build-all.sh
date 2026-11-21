#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
./scripts/build-windows.sh
./android/build.sh
mkdir -p dist
rm -f dist/Gauge-1.4.0-source.zip
python3 - <<'PY2'
import zipfile, os
root = os.getcwd()
include_dirs = ['web', 'android/res', 'android/src', 'build-assets', 'scripts', 'preview']
include_files = ['main.go', 'go.mod', 'README.md', 'LICENSE', 'android/build.sh', 'android/AndroidManifest.xml', 'build-all.sh', 'rsrc_windows_amd64.syso']
with zipfile.ZipFile('dist/Gauge-1.4.0-source.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for f in include_files:
        z.write(f, f)
    for d in include_dirs:
        for base, dirs, files in os.walk(d):
            dirs[:] = [x for x in dirs if x not in ('build', 'assets')]
            for f in files:
                path = os.path.join(base, f)
                z.write(path, path)
print('source zip written')
PY2
ls -lh dist/
