# Render on your Mac (batch)
1. First time: `git clone <repo-url> && cd aks-productions-motion-engine && git checkout <branch>`
2. Install tools once: `brew install node ffmpeg`
3. Next times: `git pull` (the script runs `npm ci` itself when `node_modules` is missing).
4. Run: `./scripts/mac_batch.sh Contrails-30s Chenab-30s` (any composition ids, space separated).
5. Preview the commands without rendering: `./scripts/mac_batch.sh --dry-run Contrails-30s`
6. It downloads Remotion's Chrome on first use (`npx remotion browser ensure`), uses logical cores minus 1, and keeps the Mac awake (`caffeinate -i`).
7. Videos land in `~/Movies/aks-renders/<id>.mp4`, with the render log next to each as `<id>.log`.
8. It prints the elapsed time per video and continues if one fails; the exit code is non-zero if any failed.
9. Composition ids are listed in `src/Root.tsx` (use the non-silent ones, e.g. `Contrails-30s`).
10. Status: syntax-checked and dry-run tested on Linux only; not yet run on a Mac.
