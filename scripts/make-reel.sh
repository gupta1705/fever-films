#!/usr/bin/env bash
# Cuts the homepage hero reel from the public Drive masters (seeks remotely, never downloads whole files).
set -euo pipefail
FF="C:/Users/gupta/AppData/Roaming/npm/node_modules/ffmpeg-static/ffmpeg.exe"
OUT="$1"; cd "$OUT"
url(){ echo "https://drive.usercontent.google.com/download?id=$1&export=download&confirm=t"; }
LIGHTS=1EmaGxOj85Xnlhh1VS9ZZD8h2K5le1ljP; LADDOO=1boHxPYCz6Ttg5Y7CPazE6_rEtDQfyYaa; RANGOLI=1HTLJJitPmiAgaq99bUeX5-jEaqfIOsDp
KIDS=13i2K9l_GGiNd0cqgOdKI8uhV56eY3rS-; WED=1zf1lv6_4J2HLRiSjgAY6XWjn7hT7jcsL; PREETI=1lx2TFdIUFplOWQJP9y_XbMSNTu5r7Rps; CU=1iSsm1PdVMnDUKRWi5egWqLOFpfUFik--
CLIPS=("$LIGHTS 43.5" "$KIDS 19" "$LADDOO 29" "$WED 11" "$RANGOLI 44" "$CU 89" "$PREETI 47" "$LIGHTS 29")
: > list.txt; i=0
for c in "${CLIPS[@]}"; do set -- $c; i=$((i+1))
  "$FF" -hide_banner -loglevel error -y -ss "$2" -i "$(url $1)" -t 2.2 -an \
    -vf "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=25,format=gray" \
    -c:v libx264 -crf 16 -preset veryfast "c$i.mp4"
  echo "file 'c$i.mp4'" >> list.txt; echo "clip $i done"
done
"$FF" -hide_banner -loglevel error -y -f concat -safe 0 -i list.txt -an \
  -vf "format=yuv420p" -c:v libx264 -crf 28 -preset slow -profile:v high -movflags +faststart reel.mp4
"$FF" -hide_banner -loglevel error -y -ss 0.4 -i reel.mp4 -frames:v 1 -c:v libwebp -quality 70 reel-poster.webp
ls -la reel.mp4 reel-poster.webp
