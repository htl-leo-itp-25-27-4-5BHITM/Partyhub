<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>
    <#if section = "header">
        ${msg("partyhubLoginTitle")}
    <#elseif section = "form">
        <#if realm.password>
            <form id="kc-form-login" class="ph-auth-form" action="${url.loginAction}" method="post">
                <#if !usernameHidden??>
                    <div class="ph-auth-field">
                        <label class="ph-auth-label" for="username">
                            <#if !realm.loginWithEmailAllowed>
                                ${msg("username")}
                            <#elseif !realm.registrationEmailAsUsername>
                                ${msg("usernameOrEmail")}
                            <#else>
                                ${msg("email")}
                            </#if>
                        </label>
                        <input
                            id="username"
                            class="ph-auth-input"
                            name="username"
                            type="text"
                            value="${(login.username!'')}"
                            autocomplete="username"
                            autofocus
                            dir="ltr"
                            aria-invalid="<#if messagesPerField.existsError('username','password')>true<#else>false</#if>"
                        >
                        <#if messagesPerField.existsError('username','password')>
                            <span class="ph-auth-error" aria-live="polite">${kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc}</span>
                        </#if>
                    </div>
                <#else>
                    <div class="ph-auth-username-card">
                        <span class="ph-auth-username-label">${msg("username")}</span>
                        <strong>${auth.attemptedUsername}</strong>
                    </div>
                </#if>

                <div class="ph-auth-field">
                    <label class="ph-auth-label" for="password">${msg("password")}</label>
                    <input
                        id="password"
                        class="ph-auth-input"
                        name="password"
                        type="password"
                        autocomplete="current-password"
                        dir="ltr"
                        aria-invalid="<#if messagesPerField.existsError('username','password')>true<#else>false</#if>"
                    >
                    <#if usernameHidden?? && messagesPerField.existsError('username','password')>
                        <span class="ph-auth-error" aria-live="polite">${kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc}</span>
                    </#if>
                </div>

                <div class="ph-auth-utility-row">
                    <#if realm.rememberMe && !usernameHidden??>
                        <label class="ph-auth-checkbox">
                            <input id="rememberMe" name="rememberMe" type="checkbox" <#if login.rememberMe??>checked</#if>>
                            <span>${msg("rememberMe")}</span>
                        </label>
                    </#if>

                    <#if realm.resetPasswordAllowed>
                        <a class="ph-auth-inline-link" href="${url.loginResetCredentialsUrl}">${msg("doForgotPassword")}</a>
                    </#if>
                </div>

                <input type="hidden" id="id-hidden-input" name="credentialId" <#if auth?has_content && auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>>

                <div class="ph-auth-actions">
                    <button class="ph-auth-button ph-auth-button-primary ph-auth-button-block" id="kc-login" name="login" type="submit">
                        ${msg("doLogIn")}
                    </button>
                </div>
            </form>
        </#if>
    <#elseif section = "socialProviders">
        <div class="ph-auth-social-list">
            <#list social.providers as provider>
                <a class="ph-auth-social-link" id="social-${provider.alias}" href="${provider.loginUrl}">
                    <span class="ph-auth-social-name">${kcSanitize(provider.displayName)?no_esc}</span>
                </a>
            </#list>
        </div>
    <#elseif section = "info">
        <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
            <span>${msg("noAccount")}</span>
            <a class="ph-auth-inline-link" href="${url.registrationUrl}">${msg("doRegister")}</a>
        </#if>
    </#if>
</@layout.registrationLayout>
