<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>
    <#if section = "header">
        <#if messageHeader??>
            ${kcSanitize(msg("${messageHeader}"))?no_esc}
        <#else>
            ${msg("partyhubInfoTitle")}
        </#if>
    <#elseif section = "form">
        <div class="ph-auth-copy">
            <p>${kcSanitize(message.summary)?no_esc}</p>
            <#if requiredActions??>
                <p>
                    <#list requiredActions as requiredAction>
                        ${kcSanitize(msg("requiredAction.${requiredAction}"))?no_esc}<#sep>, </#sep>
                    </#list>
                </p>
            </#if>
        </div>

        <#if !skipLink??>
            <div class="ph-auth-actions">
                <#if pageRedirectUri?has_content>
                    <a class="ph-auth-button ph-auth-button-primary ph-auth-button-block" href="${pageRedirectUri}">${msg("backToApplication")}</a>
                <#elseif actionUri?has_content>
                    <a class="ph-auth-button ph-auth-button-primary ph-auth-button-block" href="${actionUri}">${msg("proceedWithAction")}</a>
                <#elseif client?? && client.baseUrl?has_content>
                    <a class="ph-auth-button ph-auth-button-primary ph-auth-button-block" href="${client.baseUrl}">${msg("backToApplication")}</a>
                </#if>
            </div>
        </#if>
    </#if>
</@layout.registrationLayout>
