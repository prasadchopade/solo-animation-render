#!/usr/bin/env bash
# The cloud jobs' installs (ffmpeg; Playwright with Chromium's system packages and headless shell; espeak-ng) from
# GitHub's cache instead of Ubuntu's mirror. On 26 Oct 2026 the ffmpeg install alone took 2–47 min on 14 of the 15 jobs
# that ran in West US or West US 3, against 15–42 s for the other 24 jobs of three runs; a shard renders in ~20 s, and
# a run waits for its slowest shard. From the cache (27 Oct): 20–26 s per shard, West US included.
#
#   bash scripts/cloud-deps.sh key >> "$GITHUB_OUTPUT"   the actions/cache keys for this runner image
#   bash scripts/cloud-deps.sh render                    a render shard: ffmpeg, Playwright, Chromium's packages + shell
#   bash scripts/cloud-deps.sh ffmpeg                    the join
#   bash scripts/cloud-deps.sh espeak-ng                 the voice lab's Kokoro job
#
# The packages are the ones the jobs always installed, in the same order: `apt-get install ffmpeg`, then Playwright's
# install-deps for Chromium (what `--with-deps` ran; its fonts are Chromium's fallback fonts, so they stay). The first
# job on a new runner image installs them from the mirror and keeps the .deb files apt downloaded, one folder per step
# in ~/.cache/cloud-deps; later jobs install the same files with no package sources at all, then check that the
# machine's package list matches the mirror install's. Same packages, same versions: the cache changes nothing in the
# films (a static ffmpeg build would change every file: x264 writes its version into it). If the files don't fit the
# machine, or there are none, the step uses the mirror: 5 min, then one retry with 10 from Canonical's mirror instead
# of Azure's.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
SELF=$ROOT/scripts/cloud-deps.sh
DEBS=$HOME/.cache/cloud-deps
cd "$ROOT"

key() {   # one cache per runner image; "-older" (no image version) is for restore-keys: the newest earlier image's
  local base pw
  base=${ImageOS:-unknown}-$(grep -v '^ *#' "$SELF" | sha256sum | cut -c1-10)   # this script's code, not its comments
  pw=$(node -p 'require("./package.json").devDependencies.playwright')
  echo "render=cloud-deps-render-pw$pw-$base-${ImageVersion:-0}"
  echo "render-older=cloud-deps-render-pw$pw-$base-"
  echo "espeak-ng=cloud-deps-espeak-ng-$base-${ImageVersion:-0}"
  echo "espeak-ng-older=cloud-deps-espeak-ng-$base-"
}

setup() {   # a throwaway machine: no fsync per file, no man-page index rebuild after each install; keep apt's downloads
  echo force-unsafe-io | sudo tee /etc/dpkg/dpkg.cfg.d/cloud-deps > /dev/null
  echo 'APT::Keep-Downloaded-Packages "true";' | sudo tee /etc/apt/apt.conf.d/90cloud-deps > /dev/null
  sudo rm -f /var/lib/man-db/auto-update
}

aptq() { sudo DEBIAN_FRONTEND=noninteractive NEEDRESTART_SUSPEND=1 apt-get -qq -o DPkg::Lock::Timeout=120 "$@"; }
manifest() { dpkg-query -W -f '${binary:Package}=${Version} ${db:Status-Abbrev}\n' | sort; }
count() { find "$DEBS/$1" -maxdepth 1 -name '*.deb' | wc -l; }
cpu() {   # which CPU drew this shard: on 27 Oct a faster machine drew reel 11's zoom a few levels off at the edges
  echo "CPU: $(sed -n 's/^model name\s*: //p' /proc/cpuinfo | sed -n 1p), $(nproc) cores$(grep -qw avx512f /proc/cpuinfo && echo ', AVX-512')"
}

try() {   # a time limit of $1 minutes, then one more try with twice the time
  local m=$1; shift
  timeout -k 30 "${m}m" "$@" && return
  echo "::warning::'$*' failed or ran over $m min; trying once more"
  RETRY=1 timeout -k 30 "$((2 * m))m" "$@"
}

offline() {   # step $1's kept .deb files, with no package sources: apt can use only these files and what is installed
  local dir=$DEBS/$1 none
  [ -f "$dir/manifest" ] || return 1
  [ "$(count "$1")" -gt 0 ] || return 0                     # the step needed nothing new on that image
  none=$(mktemp -d); touch "$none/sources.list"
  aptq install -y --no-install-recommends -o APT::Sandbox::User=root \
    -o Dir::Etc::SourceList="$none/sources.list" -o Dir::Etc::SourceParts="$none" "$dir"/*.deb > /dev/null
}

online() {   # the mirror, the way the jobs always installed; apt keeps the .deb files it downloads: they become the cache
  local step=$1 dir=$DEBS/$1
  if [ -n "${RETRY:-}" ]; then
    # the first try's apt can outlive its time limit (sudo runs it in a session of its own) and hold apt's locks
    sudo pkill -KILL -x apt-get || true; sudo pkill -KILL -x dpkg || true
    # Canonical's mirror instead of Azure's, which crawled in West US on 26 Oct
    sudo sed -i 's#http://azure\.archive\.ubuntu\.com/#http://archive.ubuntu.com/#g' \
      /etc/apt/apt-mirrors.txt /etc/apt/sources.list.d/*.sources /etc/apt/sources.list 2> /dev/null || true
  fi
  sudo dpkg --configure -a                                  # a try that was cut off leaves packages half-configured
  sudo apt-get clean                                        # what is in apt's archive afterwards is this step's
  case $step in
    chromium-deps) npx playwright install-deps chromium > /dev/null ;;   # Playwright's own list for its Chromium
    *) sudo apt-get update -qq && aptq install -y "$step" > /dev/null ;;
  esac
  rm -rf "$dir"; mkdir -p "$dir"
  find /var/cache/apt/archives -maxdepth 1 -name '*.deb' -exec cp {} "$dir/" \;
  manifest > "$dir/manifest"; echo "${ImageVersion:-0}" > "$dir/image"
}

install() {   # one step: from the cache when its files fit this machine, else from the mirror
  local t=$SECONDS dir=$DEBS/$1
  if offline "$1"; then
    if [ "$(cat "$dir/image")" != "${ImageVersion:-0}" ]; then   # kept on an earlier image, and they fit this one
      echo "$1: $(count "$1") packages from the cache (runner image $(cat "$dir/image")) in $((SECONDS - t)) s"
      manifest > "$dir/manifest"; echo "${ImageVersion:-0}" > "$dir/image"
    elif manifest | cmp -s - "$dir/manifest"; then
      echo "$1: $(count "$1") packages from the cache in $((SECONDS - t)) s; the package list matches the mirror install's"
    else
      echo "::warning::$1: installed from the cache, but the package list differs from the mirror install's:"
      { manifest | diff "$dir/manifest" - || true; } | sed -n 1,20p
    fi
  else
    [ -f "$dir/manifest" ] && echo "::warning::$1: the cached packages don't fit this machine; installing from the mirror"
    try 5 bash "$SELF" online "$1"
    echo "$1: $(count "$1") packages from Ubuntu's mirror in $((SECONDS - t)) s"
  fi
}

case ${1:-} in
  key) key ;;
  online) online "$2" ;;
  render) setup; install ffmpeg; try 3 npm install --no-audit --no-fund --loglevel=error
          install chromium-deps; try 5 npx playwright install --only-shell chromium
          ffmpeg -hide_banner -version | sed -n 1p; cpu ;;
  ffmpeg) setup; install ffmpeg; ffmpeg -hide_banner -version | sed -n 1p ;;
  espeak-ng) setup; install espeak-ng; espeak-ng --version ;;
  *) sed -n '2,19p' "$SELF"; exit 2 ;;
esac
