# ML engineer portfolio template

A single-page portfolio for machine learning engineers. It's plain HTML, CSS and a little JavaScript, with no build step and no dependencies, so it deploys to GitHub Pages as-is.

The hero is a t-SNE-style **work map**. Each featured project is a point, grouped into clusters by area. On page load the points drift out of random noise into their clusters, and selecting a point jumps to that project's write-up. The map is generated from the projects on the page, so you never edit coordinates by hand.

**What's included**

- Hero with name, a one-sentence summary, current role, location, availability and links
- Selected work, where each project carries a headline result (for example "94.1% routing accuracy")
- Experience timeline, writing and talks in citation style, a grouped toolbox, and contact
- Automatic light and dark themes using colours sampled from the viridis colormap
- Responsive down to 320px wide, keyboard accessible, and honours reduced-motion settings
- Placeholder content for a fictional engineer, Alex Rivera, so you can see how real copy looks before writing your own

## Use it

1. Click **Use this template** on GitHub, or clone the repo:
   ```bash
   git clone https://github.com/<you>/<this-repo>.git my-portfolio
   cd my-portfolio
   ```
2. Preview it locally:
   ```bash
   python3 -m http.server 8000
   # open http://localhost:8000
   ```
   Opening `index.html` directly also works.

## Make it yours

All content lives in **`index.html`**. Each section starts with a `<!-- ===== SECTION ===== -->` comment so it's easy to find.

| What | Where |
| --- | --- |
| Name, page title, link-preview text | `<head>` and the `.hero` section in `index.html` |
| Projects | `<article class="project">` blocks in `#work` |
| Experience, writing, toolbox, contact | Their sections in `index.html` |
| Résumé | Replace `assets/resume.pdf`, keeping the same file name |
| Colours and fonts | Tokens at the top of `assets/css/style.css` |
| Favicon | `assets/favicon.svg` |

### Projects and the work map

Each project looks like this:

```html
<article class="project" id="legal-search" data-area="Retrieval">
  …
</article>
```

- `data-area` sets which cluster the project joins on the map. Projects with the same value are grouped together, and the cluster is labelled with that text. Up to six areas get their own colour.
- `id` is the target the map point links to. Keep it unique.
- The map and the coloured project markers update automatically when you add, remove or regroup projects.

To change the map's density, layout or animation length, edit the settings at the top of `assets/js/map.js`. `SEED` gives you a different arrangement that stays the same on every visit.

### Colours

The palette is a set of CSS custom properties on `:root`, with a matching set under `@media (prefers-color-scheme: dark)`. `--area-1` to `--area-6` colour the map clusters and the project markers. The rest (`--paper`, `--ink`, `--muted`, `--rule`, `--link`) set the page.

### Fonts

The site uses [Archivo](https://fonts.google.com/specimen/Archivo) from Google Fonts. The headline styles use its width axis (`font-stretch`), so if you switch fonts, choose a variable font with a width axis or adjust the `font-stretch` values in `style.css`.

## Deploy to GitHub Pages

1. Push the repo to GitHub.
2. In **Settings → Pages**, set **Source** to *Deploy from a branch*, then choose `main` and `/ (root)`.
3. The site goes live at `https://<you>.github.io/<repo>/` within a minute or two.

To publish at `https://<you>.github.io/`, name the repository `<you>.github.io`.

The empty `.nojekyll` file tells GitHub Pages to serve the files exactly as they are.

## Structure

```
index.html            All page content
assets/
  css/style.css       Layout, type and colour tokens
  js/map.js           Draws the work map from the projects on the page
  favicon.svg
  resume.pdf          Placeholder; replace with yours
```

## License

MIT. See [LICENSE](LICENSE).
