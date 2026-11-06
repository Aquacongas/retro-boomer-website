# RETRO BOOMER website

A buildless, dependency-free static website. No package installation or build step is required.

## Preview locally

```bash
cd /home/oms/retro-boomer-website
python3 -m http.server 8000 --bind 127.0.0.1
```

Open **http://127.0.0.1:8000/**. Stop the server with `Ctrl+C`.

If Python is unavailable, any static HTTP server can serve this directory. The page has no tracking, remote font requests, or runtime dependencies.

## Files

- `index.html`: semantic page content, metadata, original official destinations, and SVG cassette hardware.
- `styles.css`: responsive visual system, local font definitions, mechanical controls, and reduced-motion styles.
- `script.js`: shared tape transport, manual winding, navigation, and emission inspector.
- `assets/fonts/`: four Latin WOFF2 subsets extracted from the fonts embedded in the original page. See `assets/fonts/LICENSES.md`.

## Tape mechanics

Playback starts stopped at position 0420. Play winds tape from the left supply reel to the right take-up reel. Both hubs turn counterclockwise as viewed from the front; rewind reverses both. Pack radii follow `sqrt(hubRadius² + woundFraction × tapeArea)`, so the combined amount of tape remains constant. Angular speed follows linear tape speed divided by the current radius. Tape movement is conveyed entirely by the reels and changing tape packs; no connecting tape strip is drawn.

One `requestAnimationFrame` loop integrates tape position, hub angles, and acceleration. Stop engages the brake immediately, preserves position, and removes the pencil. Changing direction disengages the old transport before accelerating the new one. End stops automatically disengage the transport. There is no animation loop while stopped, outside the viewport, or in a hidden tab.

The automatic rewind pencil is anchored inside the left hub at a fixed angle. A projected hexagonal prism and moving surface highlights simulate rotation around its longitudinal axis; the pencil never swings around the reel. It is visible only in automatic rewind mode. Drag the hub clockwise to rewind, or use the focused hub's right arrow key; left arrow winds forward by hand. Enter or Space toggles automatic pencil rewind. The three transport buttons also work with native keyboard activation.

The cassette is a silent mechanical interaction. The abbreviated transport takes approximately three minutes to play a complete side and 34 seconds to rewind; the counter indicates tape position, not audio time. There is no invented network data or audio playback. With reduced motion enabled, the reels and pencil do not spin, transport information updates at most eight times a second, and decorative motion is disabled.

## Content

Official download labels use v1.0.1. Original release, source, explorer, Chainquiry, community, and all four mining-pool destinations are retained. External service availability remains controlled by their operators. The emission inspector reproduces all ten original consensus stages, with one billion TAPE per stage. Documentation remains marked coming soon.

All development is local. No commit, push, remote repository edit, or deployment is required to preview this site.
