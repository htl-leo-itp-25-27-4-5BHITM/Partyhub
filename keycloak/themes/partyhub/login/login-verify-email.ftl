<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=!isAppInitiatedAction??; section>
    <#if section = "header">
        ${msg("partyhubVerifyEmailTitle")}
    <#elseif section = "form">
        <div class="ph-auth-copy">
            <p>
                <#if verifyEmail??>
                    ${msg("emailVerifyInstruction1", verifyEmail)}
                <#else>
                    ${msg("emailVerifyInstruction4", user.email)}
                </#if>
            </p>
        </div>

        <#if isAppInitiatedAction??>
            <form class="ph-auth-form" action="${url.loginAction}" method="post">
                <div class="ph-auth-actions">
                    <#if verifyEmail??>
                        <button class="ph-auth-button ph-auth-button-secondary ph-auth-button-block" type="submit">${msg("emailVerifyResend")}</button>
                    <#else>
                        <button class="ph-auth-button ph-auth-button-primary ph-auth-button-block" type="submit">${msg("emailVerifySend")}</button>
                    </#if>
                    <button class="ph-auth-button ph-auth-button-secondary ph-auth-button-block" type="submit" name="cancel-aia" value="true" formnovalidate>${msg("doCancel")}</button>
                </div>
            </form>
        </#if>
    <#elseif section = "info">
        <p class="ph-auth-info-copy">${msg("emailVerifyInstruction2")}</p>
        <span class="ph-auth-info-inline">
            <a class="ph-auth-inline-link" href="${url.loginAction}">${msg("doClickHere")}</a>
            <span>${msg("emailVerifyInstruction3")}</span>
        </span>
    </#if>
</@layout.registrationLayout>
