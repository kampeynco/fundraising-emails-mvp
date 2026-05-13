import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") as string;
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string;
const PROJECT_REF = "npxklgkoemybgivdrmka";
const FROM_EMAIL = "Fundraising Emails <noreply@fundraisingemails.com>";

// ── Subject lines per action type ──────────────────────────────
const SUBJECTS: Record<string, string> = {
  signup: "Confirm your Fundraising Emails account",
  magiclink: "Your sign-in link for Fundraising Emails",
  recovery: "Reset your Fundraising Emails password",
  invite: "You've been invited to Fundraising Emails",
  email_change: "Confirm your new email for Fundraising Emails",
};

// ── Branded HTML templates ─────────────────────────────────────
// Each template has {{confirmation_url}} and {{fallback_url}} placeholders
function buildTemplate(
  heading: string,
  bodyText: string,
  ctaLabel: string,
  footerNote: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#faf8f5;font-family:'DM Sans',system-ui,sans-serif;color:#0f2137;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf8f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(15,33,55,0.08),0 4px 12px rgba(15,33,55,0.04);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f2137,#142d48);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;font-family:'Playfair Display',Georgia,serif;font-size:22px;font-weight:700;letter-spacing:-0.02em;color:#ffffff;">
                Fundraising <span style="color:#e8614d;">Emails</span>
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 8px;font-family:'Playfair Display',Georgia,serif;font-size:24px;font-weight:700;color:#0f2137;">
                ${heading}
              </h2>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#5c7db5;">
                ${bodyText}
              </p>
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="{{confirmation_url}}" target="_blank" style="display:inline-block;padding:14px 32px;background-color:#e8614d;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;letter-spacing:0.01em;">
                      ${ctaLabel}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#8ba3cc;">
                If the button doesn't work, copy and paste this URL into your browser:
              </p>
              <p style="margin:0 0 24px;font-size:12px;line-height:1.5;color:#8ba3cc;word-break:break-all;background-color:#f0f3f9;padding:12px 16px;border-radius:8px;">
                {{confirmation_url}}
              </p>
              <hr style="border:none;border-top:1px solid #dce3f0;margin:24px 0;" />
              <p style="margin:0;font-size:12px;line-height:1.5;color:#8ba3cc;">
                ${footerNote}
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f0f3f9;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#8ba3cc;">
                &copy; 2026 Fundraising Emails. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const TEMPLATES: Record<string, string> = {
  signup: buildTemplate(
    "Welcome aboard! \ud83c\udf89",
    "Thanks for signing up. Confirm your email to activate your account and start raising more with every send.",
    "Confirm My Account",
    "If you didn't create this account, you can safely ignore this email."
  ),
  magiclink: buildTemplate(
    "Sign in to your account",
    "Click the button below to securely sign in. This link expires in 24 hours and can only be used once.",
    "Sign In with Magic Link",
    "If you didn't request this email, you can safely ignore it. No changes will be made to your account."
  ),
  recovery: buildTemplate(
    "Reset your password",
    "We received a request to reset the password for your account. Click the button below to choose a new password.",
    "Reset Password",
    "If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged."
  ),
  invite: buildTemplate(
    "You've been invited!",
    "You've been invited to join Fundraising Emails \u2014 the platform that helps campaigns raise more with every send. Click below to accept your invitation and set up your account.",
    "Accept Invitation",
    "If you weren't expecting this invitation, you can safely ignore this email."
  ),
  email_change: buildTemplate(
    "Confirm your new email",
    "Click the button below to confirm changing your email address to this new one.",
    "Confirm Email Change",
    "If you didn't request this change, please contact support immediately."
  ),
};

// ── Build confirmation URL from hook data ──────────────────────
function buildConfirmationUrl(
  tokenHash: string,
  actionType: string,
  redirectTo: string
): string {
  const params = new URLSearchParams({
    token: tokenHash,
    type: actionType,
    redirect_to: redirectTo,
  });
  return `https://${PROJECT_REF}.supabase.co/auth/v1/verify?${params.toString()}`;
}

// ── Edge Function handler ──────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);
  const base64Secret = hookSecret.replace("v1,whsec_", "");
  const wh = new Webhook(base64Secret);

  try {
    const { user, email_data } = wh.verify(payload, headers) as {
      user: {
        email: string;
        email_change_new?: string;
      };
      email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
        site_url: string;
        token_new: string;
        token_hash_new: string;
      };
    };

    const actionType = email_data.email_action_type;
    const subject = SUBJECTS[actionType] || "Notification from Fundraising Emails";
    const template = TEMPLATES[actionType];

    if (!template) {
      console.warn(`No template for action type: ${actionType}`);
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle email_change with potential dual-email sending
    const emailsToSend: Array<{ to: string; html: string; subject: string }> = [];

    if (actionType === "email_change" && email_data.token_hash_new && email_data.token_new) {
      // Secure email change: send to BOTH current and new email
      // IMPORTANT: token_hash_new goes with CURRENT email, token_hash goes with NEW email
      const currentEmailUrl = buildConfirmationUrl(
        email_data.token_hash_new,
        actionType,
        email_data.redirect_to
      );
      const newEmailUrl = buildConfirmationUrl(
        email_data.token_hash,
        actionType,
        email_data.redirect_to
      );

      emailsToSend.push({
        to: user.email,
        html: template.replaceAll("{{confirmation_url}}", currentEmailUrl),
        subject: "Confirm email change for Fundraising Emails",
      });

      if (user.email_change_new) {
        emailsToSend.push({
          to: user.email_change_new,
          html: template.replaceAll("{{confirmation_url}}", newEmailUrl),
          subject,
        });
      }
    } else {
      // Standard single-email flow
      const confirmationUrl = buildConfirmationUrl(
        email_data.token_hash,
        actionType,
        email_data.redirect_to
      );
      emailsToSend.push({
        to: user.email,
        html: template.replaceAll("{{confirmation_url}}", confirmationUrl),
        subject,
      });
    }

    // Send all emails via Resend
    for (const email of emailsToSend) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [email.to],
          subject: email.subject,
          html: email.html,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error(`Resend API error for ${email.to}:`, errBody);
        throw new Error(`Resend API error: ${res.status} — ${errBody}`);
      }

      const data = await res.json();
      console.log(`Email sent to ${email.to}, id: ${data.id}`);
    }
  } catch (error: unknown) {
    const err = error as Error & { code?: number };
    console.error("Send email hook error:", err.message);
    return new Response(
      JSON.stringify({
        error: {
          http_code: err.code || 500,
          message: err.message,
        },
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
