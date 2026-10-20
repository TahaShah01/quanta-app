# Quanta

Marketing site and lightweight admin for the Quanta studio. Next.js (App Router), React, Tailwind CSS 4, GSAP + Lenis for scroll, Framer Motion for UI motion, three.js for the background scene.

## Run it

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
npm run lint
```

Content lives in `content/*.json` and is edited through `/admin`.

## Environment

Copy `.env.example` to `.env.local`.

| Variable | Purpose |
| --- | --- |
| `ADMIN_PASSWORD` | Password for `/admin`. In production the admin stays **locked** until this and `SESSION_SECRET` are set. In development it is open. |
| `SESSION_SECRET` | Long random string (32+ chars) that signs the admin and client-portal session cookies. |

## What the admin controls

Everything on the site is data, nothing is edited in code:

| Admin page | Controls |
| --- | --- |
| Projects | Case studies. **Featured on homepage** decides which ones appear on the home page; the rest only show on `/projects`. |
| Team members, Services, Testimonials, FAQ, Blog, Changelog | Their own lists |
| **Partners** | People and companies Quanta works with (shown on `/people`). Has a master switch to hide the whole section. |
| **Clients** | The "closely working with" logo wall on the People page (and optionally the homepage). Master switch plus a separate "also show on homepage" switch. |
| **Client portal** | One login per client plus their project progress, milestones, updates and links. Passwords are generated for you and shown once. Master switch to close the portal. |
| **Site content** | A form editor for every headline, label and paragraph (homepage, all inner pages, navigation and footer, tech stack, legal pages) |
| Settings | Company details, socials, availability, stats, optional-section switches, SEO and the studio time zone |

Sections that are switched off or empty disappear from the page, the menu, the footer and search.

## Where a backend developer plugs in

This repo ships without a server of its own beyond Next.js route handlers writing to `content/*.json`. That is enough for one host with a persistent disk, not for serverless hosting. The swap points are small:

- `lib/content.ts` (`readJSON` / `writeJSON`): every content file goes through these two functions.
- `lib/portal.ts`: client accounts and project progress (stored in `content/portal.json`, passwords hashed with scrypt).
- `lib/auth.ts` and `proxy.ts`: signed-cookie sessions for the admin and the client portal, and the gate in front of every write.
- `app/api/contact/route.ts`: the contact form currently validates and returns success; connect your mail service here.
- Image fields take a URL or a path under `public/`. There is no upload endpoint.

## How the pages fit together

- `components/layout/SiteShell.tsx` wraps every public page: smooth scroll, the 3D scene, navbar, footer, command palette.
- `PageHero`, `PageSection` and `PageCta` (in `components/layout`) are the building blocks for inner pages, so they share the homepage's type, spacing and motion.
- Each hero registers a shape for the 3D scene (`shape="orbit"` etc.). The scene morphs as you move between pages and sections.
- `lib/site.ts` is the one place pages read content from. Homepage copy is in `content/home.json`.
- Press `Ctrl K` / `⌘K` (or `/`) anywhere to open search. It indexes pages, projects and posts automatically.

## The experience layer

Everything below respects `prefers-reduced-motion`, and none of it is required to read or use the site.

| Feature | Where it lives |
| --- | --- |
| Hold-to-enter intro on its own opaque screen (2D canvas particles assemble the brand name, curtain lifts into the hero; auto-opens after ~3.4s, Enter/Space skips) | `components/experience/Preloader.tsx`, `WordmarkCanvas.tsx`, `lib/experience/intro.ts` |
| Curtain page transitions with a label from the link (e.g. the project title) | `components/layout/PageTransition.tsx` |
| Scene reacts to hovered services, projects and team (`data-scene-hover`) | `components/experience/SiteScene.tsx`, `Particles.tsx` |
| Pinned scroll-story case studies (problem, approach, result, counting stats) | `components/projects/CaseStory.tsx` |
| Horizontal rail for projects | `components/projects/ProjectsRail.tsx` |
| Custom cursor (`data-cursor="View"`, `"Drag"`) — fine pointers only | `components/ui/CustomCursor.tsx` |
| Word reveals, magnetic buttons, tilt cards with sheen, masked image reveals | `components/animations/*`, `components/ui/Magnetic.tsx` |
| Circular dark/light reveal from the toggle (View Transitions API) | `components/theme/ThemeProvider.tsx` |
| Scroll-driven background tint per section | `components/ui/SectionTint.tsx` |
| Sound (off by default; hover ticks, mute toggle in the nav) | `lib/sound.ts`, `components/ui/Sound*.tsx` |
| Per-page Open Graph images for projects and posts | `app/**/opengraph-image.tsx`, `lib/og.tsx` |
| Skeletons shaped like each page | `components/ui/PageSkeleton.tsx`, `app/**/loading.tsx` |
| Easter eggs: Konami code, backtick terminal | `components/layout/Easter.tsx` |

Performance: the particle count drops on small screens and low-memory or low-core devices, the pixel ratio is capped at 1.5, and reduced-motion or Save-Data visitors get a static graphic instead of WebGL.
