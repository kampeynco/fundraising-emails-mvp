# Active Campaign Integration Setup

## Authentication

Active Campaign uses **API key + account URL** authentication (no OAuth).

- **Header**: `Api-Token: YOUR_API_KEY`
- **Base URL**: `https://{your-account}.api-us1.com/api/3/`

## 1. Get Your API Credentials

1. Log in to your Active Campaign account
2. Go to **Settings** → **Developer**
3. Copy your:
   - **API URL** (e.g., `yourname.api-us1.com`)
   - **API Key**

## 2. Connect in Kampeyn

1. Go to Settings → Integrations
2. Click **Connect** on Active Campaign card
3. Enter your **account URL** (e.g., `yourname.api-us1.com`)
4. Paste your **API key**
5. Click **Connect**

The app validates your credentials by calling `GET /api/3/users/me` before saving.

## Storage

Credentials are stored in the `email_integrations` table:

| Field | Value |
|-------|-------|
| `provider` | `active_campaign` |
| `access_token` | Your API key |
| `server_prefix` | Your account URL |
| `metadata` | `{ account_name: "User Name" }` |

## API Reference

- [Authentication](https://developers.activecampaign.com/reference/authentication)
- [Create Campaign](https://developers.activecampaign.com/reference/create-campaign)
- [Create Message](https://developers.activecampaign.com/reference/create-a-new-message)
- [Lists](https://developers.activecampaign.com/reference/retrieve-all-lists)
