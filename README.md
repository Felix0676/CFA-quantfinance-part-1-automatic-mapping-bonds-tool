# Sovereign Bond Screening Tool

Mac-first sovereign bond screening app prototype.

## Current Status

This repository currently contains the project governance docs and a dependency-free runnable preview shell.

The preview is not the final Electron app yet. It is the first runnable scaffold so the app can be opened and checked from VS Code before adding package-manager dependencies.

## Run In VS Code

Open this project folder in VS Code, then open a terminal and run:

```bash
node scripts/dev-server.mjs
```

On macOS, the browser should open automatically at:

```text
http://127.0.0.1:4173
```

If it does not open automatically, copy that address into Chrome or Safari.

To stop the preview server, click the terminal and press:

```text
Control + C
```

## What You Should See

You should see a clean light-blue app shell titled:

```text
Sovereign Bond Screening Tool
```

The preview includes:

- Search input
- Region filter
- Sort control
- Update Ranking button
- Sample sovereign bond ranking table
- Scores and confidence calculated by the shared scoring engine
- Expandable score details showing rating score, category scores, and component scores

## Next Development Step

The current preview includes the first scoring engine. The next step is to expand the table UI:

- More visible columns
- Expandable country details
- Pin behavior
- A-Z grouping

## Checks

Run the file scaffold check:

```bash
node scripts/check-files.mjs
```

Run the scoring test:

```bash
node scripts/test-scoring.mjs
```
