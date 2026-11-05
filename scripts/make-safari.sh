#!/bin/bash
# 学情プラス — Safari（iPhone / iPad / Mac）用の Xcode プロジェクトを作る
# 必要なもの：Mac、Xcode（App Store から入手）、Node.js
# 使い方：  bash scripts/make-safari.sh
set -euo pipefail
cd "$(dirname "$0")/.."

BUNDLE_ID="${BUNDLE_ID:-jp.example.gakujoplus}"   # 自分のものに変えてもよい（例: jp.<名前>.gakujoplus）

node build.mjs
rm -rf safari-xcode
xcrun safari-web-extension-converter dist/safari \
  --project-location safari-xcode \
  --app-name "GakujoPlus" \
  --bundle-identifier "$BUNDLE_ID" \
  --swift \
  --copy-resources \
  --no-open \
  --force

echo ""
echo "✓ safari-xcode/GakujoPlus/GakujoPlus.xcodeproj を作成しました。"
echo "  Xcode で開き、Signing & Capabilities で自分の Apple ID（Team）を選んでから、"
echo "  iPhone を接続して ▶︎（Run）で実行してください。詳しくは README.md を参照。"
open safari-xcode/GakujoPlus/GakujoPlus.xcodeproj 2>/dev/null || true
