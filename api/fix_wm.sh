#!/bin/bash
INPUT="/var/www/html/api.resortwala.com/storage/app/public/properties/11/Z6PCPbiGMz7S2ZlbGwFS4Xo05gb2QLbvp7TTw9PH.jpeg"
LOGO="/var/www/html/api.resortwala.com/public/resortwala-logo.png"
OUTPUT="/tmp/test_wm_scale_fixed.jpg"

echo "--- Test: Scale2Ref Constants ---"
# Test scale2ref with FIXED numbers (no rw/iw variables)
FILTER='[1:v][0:v]scale2ref=w=200:h=100[wm][base];[base][wm]overlay=10:10'

ffmpeg -y -i "$INPUT" -i "$LOGO" -filter_complex "$FILTER" -q:v 2 "$OUTPUT" 2>&1

if [ -f "$OUTPUT" ]; then
    SIZE=$(stat -c%s "$OUTPUT")
    echo "SUCCESS: Created $OUTPUT ($SIZE bytes)"
else
    echo "FAILURE: Output not created."
fi
