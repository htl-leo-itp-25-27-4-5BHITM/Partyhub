<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=true displayMessage=!messagesPerField.existsError('username'); section>
    <#if section = "header">
        ${msg("partyhubResetPasswordTitle")}
    <#elseif section = "form">
        <form id="kc-reset-password-form" class="ph-auth-form" action="${url.loginAction}" method="post">
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
                    value="${(auth.attemptedUsername!'')}"
                    autocomplete="username"
                    autofocus
                    aria-invalid="<#if messagesPerField.existsError('username')>true<#else>false</#if>"
                >
                <#if messagesPerField.existsError('username')>
                    <span class="ph-auth-error" aria-live="polite">${kcSanitize(messagesPerField.getFirstError('username'))?no_esc}</span>
                </#if>
            </div>

            <div class="ph-auth-actions">
                <button class="ph-auth-button ph-auth-button-primary ph-auth-button-block" type="submit">${msg("doSubmit")}</button>
            </div>
        </form>
    <#elseif section = "info">
        <p class="ph-auth-info-copy">
            <#if realm.duplicateEmailsAllowed>
                ${msg("emailInstructionUsername")}
            <#else>
                ${msg("emailInstruction")}
            </#if>
        </p>
        <a class="ph-auth-inline-link" href="${url.loginUrl}">${msg("backToLogin")}</a>
    </#if>
</@layout.registrationLayout>
