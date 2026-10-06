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

- Store access roles exclusively in the server-managed `user_roles` table with owner-only reads; users must never grant themselves a role.
- Demo accounts use real Cloud Auth sign-in and explicitly marked demo roles; a demo CEO role never grants administrative privileges.
- Resolve account roles through an authenticated server function, not role selectors, metadata, or browser storage.
- Keep sign-in and the HR workspace on the public index shell; every private action must validate the caller on the server.
- Keep global visual roles in semantic CSS tokens and use the existing Button component for interactive actions.
