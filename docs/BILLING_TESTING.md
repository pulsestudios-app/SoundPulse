# Google Play Billing Testing

SoundPulse uses `expo-iap` on Android and verifies every purchase on the Railway backend before granting entitlements.

## Google Play Console Setup

1. Create the Android app with package name `com.soundpulseapp.android`.
2. Create these monthly subscription products:
   - `basic_monthly` - Basic - $9.99/month
   - `pro_monthly` - Pro - $13.99/month
   - `unlimited_monthly` - Unlimited - $19.99/month
3. Activate each subscription product and make sure each has an active base plan/offer.
4. Upload an internal testing build signed through Google Play.
5. Add tester Google accounts under **Setup > License testing**.
6. Add the same testers to the app's internal testing track.

## Railway Backend Env Vars

Set these in Railway before testing purchases:

- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`: service account JSON with Android Publisher access.
- `GOOGLE_PLAY_PACKAGE_NAME`: `com.soundpulseapp.android`.
- `APP_SECRET_KEY`: must match `EXPO_PUBLIC_APP_KEY` in the app build env.
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ELEVENLABS_API_KEY`
- `SENTRY_DSN`

For internal tests in a production-like Railway environment, set `ALLOW_PLAY_TEST_PURCHASES=true`.
Remove that override before public production launch unless you intentionally allow Play test purchases.

## Supabase Setup

Run all migrations through `supabase/migrations/20260526230000_google_play_billing.sql`.
The billing migration adds purchase metadata to `subscriptions` and updates generation limits:

- Basic: 10 AI generations/month
- Pro: 30 AI generations/month
- Unlimited: 50 AI generations/month

## Test Purchase Flow

1. Install the Play-distributed internal testing build on a tester account.
2. Sign in to SoundPulse.
3. Open **Profile > Upgrade to Premium**.
4. Confirm that prices load from Google Play, not from hardcoded app text.
5. Buy each tier with a Google Play test card.
6. Confirm the app returns to the previous screen and Profile shows the purchased plan.
7. Confirm Supabase:
   - `profiles.plan` updates to `basic`, `pro`, or `unlimited`.
   - `subscriptions.product_id` matches the Google Play product.
   - `subscriptions.purchase_token` is stored.
   - `subscriptions.expires_at` is set.

## Restore Testing

1. Purchase a subscription on a tester account.
2. Delete and reinstall the app.
3. Sign in with the same SoundPulse account.
4. Open **Upgrade > Restore Purchase**.
5. Confirm the plan is restored and the backend records the verified purchase.

## Cancellation And Renewal Testing

1. Open Google Play Store.
2. Tap profile icon.
3. Tap **Payments & subscriptions > Subscriptions**.
4. Tap SoundPulse.
5. Cancel the active subscription.
6. Confirm SoundPulse continues access until `expires_at`.
7. After the test subscription expires, refresh Profile and confirm the app falls back to Free.

Google Play test subscriptions renew quickly on internal test accounts. Use Play Console order history and Supabase rows to verify renewal/expiration state.
