<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Application rules
- Keep shared brand navigation and footer in `src/components/brand` and mount them around the root Outlet so every content route uses the same shell.
- Keep the supplied design system in `src/styles.css` verbatim; use token-based utilities in brand components so replacing a brand token does not require component edits.
- Keep the palette reference data separate from the reference route, with literal Tailwind token classes, so class discovery includes every swatch without a second color source.
- Keep training views frontend-only; all training data, types, filters and price helpers are consumed through src/lib/szkolenia/adapter.ts, the only module allowed to import mock-dane.ts, so replacing the data source does not require view edits.
- Keep catalog URL state in the file route loader dependencies and debounce search replacements, so filtering is shareable without cluttering browser history.
- Keep the training icon mapping, price block and metric rendering shared across catalog and detail views, so their representations stay consistent.
- Keep the Vite pre-load repair for the accidental comment terminator in the supplied CSS prose; repair compiler input only so the owner's stylesheet remains byte-for-byte intact.
