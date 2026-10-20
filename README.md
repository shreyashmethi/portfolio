# Shreyash Methi — portfolio

Personal site for Shreyash Methi, machine learning engineer. Plain HTML, CSS and a little JavaScript, with no build step, so it deploys to GitHub Pages as-is.

The hero chart is an illustrative "ratchet" run: each dot is one round in which an agent proposes a change to a production model, and only changes that pass the validation gates are kept. The start point, end point (+9.5% Recall@20%) and round count (425) match the real run; the path between them is generated from a fixed seed in `assets/js/ratchet.js`.

## Preview locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Edit

| What | Where |
| --- | --- |
| All page copy | `index.html` (each section starts with a `<!-- ===== SECTION ===== -->` comment) |
| Résumé | Replace `assets/resume.pdf`, keeping the file name |
| Colours and type | Tokens at the top of `assets/css/style.css` (light and dark sets) |
| Hero chart | Settings at the top of `assets/js/ratchet.js` |

`assets/js/map.js` is left over from the original template and is no longer loaded; it can be deleted.

## Deploy to GitHub Pages

In **Settings → Pages**, set **Source** to *Deploy from a branch*, choose `main` and `/ (root)`. To serve it at `https://shreyashmethi.github.io/`, rename the repository to `shreyashmethi.github.io`.

## License

MIT. See [LICENSE](LICENSE).
