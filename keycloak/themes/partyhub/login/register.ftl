<#import "template.ftl" as layout>
<#import "user-profile-commons.ftl" as userProfileCommons>
<#import "register-commons.ftl" as registerCommons>
<@layout.registrationLayout displayMessage=messagesPerField.exists('global') displayRequiredFields=true displayInfo=true; section>
    <#if section = "header">
        <#if messageHeader??>
            ${kcSanitize(msg("${messageHeader}"))?no_esc}
        <#else>
            ${msg("partyhubRegisterTitle")}
        </#if>
    <#elseif section = "form">
        <form id="kc-register-form" class="ph-auth-form" action="${url.registrationAction}" method="post">
            <@userProfileCommons.userProfileFormFields; callback, attribute>
                <#if callback = "afterField">
                    <#if passwordRequired?? && (attribute.name == "username" || (attribute.name == "email" && realm.registrationEmailAsUsername))>
                        <div class="ph-auth-field">
                            <label class="ph-auth-label" for="password">${msg("password")}</label>
                            <input
                                id="password"
                                class="ph-auth-input"
                                name="password"
                                type="password"
                                autocomplete="new-password"
                                aria-invalid="<#if messagesPerField.existsError('password','password-confirm')>true<#else>false</#if>"
                            >
                            <#if messagesPerField.existsError('password')>
                                <span class="ph-auth-error" aria-live="polite">${kcSanitize(messagesPerField.getFirstError('password'))?no_esc}</span>
                            </#if>
                        </div>

                        <div class="ph-auth-field">
                            <label class="ph-auth-label" for="password-confirm">${msg("passwordConfirm")}</label>
                            <input
                                id="password-confirm"
                                class="ph-auth-input"
                                name="password-confirm"
                                type="password"
                                autocomplete="new-password"
                                aria-invalid="<#if messagesPerField.existsError('password','password-confirm')>true<#else>false</#if>"
                            >
                            <#if messagesPerField.existsError('password-confirm')>
                                <span class="ph-auth-error" aria-live="polite">${kcSanitize(messagesPerField.getFirstError('password-confirm'))?no_esc}</span>
                            </#if>
                        </div>
                    </#if>
                </#if>
            </@userProfileCommons.userProfileFormFields>

            <@registerCommons.termsAcceptance/>

            <#if recaptchaRequired?? && (recaptchaVisible!false)>
                <div class="ph-auth-field">
                    <div class="g-recaptcha" data-size="compact" data-sitekey="${recaptchaSiteKey}" data-action="${recaptchaAction}"></div>
                </div>
            </#if>

            <#if recaptchaRequired?? && !(recaptchaVisible!false)>
                <script>
                    function onSubmitRecaptcha(token) {
                        document.getElementById("kc-register-form").requestSubmit();
                    }
                </script>
                <div class="ph-auth-actions">
                    <button
                        class="ph-auth-button ph-auth-button-primary ph-auth-button-block g-recaptcha"
                        data-sitekey="${recaptchaSiteKey}"
                        data-callback="onSubmitRecaptcha"
                        data-action="${recaptchaAction}"
                        type="submit"
                    >
                        ${msg("doRegister")}
                    </button>
                </div>
            <#else>
                <div class="ph-auth-actions">
                    <button class="ph-auth-button ph-auth-button-primary ph-auth-button-block" type="submit">${msg("doRegister")}</button>
                </div>
            </#if>
        </form>
    <#elseif section = "info">
        <a class="ph-auth-inline-link" href="${url.loginUrl}">${msg("backToLogin")}</a>
    </#if>
</@layout.registrationLayout>
