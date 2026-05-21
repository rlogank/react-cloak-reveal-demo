# React Cloak Reveal Demo

A small Vercel-ready Next.js demo for `CloakReveal`, a React component that reveals text behind a clipped mask.

## Live Demo

- Vercel: https://react-cloak-reveal-demo.vercel.app
- Deploy your own: https://vercel.com/new/clone?repository-url=https://github.com/rlogank/react-cloak-reveal-demo

## What the component does

- Splits a rendered text string into actual measured lines
- Animates each line upward from behind a clipped wrapper
- Supports block reveal mode for arbitrary children
- Uses `IntersectionObserver` by default
- Respects `prefers-reduced-motion`

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy

Import this repo into Vercel or run:

```bash
vercel
```

## Basic usage

```tsx
import CloakReveal from "@/components/CloakReveal";

<CloakReveal as="h1" text="Animated headline" />

<CloakReveal delay={200}>
  <button>Reveal any child content</button>
</CloakReveal>
```
