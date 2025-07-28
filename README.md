This is a [Next.js](https://nextjs.org) flight tracking application that visualizes aircraft data with interactive maps using Leaflet.

## Installation

First, clone the repository and install all dependencies:

```bash
# Install all project dependencies
npm install

# Install TypeScript definitions for Leaflet
npm install --save-dev @types/leaflet
```

## Environment Setup

1. Copy the environment template file:
   ```bash
   cp env.template .env.local
   ```

2. Edit `.env.local` and add your OpenWeatherMap API key:
   - Get a free API key at: https://openweathermap.org/api
   - Replace `your_openweathermap_api_key_here` with your actual API key

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!


## End-to-End Testing (Playwright)

This project uses [Playwright](https://playwright.dev/) for E2E browser testing.

### Setup

If you haven't already, install Playwright and its browsers:

```bash
npx playwright install
```

### Running Tests

To run all E2E tests:

```bash
npx playwright test
```

To run a specific test file:

```bash
npx playwright test tests/e2e/flight-search.spec.ts
```

### Viewing Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

### Notes
- By default, only Desktop Chrome tests are run (see `playwright.config.ts`).
- The Next.js dev server will be started automatically if not already running.
- If you see timeouts, ensure your local server and data are loading correctly.
- For troubleshooting, check the `test-results/` and `playwright-report/` folders for screenshots and videos of failures.
