# Action Network Integration Setup

## Authentication

Action Network uses **API key** authentication (no OAuth).

- **Header**: `OSDI-API-Token: YOUR_API_KEY`
- **Base URL**: `https://actionnetwork.org/api/v2/`

## 1. Get Your API Key

1. Log in to your Action Network account
2. Go to **Settings** → **API & Sync** → **Your API Key**
3. If you don't see an API key section, you may need to request API access from Action Network support
4. Copy the API key

## 2. Connect in Kampeyn

1. Go to Settings → Integrations
2. Click **Connect** on the Action Network card
3. Paste your API key
4. Click **Connect**

The app validates your key by calling `GET /api/v2/` and checking the response.

## 3. Storage

| Field | Value |
|-------|-------|
| `provider` | `action_network` |
| `access_token` | Your API key |
| `metadata` | `{ account_name: "motd from API" }` |

## 4. API Reference

- [OSDI API Overview](https://actionnetwork.org/docs/)
- [People (Contacts)](https://actionnetwork.org/docs/v2/people)
- [Messages](https://actionnetwork.org/docs/v2/messages)
- [Wrappers](https://actionnetwork.org/docs/v2/wrappers)
