<#-- New password after "Change password" in the PartyHub settings or a "Forgot password?" reset.
     The realm policy (8+ characters, not the username, not the current password) is enforced by
     Keycloak; the list below gives live feedback while typing. -->
<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('password','password-confirm'); section>
    <#if section = "header">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
    <#elseif section = "form">
        <div class="brand-header">
            <h1>PartyHub</h1>
            <p class="brand-subtitle">${msg("updatePasswordTitle")}</p>
        </div>

        <div id="kc-form">
            <div id="kc-form-wrapper">
                <form id="kc-passwd-update-form" action="${url.loginAction}" method="post"
                      data-username="${(auth.attemptedUsername)!''}">
                    <label for="password-new" class="ph-label">${msg("passwordNew")}</label>
                    <div class="password-wrapper">
                        <input type="password" id="password-new" name="password-new"
                               autofocus autocomplete="new-password" required
                               aria-describedby="password-rules<#if messagesPerField.existsError('password')> input-error-password</#if>"
                               aria-invalid="<#if messagesPerField.existsError('password','password-confirm')>true</#if>" />
                    </div>
                    <#if messagesPerField.existsError('password')>
                        <span id="input-error-password" class="ph-field-error" aria-live="polite">
                            ${kcSanitize(messagesPerField.get('password'))?no_esc}
                        </span>
                    </#if>

                    <ul id="password-rules" class="ph-password-rules" aria-live="polite">
                        <li data-rule="length">${msg("phRuleLength")}</li>
                        <li data-rule="username">${msg("phRuleUsername")}</li>
                        <li data-rule="history" class="ph-rule-info">${msg("phRuleHistory")}</li>
                        <li data-rule="match">${msg("phRuleMatch")}</li>
                    </ul>

                    <label for="password-confirm" class="ph-label">${msg("passwordConfirm")}</label>
                    <div class="password-wrapper">
                        <input type="password" id="password-confirm" name="password-confirm"
                               autocomplete="new-password" required
                               aria-invalid="<#if messagesPerField.existsError('password-confirm')>true</#if>" />
                    </div>
                    <#if messagesPerField.existsError('password-confirm')>
                        <span id="input-error-password-confirm" class="ph-field-error" aria-live="polite">
                            ${kcSanitize(messagesPerField.get('password-confirm'))?no_esc}
                        </span>
                    </#if>

                    <input type="submit" name="login" id="kc-login" value="${msg("doSubmit")}" />
                    <#if isAppInitiatedAction??>
                        <button type="submit" name="cancel-aia" value="true" id="kc-cancel" formnovalidate>${msg("doCancel")}</button>
                    </#if>
                </form>
            </div>
        </div>
        <script src="${url.resourcesPath}/js/password-rules.js"></script>
    </#if>
</@layout.registrationLayout>
