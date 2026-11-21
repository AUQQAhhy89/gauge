#!/usr/bin/env bash
# Build the Android APK. Requires Android SDK platform 34 + build-tools + JDK 17.
set -euo pipefail
cd "$(dirname "$0")"

ROOT="$(cd .. && pwd)"
ANDROID_JAR="${ANDROID_JAR:-${ANDROID_HOME:-/root/workspace/sdk}/platforms/android-34/android.jar}"
if [ ! -f "$ANDROID_JAR" ]; then
  ANDROID_JAR="/root/workspace/sdk/android-34/android.jar"
fi
BT="${BUILD_TOOLS:-/root/workspace/tools/bt/android-14}"
if [ -z "${JAVA_HOME:-}" ] || [ ! -x "$JAVA_HOME/bin/javac" ]; then
  if [ -x /root/workspace/jdk/bin/javac ]; then
    JAVA_HOME=/root/workspace/jdk
  elif command -v javac >/dev/null 2>&1; then
    JAVA_HOME="$(dirname "$(dirname "$(readlink -f "$(command -v javac)")")")"
  fi
fi
JAVAC="$JAVA_HOME/bin/javac"
KEYTOOL="$JAVA_HOME/bin/keytool"
export PATH="$JAVA_HOME/bin:$PATH"

if [ ! -x "$BT/aapt2" ]; then
  echo "aapt2 not found at $BT/aapt2" >&2
  exit 1
fi
if [ ! -f "$ANDROID_JAR" ]; then
  echo "android.jar not found at $ANDROID_JAR" >&2
  exit 1
fi

# Android build-tools are x86_64. On an ARM host, run them through qemu.
AAPT2="$BT/aapt2"
ZIPALIGN="$BT/zipalign"
if [ "$(uname -m)" = "aarch64" ] || [ "$(uname -m)" = "arm64" ]; then
  if command -v qemu-x86_64-static >/dev/null 2>&1; then
    AAPT2="qemu-x86_64-static $BT/aapt2"
    ZIPALIGN="qemu-x86_64-static $BT/zipalign"
    export LD_LIBRARY_PATH="${LD_LIBRARY_PATH:-}:/usr/x86_64-linux-gnu/lib"
  else
    echo "aapt2 is x86_64; install qemu-user-static on this ARM host" >&2
    exit 1
  fi
fi

rm -rf build
mkdir -p build/classes build/dex "$ROOT/dist"
rm -rf assets
mkdir -p assets
cp -r "$ROOT/web/." assets/

$AAPT2 compile --dir res -o build/res.zip
$AAPT2 link -o build/app-unsigned.apk -I "$ANDROID_JAR" \
  --manifest AndroidManifest.xml -R build/res.zip --auto-add-overlay -A assets \
  --min-sdk-version 24 --target-sdk-version 34 \
  --version-code 10 --version-name 1.4.0

"$JAVAC" -source 8 -target 8 -classpath "$ANDROID_JAR" -d build/classes \
  $(find src -name '*.java')
"$BT/d8" --min-api 24 --lib "$ANDROID_JAR" --output build/dex \
  $(find build/classes -name '*.class')

python3 - <<'PY'
import shutil, zipfile
shutil.copyfile('build/app-unsigned.apk', 'build/app-dex.apk')
with zipfile.ZipFile('build/app-dex.apk', 'a', zipfile.ZIP_DEFLATED) as z:
    z.write('build/dex/classes.dex', 'classes.dex')
PY
$ZIPALIGN -f -p 4 build/app-dex.apk build/app-aligned.apk

KEYSTORE="${GAUGE_KEYSTORE:-$HOME/.gauge/steamviewer.jks}"
mkdir -p "$(dirname "$KEYSTORE")"
if [ ! -f "$KEYSTORE" ]; then
  "$KEYTOOL" -genkeypair -noprompt -keystore "$KEYSTORE" -alias steamviewer \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass steamviewer -keypass steamviewer \
    -dname "CN=Steam Viewer, OU=Community, O=Steam Viewer, L=Local, ST=Local, C=CN"
fi
"$BT/apksigner" sign --ks "$KEYSTORE" \
  --ks-pass pass:steamviewer --key-pass pass:steamviewer \
  --ks-key-alias steamviewer \
  --out "$ROOT/dist/Gauge-Android.apk" build/app-aligned.apk

"$BT/apksigner" verify "$ROOT/dist/Gauge-Android.apk"
$AAPT2 dump badging "$ROOT/dist/Gauge-Android.apk" | head -8
ls -lh "$ROOT/dist/Gauge-Android.apk"
