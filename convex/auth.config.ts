export default {
  providers: [
    {
      // Convex reads this file in its own runtime; Next.js .env.local variables
      // are not guaranteed to be available here, so use a concrete Clerk domain.
      domain: "https://enabling-drake-96.clerk.accounts.dev",
      applicationID: 'convex',
    },
  ],
}