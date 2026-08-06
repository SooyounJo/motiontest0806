# WebGL Lab

Next.js (Pages Router) + React + raw WebGL canvas starter. Black full-screen background with shareable effect routes.

## Stack

- **yarn** — package manager
- **Next.js 14** — Pages Router (`pages/`)
- **React 18** — UI
- **WebGL** — fullscreen fragment shaders (no Three.js required; add later per effect if needed)

## Quick start

```bash
yarn
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

## File structure (for sharing effects)

```
pages/
  index.js              # Featured effect (hero)
  effects/
    index.js            # Gallery list
    [id].js             # One URL per effect (/effects/iridescent-ring)

components/
  layout/               # Page chrome (overlay nav)
  webgl/
    WebGLCanvas.js      # Canvas shell (fullscreen / contained)
    EffectScene.js      # dynamic() helper, SSR off
    effects/
      index.js          # Registry: id, title, Scene component
      iridescentRing/   # One folder per effect
        shaders.js
        setupIridescentRing.js
        IridescentRingScene.js

hooks/
  useWebGL.js           # Resize, DPR, rAF, dispose

lib/webgl/
  glUtils.js            # createProgram, fullscreen triangle
```

### Adding a new effect

1. Create `components/webgl/effects/myEffect/` with `shaders.js`, `setupMyEffect.js`, `MyEffectScene.js`.
2. Register in `components/webgl/effects/index.js`.
3. `getStaticPaths` on `pages/effects/[id].js` picks it up automatically.

Share link: `https://yoursite.com/effects/my-effect-id`.

## License

Private / project use.
