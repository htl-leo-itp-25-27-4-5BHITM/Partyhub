<#-- Sent by Keycloak's "email" event listener after every password change, including resets. -->
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Montserrat, 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f4f2fa; }
        .container { max-width: 560px; margin: 32px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 30px rgba(26, 16, 64, 0.12); }
        .header { background: #1a1040; padding: 28px 32px; }
        .brand { color: #ffffff; font-size: 22px; font-weight: 700; margin: 0; }
        .brand span { color: #ff2e63; }
        .header h1 { color: #ffffff; font-size: 20px; margin: 12px 0 0; font-weight: 600; }
        .body-content { padding: 28px 32px; color: #241c3d; font-size: 15px; line-height: 1.6; }
        .details { background: #f4f2fa; border-radius: 10px; padding: 12px 16px; margin: 16px 0; font-size: 14px; }
        .details td { padding: 2px 12px 2px 0; }
        .warning { border-left: 4px solid #ff2e63; padding-left: 12px; }
        .actions { text-align: center; margin: 24px 0; }
        .btn { display: inline-block; padding: 13px 28px; background: #ff2e63; color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 600; }
        .muted { color: #6b6385; font-size: 13px; }
        .footer { padding: 18px 32px; background: #f9f8fc; text-align: center; font-size: 12px; color: #8a83a3; }
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <p class="brand">Party<span>Hub</span></p>
        <h1>Your password was changed</h1>
    </div>
    <div class="body-content">
        <p><strong>Hi ${(user.firstName)!user.username},</strong></p>
        <p>The password of your PartyHub account was just changed.</p>
        <table class="details">
            <tr><td>When</td><td>${event.date?datetime}</td></tr>
            <tr><td>From</td><td>IP address ${event.ipAddress}</td></tr>
        </table>
        <p>If this was you, there is nothing else to do.</p>
        <p class="warning">If this wasn't you, reset your password right away so nobody else can use your account.</p>
        <div class="actions">
            <a href="${properties.partyhubResetUrl}" class="btn">This wasn't me</a>
        </div>
        <p class="muted">Need help? Write to ${properties.partyhubSupportEmail}.</p>
    </div>
    <div class="footer">
        <p>This is a security message about your PartyHub account. It is sent even if you turned notifications off.</p>
        <p>PartyHub never asks for your password by e-mail.</p>
    </div>
</div>
</body>
</html>
