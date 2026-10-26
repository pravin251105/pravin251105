# Setup guide

Your GitHub profile README only works from a **public repo named exactly like your username**:
`Pravin251105/Pravin251105`.

## 1. Create the repo

1. Go to <https://github.com/new>
2. Repository name: `Pravin251105` (must match your username exactly)
3. Public, and tick "Add a README" is **not** needed. Leave it empty.

## 2. Push these files

```bash
cd Pravin251105            # the unzipped folder
git init -b main
git add .
git commit -m "feat: terminal profile"
git remote add origin https://github.com/Pravin251105/Pravin251105.git
git push -u origin main
```

## 3. Allow the workflows to commit

Repo -> **Settings -> Actions -> General -> Workflow permissions** -> choose
**Read and write permissions** -> Save.

## 4. Run the workflows once

Repo -> **Actions** tab:

1. **build-profile** -> *Run workflow*. Fills the live stats card (`assets/stats.svg`).
2. **contribution-snake** -> *Run workflow*. Creates the `output` branch with the snake SVGs.
   (Until this runs once, the snake image in the README shows as broken.)

Both then refresh on a schedule (stats daily, snake every 12h).

Optional: for the `contributions (1y)` line in the stats card, create a classic personal
access token with only the `read:user` scope and save it as a repo secret named `STATS_TOKEN`
(Settings -> Secrets and variables -> Actions). Without it, that line is simply skipped.

## 5. Make it yours

Everything personal lives in **`profile.config.json`**:

| key | what it controls |
| --- | --- |
| `theme` | `"qa"` (QA Command Center: bug-hunter banner, Playwright test run, CI/CD pipeline, Jira board), `"hacker"` (matrix) or `"classic"` |
| `host` | shell prompt host, e.g. `qa-lab` -> `pravin@qa-lab:~$` |
| `skills[].test` | the test title shown for each skill in the Playwright run |
| `board` | Jira-style cards: `{ id, title, tag, to }`, where `to` is the final column (1 In Progress, 2 In Review, 3 Done) |
| `pipeline` | the 5 pipeline stages: `["Name", "sub label"]` |
| `name`, `title`, `handle` | big banner name, subtitle, shell prompt (`handle@github`) |
| `roles` | the lines that type out in the banner (any number) |
| `about` | the `cat about.md` block |
| `skills` | progress bars: `{ "label": "...", "level": 0-100 }` |
| `projects` | `git log` lines + the projects table |
| `now` | the `cat now.txt` block (add or remove keys freely) |
| `contact` | empty strings are skipped; filled ones get a line and a badge |
| `badges` | tech badges under the banner (names from <https://simpleicons.org>) |

Layout and wording of the README itself live in `README.template.md`.
**Do not edit `README.md` directly**; it is regenerated from the template.

## 6. Preview locally (needs Node 18+, no installs)

```bash
npm run build      # regenerates assets/*.svg and README.md
npm run stats      # optional; needs internet, uses GITHUB_TOKEN if set
npm run preview    # writes preview.html, open it in a browser
```

Then `git add -A && git commit -m "update profile" && git push`.
Pushing a change to the config, template or scripts also triggers the **build-profile** workflow.

## Tweaks

* **Speed**: typing speed is `n * 0.055` seconds per character in `scripts/lib.mjs`
  (search for `0.055`). The pause before the loop restarts is the `hold` option (default 6s).
* **Colours**: the `T` palette at the top of `scripts/lib.mjs`.
* **Reduced motion**: visitors with "reduce motion" enabled automatically see the finished
  terminal with no animation.
* **Fonts**: SVGs shown inside a README can't load web fonts, so the stack falls back through
  JetBrains Mono, Fira Code, SF Mono, Menlo, Consolas, then the system monospace. All text is
  width-pinned, so layout stays aligned on every font.

## Troubleshooting

* **Images don't animate**: view the README on github.com, not inside an editor preview.
* **Stats card says "waiting for the first sync"**: run **build-profile** once (step 4).
* **Snake image broken**: run **contribution-snake** once; check the `output` branch exists.
* **Workflow fails on push with 403**: redo step 3 (write permission for Actions).
