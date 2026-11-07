# PayoutFlow

A front-end demo of an enterprise payout and payment platform: a marketing site,
a merchant dashboard, and a hosted checkout experience.

**This is a UI demonstration. It has no backend and no database. It processes no
real money and transmits nothing.** All data is generated in the browser and
kept in `localStorage`.

## Run it

```bash
node server.js
# then open http://localhost:12000
```

The only dependency is Node 18+ (for the static file server). The app itself is
plain HTML, CSS and ES modules — no build step, no framework.

## What's here

| Page | Path | What it shows |
| --- | --- | --- |
| Marketing site | `/` | Product overview, payment methods, security, pricing |
| Dashboard | `/dashboard.html` | Overview, payouts, recipients, checkout, ledger, audit, webhooks, API keys, settings |
| Checkout | `/checkout.html` | Hosted payment page with card, bank, mobile money, wallet, crypto and cash |

The checkout accepts `?amount=` and `?desc=` so you can link to it with a
specific amount, e.g. `/checkout.html?amount=349.50&desc=Invoice%2012`.

## Test cards (sandbox)

| Card | Result |
| --- | --- |
| `4242 4242 4242 4242` | Succeeds |
| `4000 0000 0000 0002` | Declined |

## Features

**Dashboard**
- Available balance derived from an immutable ledger (never stored as a balance)
- Payout creation with fee preview, recipient selection and balance checks
- Payout detail with a status timeline; cancel payouts still in flight
- Recipient directory across bank, mobile money, card and wallet rails
- Search and status filtering with pagination
- Ledger with a running balance column
- Audit log, webhook endpoints with delivery history, API key create/revoke
- Demo data reset

**Checkout**
- Six payment methods with method-specific instructions
- Live card preview (brand detection, formatting) as you type
- Luhn validation, expiry and CVC checks with inline errors
- Simulated processing, then a receipt or a decline

**Design**
- Dark, premium fintech aesthetic with a shared design-token layer
- Fully responsive: sidebar collapses to a drawer, grids reflow, tables scroll
- Accessible: semantic landmarks, focus-visible states, ARIA on tabs/dialogs,
  reduced-motion support

## Layout

```
public/
  index.html            marketing site
  dashboard.html        dashboard shell
  checkout.html         hosted checkout
  assets/
    css/theme.css       design tokens + shared components
    css/site.css        marketing styles
    css/dashboard.css   dashboard styles
    css/checkout.css    checkout styles
    js/app.js           shared helpers (DOM, formatting, toast, modal)
    js/demo-store.js    in-browser demo data
    js/chart.js         dependency-free SVG charts
    js/landing.js       marketing interactions
    js/dashboard.js     dashboard application
    js/checkout.js      checkout application
server.js               static file server
```

## Notes on scope

This project deliberately contains no server-side payment code. A real
implementation would put card data collection inside a PCI-DSS compliant
provider's iframe, verify identity (KYC/AML), screen sanctions, and settle
through licensed payment rails. Those are out of scope here by design.
