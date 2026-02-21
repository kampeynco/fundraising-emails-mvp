# Email Templates

Branded HTML email templates for Supabase Auth notifications. These match the Fundraising Emails brand — navy header, coral CTA, Playfair Display logo.

## Templates

| Template | Supabase Setting | Subject Line |
|---|---|---|
| `magic-link.html` | Magic Link | Your sign-in link for Fundraising Emails |
| `confirm-signup.html` | Confirm signup | Confirm your Fundraising Emails account |
| `reset-password.html` | Reset password | Reset your Fundraising Emails password |
| `invite-user.html` | Invite user | You've been invited to Fundraising Emails |
| `change-email.html` | Change email address | Confirm your new email for Fundraising Emails |

## Setup Instructions

1. Open your **Supabase Dashboard**
2. Navigate to **Authentication → Email Templates**
3. For each template:
   - Select the template type (e.g., "Magic Link")
   - Set the **Subject** from the table above
   - Paste the corresponding HTML file contents into the **Body** field
   - Click **Save**

## Template Variables

These templates use Supabase's built-in variables:

| Variable | Description |
|---|---|
| `{{ .ConfirmationURL }}` | Action URL (magic link, confirmation, reset) |
| `{{ .Token }}` | 6-digit OTP code |
| `{{ .TokenHash }}` | Hashed token for PKCE flow |
| `{{ .SiteURL }}` | Your app's site URL |
| `{{ .Email }}` | User's email address |

## Auth Hook (Redirect URL)

Make sure your Supabase project has the correct **Site URL** and **Redirect URLs** configured:

1. Go to **Authentication → URL Configuration**
2. Set **Site URL** to your production URL (e.g., `https://fundraisingemails.com`)
3. Add these to **Redirect URLs**:
   - `http://localhost:5173/login` (development)
   - `http://localhost:5173/dashboard` (development)
   - `https://yourdomain.com/login` (production)
   - `https://yourdomain.com/dashboard` (production)

## Brand Design

All templates use the Fundraising Emails design system:

- **Header**: Navy gradient (`#0f2137` → `#142d48`)
- **Logo**: Playfair Display serif, white with coral "Emails"
- **CTA Button**: Coral (`#e8614d`)
- **Background**: Cream (`#faf8f5`)
- **Body text**: DM Sans, navy (`#0f2137`) and muted blue (`#5c7db5`)
- **Footer**: Light navy tint (`#f0f3f9`)
