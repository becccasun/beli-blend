# Beli feature proposal

A coded prototype exploring two feature ideas for the Beli restaurant ranking app. This is an unofficial student concept. It is not affiliated with or endorsed by Beli, and all people, scores and activity in it are made up.

**Live demo:** https://becccasun.github.io/beli-blend/

## What is in it

1. **Flexible rating**: when you rank a place, keep the familiar head to head comparison or set the score yourself, with a live preview of where it lands on your list. Open any restaurant and tap "Rank this place".
2. **Blend**: open a friend's profile and request a blend (friends are people who follow each other). Once they accept you get a taste match, then you choose a city together and get one shared list for it. Tap a face on the feed to start one; your blends live under Profile, Blends.

## Run it locally

```bash
npm install
npx next dev -p 3012
```

## Deploy on Vercel

Import this repository at vercel.com/new and keep the defaults (framework: Next.js, no environment variables). `next.config.ts` detects Vercel and skips the static export that GitHub Pages uses, so both hosts build from the same code.

Built with Next.js and Tailwind. Everything is mock data stored in the browser, so there is no backend.
