# Deploy Guide

Instructions for deploying Alluria Protocol to Netlify.

## Prerequisites

- Netlify CLI installed (`npm i -g netlify-cli`)
- Netlify account linked to the project

## Build

```bash
cd alluria-claude-workspace
npx vite build --config vite.config.netlify.ts
```

Output: `dist/public/`

## Deploy

```bash
npx netlify deploy --prod --dir=dist/public
```

## Production URL

**Live:** [https://alluria.oeconomia.io](https://alluria.oeconomia.io)

{% hint style="info" %}
**No Backend Required:** Alluria is a pure client-side dApp. All data comes from on-chain contract reads via Wagmi/Viem — no server or database needed for the frontend.
{% endhint %}
