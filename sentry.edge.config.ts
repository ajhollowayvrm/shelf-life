import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://8934b1c473810eb47adf5660e77e9863@o4511128471273472.ingest.us.sentry.io/4511128484052992",
  tracesSampleRate: 0.5,
  debug: false,
});
