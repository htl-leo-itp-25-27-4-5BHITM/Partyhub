<#import "template.ftl" as layout>
<#assign hasFieldErrors = messagesPerField.existsError('firstName','lastName','email','username','password','password-confirm')>
<@layout.registrationLayout displayMessage=!hasFieldErrors; section>
    <#if section = "header">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
    <#elseif section = "form">
        <div class="brand-header">
            <h1>PartyHub</h1>
            <p class="brand-tagline">Discover &amp; Share</p>
        </div>

        <div class="registration-notice" role="status">
            After registering, please verify your email address before you can use your account.
        </div>

        <#if hasFieldErrors>
        <div class="registration-error" role="alert">
            Please correct the highlighted fields. If the username or email address is already registered, choose a different one.
        </div>
        </#if>

        <form id="kc-register-form" action="${url.registrationAction}" method="post">
            <input type="text" id="firstName" name="firstName"
                   value="${(register.formData.firstName!'')}"
                   placeholder="${msg("firstName")}"
                   autocomplete="given-name"
                   minlength="1" maxlength="255" required />
            <#if messagesPerField.existsError('firstName')>
            <p class="field-error" role="alert">${kcSanitize(messagesPerField.get('firstName'))?no_esc}</p>
            </#if>

            <input type="text" id="lastName" name="lastName"
                   value="${(register.formData.lastName!'')}"
                   placeholder="${msg("lastName")}"
                   autocomplete="family-name"
                   minlength="1" maxlength="255" required />
            <#if messagesPerField.existsError('lastName')>
            <p class="field-error" role="alert">${kcSanitize(messagesPerField.get('lastName'))?no_esc}</p>
            </#if>

            <input type="email" id="email" name="email"
                   value="${(register.formData.email!'')}"
                   placeholder="${msg("email")}"
                   autocomplete="email"
                   <#if !realm.registrationEmailAsUsername>required</#if>
                   <#if realm.registrationEmailAsUsername>required</#if> />
            <#if messagesPerField.existsError('email')>
            <p class="field-error" role="alert">${kcSanitize(messagesPerField.get('email'))?no_esc}</p>
            </#if>

            <#if !realm.registrationEmailAsUsername>
            <input type="text" id="username" name="username"
                   value="${(register.formData.username!'')}"
                   placeholder="${msg("username")}"
                   autocomplete="username"
                   minlength="1" maxlength="255" required />
            <#if messagesPerField.existsError('username')>
            <p class="field-error" role="alert">${kcSanitize(messagesPerField.get('username'))?no_esc}</p>
            </#if>
            </#if>

            <#if passwordRequired??>
            <div class="password-wrapper">
                <input type="password" id="password" name="password"
                       placeholder="${msg("password")}"
                       autocomplete="new-password"
                       minlength="8" maxlength="255" required />
            </div>
            <#if messagesPerField.existsError('password')>
            <p class="field-error" role="alert">${kcSanitize(messagesPerField.get('password'))?no_esc}</p>
            </#if>

            <div class="password-wrapper">
                <input type="password" id="password-confirm" name="password-confirm"
                       placeholder="${msg("passwordConfirm")}"
                       autocomplete="new-password"
                       minlength="8" maxlength="255" required />
            </div>
            <#if messagesPerField.existsError('password-confirm')>
            <p class="field-error" role="alert">${kcSanitize(messagesPerField.get('password-confirm'))?no_esc}</p>
            </#if>
            </#if>

            <#if recaptchaRequired??>
            <div class="form-group">
                <div class="${properties.kcInputWrapperClass!}">
                    <div class="g-recaptcha" data-size="compact" data-sitekey="${recaptchaSiteKey}"></div>
                </div>
            </div>
            </#if>

            <input type="submit" value="${msg("doRegister")}" />

            <div id="kc-terms-text">
                ${msg("registerTerms")?no_esc}
            </div>
        </form>

        <div id="kc-registration">
            <span>${msg("haveAccount")}</span>
            <a href="${url.loginUrl}">${msg("doLogIn")}</a>
        </div>
    </#if>
</@layout.registrationLayout>
