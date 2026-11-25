<#ftl output_format="plainText">
Your password was changed

Hi ${(user.firstName)!user.username},

The password of your PartyHub account was just changed.

When: ${event.date?datetime}
From: IP address ${event.ipAddress}

If this was you, there is nothing else to do.

If this wasn't you, reset your password right away so nobody else can use your account:
${properties.partyhubResetUrl}

Need help? Write to ${properties.partyhubSupportEmail}.

---
This is a security message about your PartyHub account. It is sent even if you turned notifications off.
PartyHub never asks for your password by e-mail.
