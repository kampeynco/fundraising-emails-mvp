# HubSpot Integration Setup

## 1. Create a HubSpot Developer App

1. Go to [developers.hubspot.com](https://developers.hubspot.com)
2. Click **Create a developer account** (or log in)
3. Navigate to **Apps** → **Create app**
4. Fill in:
   - **App name**: Kampeyn (or your app name)
   - **Description**: Fundraising email integration
5. Go to the **Auth** tab

## 2. Configure OAuth

Under the **Auth** tab:

1. Set **Redirect URL** to:
   ```
   https://npxklgkoemybgivdrmka.supabase.co/functions/v1/hubspot-oauth-callback
   ```

2. Under **Scopes**, add:
   - `crm.objects.contacts.read`
   - `sales-email-read`

3. Copy the **Client ID** and **Client Secret**

## 3. Set Supabase Secrets

Run these commands (or add via Supabase Dashboard → Edge Functions → Secrets):

```bash
supabase secrets set HUBSPOT_CLIENT_ID=your_client_id_here
supabase secrets set HUBSPOT_CLIENT_SECRET=your_client_secret_here
supabase secrets set HUBSPOT_REDIRECT_URI=https://npxklgkoemybgivdrmka.supabase.co/functions/v1/hubspot-oauth-callback
```

## 4. Edge Functions

| Function | Purpose |
|----------|---------|
| `get-hubspot-oauth-url` | Builds HubSpot OAuth authorize URL, returns it to frontend |
| `hubspot-oauth-callback` | Exchanges auth code for tokens, saves to `email_integrations` |

## 5. Token Details

- **Access token** expires in 30 minutes (1800s)
- **Refresh token** is long-lived — stored in `email_integrations.refresh_token`
- Refresh via `POST https://api.hubspot.com/oauth/v3/token` with `grant_type=refresh_token`

## 6. Test

1. Go to Settings → Integrations
2. Click **Connect** on HubSpot card
3. Approve on HubSpot consent screen
4. Verify redirect back to Settings with "Connected" badge
5. Check `email_integrations` table for `provider: 'hubspot'` row
