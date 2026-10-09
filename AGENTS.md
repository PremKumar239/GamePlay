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

## Storefront architecture
- Keep the homepage, shop and contact page as TanStack leaf routes sharing the Storefront presentation, so navigation and design remain consistent.
- Keep the sample catalog and store facts in a browser-safe store module; orders are WhatsApp enquiries, not payments or confirmed inventory.
- Keep the cart and wishlist in a root-level React provider so shopping selections survive page navigation within the session.
- Use original generated banner and catalog photography instead of unlicensed reference-site assets, so the storefront does not depend on competitor media.
