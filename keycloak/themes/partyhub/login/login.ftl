<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password'); section>
    <#if section = "header">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
    <#elseif section = "form">
        <div class="brand-header">
            <h1>PartyHub</h1>
            <p class="brand-tagline">Discover &amp; Share</p>
            <p class="brand-subtitle">${msg("loginTitle",(realm.displayName!""))?no_esc}</p>
        </div>

        <div id="kc-form">
            <div id="kc-form-wrapper">
                <form id="kc-form-login" action="${url.loginAction}" method="post">
                    <input type="text" id="username" name="username"
                           value="${(login.username!'')}"
                           placeholder="${msg("usernameOrEmail")}"
                           autofocus autocomplete="username"
                           minlength="1" maxlength="255" required />

                    <div class="password-wrapper">
                        <input type="password" id="password" name="password"
                               placeholder="${msg("password")}"
                               autocomplete="current-password"
                               minlength="1" maxlength="255" required />
                    </div>

                    <input type="submit" name="login" id="kc-login" value="${msg("doLogIn")}" />

                    <#if realm.resetPasswordAllowed>
                    <div id="kc-form-options">
                        <a href="${url.loginResetCredentialsUrl}">${msg("doForgotPassword")}</a>
                    </div>
                    </#if>
                </form>
            </div>
        </div>

        <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
        <div id="kc-registration">
            <span>${msg("noAccount")}</span>
            <a href="${url.registrationUrl}">${msg("doRegister")}</a>
        </div>
        </#if>
    </#if>
</@layout.registrationLayout>