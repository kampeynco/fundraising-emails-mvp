# Campaigner Integration Setup

## Authentication

Campaigner uses **API key** authentication via the `IntegrationKey` header.

- **Header**: `IntegrationKey: YOUR_INTEGRATION_KEY`
- **Base URL**: `https://api.campaigner.com/v1/`

## 1. Get Your Integration Key

1. Log in to your Campaigner account
2. Go to **Account Settings** → **Integration Keys**
3. Click **Create A New Integration Key**
4. Give it a description (e.g., "Kampeyn")
5. Copy the generated key

## 2. Connect in Kampeyn

1. Go to Settings → Integrations
2. Click **Connect** on the Campaigner card
3. Paste your Integration Key
4. Click **Connect**

The app validates your key by calling `GET /v1/Lists` before saving.

## 3. Storage

| Field | Value |
|-------|-------|
| `provider` | `campaigner` |
| `access_token` | Your Integration Key |
| `metadata` | `{ account_name: "Campaigner" }` |

## 4. API Reference

- [Authentication](https://api.campaigner.com/docs/#tag/auth)
- [Create Email Campaign](https://api.campaigner.com/docs/#tag/email/operation/emailv1campaign)
- [Set Campaign Recipients](https://api.campaigner.com/docs/#tag/email/operation/emailv1campaignidrecipients_put)
- [Lists](https://api.campaigner.com/docs/#tag/list/operation/listsv1)
