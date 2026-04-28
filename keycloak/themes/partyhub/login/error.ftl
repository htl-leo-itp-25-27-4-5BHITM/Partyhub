<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>
    <#if section = "header">
        ${msg("partyhubErrorTitle")}
    <#elseif section = "form">
        <div class="ph-auth-alert ph-auth-alert-error">
            ${kcSanitize(message.summary)?no_esc}
        </div>

        <#if !skipLink?? && client?? && client.baseUrl?has_content>
            <div class="ph-auth-actions">
                <a class="ph-auth-button ph-auth-button-primary ph-auth-button-block" href="${client.baseUrl}">${msg("backToApplication")}</a>
            </div>
        </#if>
    </#if>
</@layout.registrationLayout>
