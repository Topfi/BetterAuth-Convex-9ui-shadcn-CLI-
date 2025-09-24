admin, root, etc.

Forgot flow

Which username is used, where and how

Add a small easter egg. Wherever a username or email field is, we provide a preview/example (currently Bob76 and m@example.com). When a person accesses a page containing such a field, randomly select a username and mail for a person from a list and populate these fields with that. The list should be of famous computer science historical figures such as Turing, Ada, etc. 

What is cors currently and should that be changed?

add toast Value is too large, add toast for for existing email

hide error

Look through AGENTS.md, are there any redundancies we should remove, formating to improve, things to clarify, etc?

AGENTS.md was written to contain a series of requirements for this code, but only has been applied in more recent steps. That means, previously made code may not fully comply with the requirements. Please write out the main requirements we are not fully covering yet one by one and then provide a clear step by step plan with pauses in between where I can check on your work to implement and cover all requirements in AGENTS.md. Essentially, a series of simple, dedicated tasks to get the codebase fully aligned with AGENTS.md.

logging, rate limit, hibp, zxcvbn

[unduck](https://github.com/T3-Content/unduck), share in sm, feature request with voting

Consider how to best go about implementing Passkey as an additional login solution considering the requirements we have (mail, username, passphrase as fallback). Write an extensive plan for me to look over and confirm. Use this for reference: ""

stackable toasts, promises, toast rule in regard to visibility, dismiss toast, only for network stuff, indicator where the info is needed

Settings 2FA, Passphrase change

1. Adopt Custom Function Wrappers (createAuthQuery, createAuthMutation)
This is the single most impactful architectural pattern C2 could adopt from C1.

What to Adopt: The pattern from C1's convex/functions.ts, which uses convex-helpers (zCustomQuery, zCustomMutation) to create reusable function builders like createAuthQuery, createPublicQuery, and createAuthMutation.
Why It's an Improvement:
Declarative vs. Imperative: C2's current approach is imperative. For example, a mutation would start with const userId = await getUserId(ctx); if (!userId) { ... }. C1's approach is declarative: you wrap the function in createAuthMutation({...}), and the authentication check is handled automatically. This is cleaner, less error-prone, and perfectly aligns with C2's rule-driven philosophy.
Centralized Logic: This pattern centralizes all cross-cutting concerns. Authentication, role checks, rate limiting, and even audit logging can be baked into these wrappers. C2 already has an auditMiddleware in its convex/features/auth.ts; this logic could be more cleanly integrated into these custom wrappers.
Improved Developer Experience (DX): It makes writing new backend functions faster and safer. A developer simply chooses the right wrapper (createAuthMutation, createAdminMutation, etc.) and can focus entirely on the business logic, knowing the necessary guards are already in place.
How to Implement in C2:
Create a new file, perhaps convex/lib/functions.ts or convex/trpc.ts (to borrow a familiar naming convention).
Use zCustomMutation and zCustomQuery from convex-helpers as the foundation.
Create wrappers like createAuthMutation. Inside the custom context (customCtx), perform the authentication check by calling authComponent.getAuthUser(ctx).
Crucially, integrate C2's existing strengths: The onSuccess and onError logic from C2's logAndThrow audit helper can be built directly into these wrappers, making audit logging an automatic side-effect of using the right function type.
Refactor existing functions in files like convex/features/counter.ts to use the new wrappers instead of raw mutation and query.
2. Implement the Full Organization Management API
C2 has the schema for multi-tenancy via the Better Auth organization plugin, but C1 has a complete, practical implementation of the API needed to manage it.

What to Adopt: The logic and function signatures from C1's convex/organization.ts. This includes functions for:
Creating, updating, and deleting organizations.
Inviting, accepting/rejecting, and removing members.
Listing a user's organizations.
Setting the active organization for a session.
Transferring ownership.
Why It's an Improvement: This would make C2 a far more extensive and feature-complete reference implementation. Multi-tenancy is a core requirement for most SaaS applications, and C1 provides a battle-tested blueprint for it. It elevates C2 from a simple auth example to a true multi-tenant auth solution.
How to Implement in C2:
Create a convex/features/organization.ts file.
Adapt the functions from C1's convex/organization.ts, replacing its custom function wrappers with the new ones created in the step above.
Integrate C2's superior security patterns. For example, wrap the inviteMember and deleteOrganization logic with logAndThrow to create detailed audit logs for these sensitive actions.
Ensure all database interactions use C2's established patterns for data access.
3. Implement the Client-Side AuthErrorBoundary
C1 includes a simple but highly effective pattern for handling expired or invalid sessions on the client that C2 lacks.

What to Adopt: The React error boundary component from src/lib/convex/components/auth-error-boundary.tsx.
Why It's an Improvement:
Graceful Error Handling: Convex queries will throw an UNAUTHENTICATED error if a user's session token becomes invalid while they are using the app. Without an error boundary, this will crash the React component tree. C1's boundary catches this specific error, automatically signs the user out, and reloads the page. This is a much smoother and more professional user experience than a generic error message or a crashed UI.
Resilience: It makes the application more resilient to session desynchronization issues, which can occur in long-lived single-page applications.
How to Implement in C2:
Copy the AuthErrorBoundary component from C1 into a similar directory in C2, like src/lib/auth/.
Adapt the signOut() call to use C2's authClient.signOut.
Wrap the application's root layout (inside src/main.tsx or src/App.tsx) with this new <AuthErrorBoundary>.






Next, let us replace the existing loading pages with a loading spinner. Ensure that during loading the keyboard and mouse inputs are locked and that the loader only disappears after the loading process has been fully completed. Use this SVG for the loader: https://raw.githubusercontent.com/n3r4zzurr0/svg-spinners/refs/heads/main/svg-css/pulse.svg











<!DOCTYPE html PUBLIC \\"-//W3C//DTD XHTML 1.0 Transitional//EN\\" \\"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\\"><html dir=\\"ltr\\" lang=\\"en\\"><head><meta content=\\"text/html; charset=UTF-8\\" http-equiv=\\"Content-Type\\"/><meta name=\\"x-apple-disable-message-reformatting\\"/></head><body style=\\"background-color:#ffffff\\"><!--$--><table border=\\"0\\" width=\\"100%\\" cellPadding=\\"0\\" cellSpacing=\\"0\\" role=\\"presentation\\" align=\\"center\\"><tbody><tr><td style=\\"background-color:#ffffff\\"><div style=\\"display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0\\" data-skip-in-text=\\"true\\">Verify your email address<div> ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏ ‌​‍‎‏</div></div><table align=\\"center\\" width=\\"100%\\" border=\\"0\\" cellPadding=\\"0\\" cellSpacing=\\"0\\" role=\\"presentation\\" style=\\"max-width:37.5em;padding-left:12px;padding-right:12px;margin:0 auto\\"><tbody><tr style=\\"width:100%\\"><td><h1 style=\\"color:#333;font-family:-apple-system, BlinkMacSystemFont, &#x27;Segoe UI&#x27;, &#x27;Roboto&#x27;, &#x27;Oxygen&#x27;, &#x27;Ubuntu&#x27;, &#x27;Cantarell&#x27;, &#x27;Fira Sans&#x27;, &#x27;Droid Sans&#x27;, &#x27;Helvetica Neue&#x27;, sans-serif;font-size:24px;font-weight:bold;margin:40px 0;padding:0\\">Verify your email</h1><a href=\\"https://brainy-canary-912.convex.site/api/auth/verify-email?token=eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImJvYjEyM0BmbS5jb20iLCJpYXQiOjE3NTgyNzk4NTIsImV4cCI6MTc1ODI4MzQ1Mn0.trZ70lfWYDV3oZ5JGOJX8TuPtJA1czTLDKhF0VZ8uVU&amp;callbackURL=/\\" style=\\"color:#2754C5;text-decoration-line:none;font-family:-apple-system, BlinkMacSystemFont, &#x27;Segoe UI&#x27;, &#x27;Roboto&#x27;, &#x27;Oxygen&#x27;, &#x27;Ubuntu&#x27;, &#x27;Cantarell&#x27;, &#x27;Fira Sans&#x27;, &#x27;Droid Sans&#x27;, &#x27;Helvetica Neue&#x27;, sans-serif;font-size:14px;text-decoration:underline;display:block;margin-bottom:16px\\" target=\\"_blank\\">Click here to verify your email address</a><p style=\\"font-size:14px;line-height:24px;color:#ababab;font-family:-apple-system, BlinkMacSystemFont, &#x27;Segoe UI&#x27;, &#x27;Roboto&#x27;, &#x27;Oxygen&#x27;, &#x27;Ubuntu&#x27;, &#x27;Cantarell&#x27;, &#x27;Fira Sans&#x27;, &#x27;Droid Sans&#x27;, &#x27;Helvetica Neue&#x27;, sans-serif;margin:24px 0;margin-top:14px;margin-bottom:16px;margin-right:0;margin-left:0\\">If you didn&#x27;t create an account, you can safely ignore this email.</p><p style=\\"font-size:12px;line-height:22px;color:#898989;font-family:-apple-system, BlinkMacSystemFont, &#x27;Segoe UI&#x27;, &#x27;Roboto&#x27;, &#x27;Oxygen&#x27;, &#x27;Ubuntu&#x27;, &#x27;Cantarell&#x27;, &#x27;Fira Sans&#x27;, &#x27;Droid Sans&#x27;, &#x27;Helvetica Neue&#x27;, sans-serif;margin-top:12px;margin-bottom:24px\\">Thanks for using our app.</p></td></tr></tbody></table></td></tr></tbody></table><!--7--><!--/$--></body></html>
