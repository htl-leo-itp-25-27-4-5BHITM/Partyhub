<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #0d0b1a;
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .container {
            max-width: 560px;
            margin: 40px auto;
            background: #1a1040;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 8px 30px rgba(0,0,0,0.08);
        }
        .header {
            background: linear-gradient(135deg, #1a1040 0%, #2d1b69 100%);
            padding: 36px 36px 30px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            font-size: 28px;
            font-weight: 700;
            margin: 0;
        }
        .header p {
            color: rgba(255,255,255,0.85);
            font-size: 15px;
            margin: 8px 0 0;
        }
        .body-content {
            padding: 32px 36px;
            color: #e8e0f0;
            font-size: 16px;
            line-height: 1.6;
        }
        .body-content p {
            margin: 0 0 20px;
        }
        .btn-primary {
            display: inline-block;
            padding: 14px 32px;
            background: #ff2e63;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            text-align: center;
            margin: 8px 0 24px;
        }
        .btn-secondary {
            display: inline-block;
            padding: 12px 28px;
            background: rgba(255,255,255,0.08);
            color: #e8e0f0 !important;
            text-decoration: none;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 500;
            text-align: center;
            border: 1px solid rgba(255,255,255,0.15);
        }
        .actions {
            text-align: center;
        }
        .divider {
            height: 1px;
            background: rgba(255,255,255,0.1);
            margin: 28px 0;
        }
        .footer {
            padding: 20px 36px;
            background: rgba(0,0,0,0.2);
            text-align: center;
            font-size: 13px;
            color: #8880a8;
            line-height: 1.5;
        }
        .footer a {
            color: #ff2e63;
            text-decoration: none;
        }
        @media (max-width: 480px) {
            .container { margin: 16px; }
            .body-content { padding: 24px 20px; }
            .header { padding: 28px 20px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>PartyHub</h1>
            <p>Discover &amp; Share Amazing Events</p>
        </div>
        <div class="body-content">
            <p><strong>Hi ${user.firstName!}!</strong></p>
            <p>Welcome to PartyHub! Please verify your email address to get started.</p>

            <div class="actions">
                <a href="${link}" class="btn-primary">
                    Verify Email Address
                </a>
            </div>

            <p style="font-size: 14px; color: #8880a8;">
                Or copy this link into your browser:<br>
                <span style="word-break: break-all;">${link}</span>
            </p>

            <div class="divider"></div>

            <p><strong>Get the PartyHub App</strong></p>
            <p style="font-size: 14px; color: #8880a8;">
                Take PartyHub with you everywhere. Open the app on your iPhone.
            </p>
            <div class="actions">
                <a href="partyhub://" class="btn-secondary">
                    Open PartyHub App
                </a>
            </div>
        </div>
        <div class="footer">
            <p>
                PartyHub &mdash; Discover and share amazing parties and events in your area.
            </p>
        </div>
    </div>
</body>
</html>
