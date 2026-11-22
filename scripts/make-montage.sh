#!/usr/bin/env bash
# Cuts iteration 3's hero montage: motion clips seeked remotely from the public Drive masters, plus slow
# push-ins on the stills of films that are only on YouTube. Order must match CUTS in app.js.
# Usage: bash scripts/make-montage.sh <empty work dir>
set -euo pipefail
FF="C:/Users/gupta/AppData/Roaming/npm/node_modules/ffmpeg-static/ffmpeg.exe"
ROOT="$(cygpath -m "$(cd "$(dirname "$0")/.." && pwd)")"
WORK="$(cd "$1" && pwd)" # absolute: each size cuts in its own subfolder
url(){ echo "https://drive.usercontent.google.com/download?id=$1&export=download&confirm=t"; }
LIGHTS=1EmaGxOj85Xnlhh1VS9ZZD8h2K5le1ljP; LADDOO=1boHxPYCz6Ttg5Y7CPazE6_rEtDQfyYaa; RANGOLI=1HTLJJitPmiAgaq99bUeX5-jEaqfIOsDp
CU=1iSsm1PdVMnDUKRWi5egWqLOFpfUFik-- # the Wiom masters stopped serving ranged reads, so Wiom cuts are stills
LEN=1.2
# "v <drive id> <second>" is a clip from a master; "s <still>" is a push-in on assets/img/work/<still>.webp
# order agreed with the team: Amitabh (CyberDost), Aamir Khan, Suniel Shetty (Marzi), Spotify, CU, then the rest;
# each brand's cuts sit together, because the hero lights one brand at a time
CUTS=("s cyberdost-phulera" "s cyberdost-phulera-2" "s cyberdost-scam-calls" "s sitaare-zameen-par" "s marzi-find-your-kind" "v $LIGHTS 46.2" "v $LADDOO 32.3" "v $RANGOLI 36.9" "v $LIGHTS 50.8" "v $CU 89.4" "v $CU 44.7" "s ultratech-ek-ghar" "s aadhar-daga-seth" "s wiom-two-kids" "s wiom-preeti-guddu")
ENC=(-an -c:v libx264 -crf 16 -preset veryfast -pix_fmt yuv420p)
# two cuts of the same list: 720p for phones, 1080p for anything wider (index.html picks one by media query)
for size in "1280 720 montage.mp4 21" "1920 1080 montage-1080.mp4 22"; do read -r W H FILE CRF <<< "$size"
mkdir -p "$WORK/$H"; cd "$WORK/$H"; : > list.txt; i=0
for c in "${CUTS[@]}"; do set -- $c; i=$((i+1)); out="$(echo "$*" | tr -c 'A-Za-z0-9.\n-' _).mp4" # named by content, so reordering reuses cuts
  if [ -s "$out" ]; then : # already cut on an earlier run
  elif [ "$1" = v ]; then
    for try in 1 2 3; do # Drive sometimes drops a ranged request; retry before giving up
      "$FF" -hide_banner -loglevel error -y -ss "$3" -i "$(url "$2")" -t $LEN \
        -vf "scale=$W:$H:force_original_aspect_ratio=increase,crop=$W:$H,fps=25,setsar=1" "${ENC[@]}" "$out" && break
      sleep 3
    done
  else
    "$FF" -hide_banner -loglevel error -y -loop 1 -framerate 25 -t $LEN -i "$ROOT/img/work/$2.webp" \
      -vf "scale=$((W * 2)):$((H * 2)),zoompan=z='1.04+0.0018*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${W}x$H:fps=25,setsar=1" "${ENC[@]}" "$out"
  fi
  [ -s "$out" ] || { echo "cut $i failed"; exit 1; }
  echo "file '$out'" >> list.txt; echo "cut $i done"
done
"$FF" -hide_banner -loglevel error -y -f concat -safe 0 -i list.txt -an \
  -c:v libx264 -crf "$CRF" -preset slow -profile:v high -pix_fmt yuv420p -movflags +faststart "$ROOT/video/$FILE"
done
"$FF" -hide_banner -loglevel error -y -ss 0.3 -i "$ROOT/video/montage.mp4" -frames:v 1 -c:v libwebp -quality 72 "$ROOT/img/montage.webp"
ls -la "$ROOT/video/montage.mp4" "$ROOT/video/montage-1080.mp4" "$ROOT/img/montage.webp"
