# Move Canvas Realtime Relay — Free-Tier Decision

**Checked:** 2026-11-19  
**Decision state:** Supabase Free selected and configured in Nora Rasuli's owned
organization; no payment method or paid plan required.

## Why a relay exists

The phone and television are separate browsers. They need one small internet
service to discover the same room and exchange semantic controller events.
`BroadcastChannel` proves the product locally but works only between contexts
on the same device. Raw camera video never enters the relay.

Vercel Functions now support WebSockets, but separate connections are not
guaranteed to reach the same function instance. Vercel's own guidance says
durable rooms/pub-sub coordination needs an external shared store. Runtime
Cache is regional, ephemeral, and explicitly not intended for user-specific
state, so it is not being misused as a signaling database.

## Current free options

| Option | Free allowance relevant to this product | Payment method / overage behavior | Fit | Decision |
|---|---|---|---|---|
| Supabase Realtime Free | 200 concurrent connections, 100 messages/second, 2 million messages/month | Free quota lists no overage billing | Existing transport adapter; low implementation cost; private-channel authorization still required | Recommended if created in Nora's verified organization |
| Firebase Realtime Database Spark | 100 simultaneous connections, 1 GB storage, 10 GB/month downloads | No payment method; service stops at Spark quota rather than billing | Strong predictable-cost fallback; requires a new Firebase project and transport adapter | Preferred fallback if Supabase ownership is wrong |
| Ably Free | 200 concurrent connections/channels, 500 messages/second, 6 million messages/month | No card and no time limit | Strong realtime product; secure client token endpoint adds setup | Viable fallback |
| Cloudflare Durable Objects Free | 100,000 requests/day and SQLite-backed state on Workers Free | Operations fail after the daily free limit | Technically excellent room ownership; adds separate Cloudflare deployment and account | Defer unless the app moves from Vercel |

## Recommendation

Use **Supabase Free**. The `Move Canvas` project is in Nora Rasuli's owned
organization. Anonymous sign-in, private channels, topic-scoped authorization,
a bounded anonymous-auth rate limit, and a publishable browser key are now
configured. Firebase Spark remains the no-card fallback if the relay provider
must change later.

## Exit plan

The product protocol is provider-neutral `SessionMessage` data. A replacement
transport implements `send`, `close`, message callback, and connection status.
No game, camera, AI, blueprint, or result code imports a provider SDK directly.

## Sources

- [Supabase Realtime limits](https://supabase.com/docs/guides/realtime/limits)
- [Supabase Realtime pricing](https://supabase.com/docs/guides/realtime/pricing)
- [Firebase Realtime Database limits](https://firebase.google.com/docs/database/usage/limits)
- [Firebase Realtime Database billing](https://firebase.google.com/docs/database/usage/billing)
- [Firebase Spark pricing plan](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans)
- [Ably Free package](https://ably.com/docs/platform/pricing/free)
- [Cloudflare Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/)

