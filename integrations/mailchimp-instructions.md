# Mailchimp Integration Setup

## Authentication

Mailchimp uses **OAuth 2.0** for authentication.

## 1. Create a Mailchimp App

1. Go to [mailchimp.com/developer](https://mailchimp.com/developer/)
2. Click **Register An App**
3. Fill in:
   - **App name**: Kampeyn
   - **App description**: Fundraising email integration
   - **Redirect URI**: `https://z4yfizmv.us-east.insforge.app/functions/mailchimp-oauth-callback`
4. Copy the **Client ID** and **Client Secret**

## 2. Set InsForge Secrets

```bash
insforge secrets add MAILCHIMP_CLIENT_ID your_client_id_here
insforge secrets add MAILCHIMP_CLIENT_SECRET your_client_secret_here
# MAILCHIMP_REDIRECT_URI is already set automatically
```

## 3. Edge Functions

| Function | Purpose |
|----------|---------|
| `get-mailchimp-oauth-url` | Builds OAuth authorize URL, returns it to frontend |
| `mailchimp-oauth-callback` | Exchanges code → access token, fetches server prefix + audience list, saves to `email_integrations` |

## 4. OAuth Flow

1. User clicks Connect → redirected to `login.mailchimp.com/oauth2/authorize`
2. User approves → Mailchimp redirects to callback with `code`
3. Callback exchanges code at `login.mailchimp.com/oauth2/token`
4. Fetches server prefix via `login.mailchimp.com/oauth2/metadata` (returns `dc` like `us21`)
5. Fetches default audience via `{dc}.api.mailchimp.com/3.0/lists?count=1`
6. Saves to `email_integrations`

## 5. Storage

| Field | Value |
|-------|-------|
| `provider` | `mailchimp` |
| `access_token` | OAuth access token |
| `server_prefix` | Data center (e.g., `us21`) |
| `list_id` | Default audience ID |
| `metadata` | `{ account_name, login_email, list_name }` |

## 6. API Reference

- [OAuth Guide](https://mailchimp.com/developer/marketing/guides/access-user-data-oauth-2/)
- [Marketing API](https://mailchimp.com/developer/marketing/api/)
