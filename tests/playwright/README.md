Playwright Starter — Festival tests

Prerequisites

- Node.js installed
- From project root, install Playwright and dependencies:

```bash
npm i -D @playwright/test
npx playwright install
```

Configure environment variables (examples):

```bash
export API_FESTIVAL=http://localhost:3015
export FRONTEND_URL=http://localhost:3000
export JUDGE_TOKEN=eyJ...   # token for a judge user
export JUDGE_USER='{"id":123,"name":"Jurado A"}'
# Optional (if you want tests to set session via API):
export ADMIN_TOKEN=eyJ...   # admin token
export SESSION_ID=45
export CANDIDATE_ID=321
```

Running the tests

```bash
npx playwright test tests/playwright/festival.spec.js
```

Notes

- The test is a starter template: depending on your backend API routes you may need to adjust the session activation call.
- The judge area route used is `/festival-forro/judge` — change `FRONTEND_URL` or the path in the spec if your app uses a different route.
- The test seeds `localStorage` with `token` and `user` before the page loads to simulate a logged-in judge.

If you want, I can:
- Extend the spec to cover admin flows (create session, add judges, activate candidate) using API calls.
- Add GitHub Action workflow to run Playwright tests in CI.
