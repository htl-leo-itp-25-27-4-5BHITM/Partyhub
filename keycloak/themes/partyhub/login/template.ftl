<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false>
<#assign currentLanguageTag = "en">
<#assign textDirection = "ltr">
<#assign supportedLocales = []>
<#if locale??>
    <#if locale.currentLanguageTag?? && locale.currentLanguageTag?has_content>
        <#assign currentLanguageTag = locale.currentLanguageTag>
    </#if>
    <#if locale.rtl?? && locale.rtl>
        <#assign textDirection = "rtl">
    </#if>
    <#if locale.supported??>
        <#assign supportedLocales = locale.supported>
    </#if>
</#if>
<#assign realmName = "PartyHub">
<#if realm?? && realm.displayName?? && realm.displayName?has_content>
    <#assign realmName = realm.displayName>
</#if>
<!DOCTYPE html>
<html lang="${currentLanguageTag}" dir="${textDirection}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <#if properties.meta?has_content>
        <#list properties.meta?split(' ') as meta>
            <#assign metaParts = meta?split('==')>
            <meta name="${metaParts[0]}" content="${metaParts[1]}">
        </#list>
    </#if>
    <title>${msg("loginTitle", realmName)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800&display=swap" rel="stylesheet">
    <#if properties.styles?has_content>
        <#list properties.styles?split(' ') as style>
            <link href="${url.resourcesPath}/${style}" rel="stylesheet">
        </#list>
    </#if>
</head>
<body class="ph-auth-page ${bodyClass}">
<div class="ph-auth-shell">
    <aside class="ph-auth-showcase">
        <div class="ph-auth-showcase-inner">
            <p class="ph-auth-eyebrow">${msg("partyhubLoginEyebrow")}</p>
            <div class="ph-auth-brand">
                <div class="ph-auth-badge">PH</div>
                <div>
                    <div class="ph-auth-brand-name">PartyHub</div>
                    <div class="ph-auth-brand-tagline">${msg("partyhubLoginTagline")}</div>
                </div>
            </div>
            <h1 class="ph-auth-showcase-title">${msg("partyhubLoginShowcaseTitle")}</h1>
            <p class="ph-auth-showcase-body">${msg("partyhubLoginShowcaseBody")}</p>
            <div class="ph-auth-feature-list">
                <div class="ph-auth-feature">
                    <h2>${msg("partyhubLoginFeatureEvents")}</h2>
                    <p>${msg("partyhubLoginFeatureEventsBody")}</p>
                </div>
                <div class="ph-auth-feature">
                    <h2>${msg("partyhubLoginFeatureGroups")}</h2>
                    <p>${msg("partyhubLoginFeatureGroupsBody")}</p>
                </div>
                <div class="ph-auth-feature">
                    <h2>${msg("partyhubLoginFeatureParties")}</h2>
                    <p>${msg("partyhubLoginFeaturePartiesBody")}</p>
                </div>
            </div>
        </div>
    </aside>

    <main class="ph-auth-card-wrapper">
        <section class="ph-auth-card">
            <#if realm.internationalizationEnabled && supportedLocales?size gt 1>
                <div class="ph-auth-locale">
                    <#list supportedLocales as supportedLocale>
                        <a href="${supportedLocale.url}" class="<#if supportedLocale.languageTag = currentLanguageTag>is-active</#if>">${supportedLocale.label}</a>
                    </#list>
                </div>
            </#if>

            <#if auth?has_content && auth.showUsername() && !auth.showResetCredentials()>
                <div class="ph-auth-user-chip">
                    <span>${auth.attemptedUsername}</span>
                    <a href="${url.loginRestartFlowUrl}" title="${msg("restartLoginTooltip")}">${msg("restartLoginTooltip")}</a>
                </div>
            </#if>

            <div class="ph-auth-card-header">
                <#if displayRequiredFields>
                    <div class="ph-auth-required">${msg("requiredFields")}</div>
                </#if>
                <h2 class="ph-auth-page-title"><#nested "header"></h2>
                <p class="ph-auth-page-copy">${msg("partyhubLoginCardIntro")}</p>
            </div>

            <#if displayMessage && message?has_content && (message.type != "warning" || !isAppInitiatedAction??)>
                <div class="ph-auth-alert ph-auth-alert-${message.type}">
                    ${kcSanitize(message.summary)?no_esc}
                </div>
            </#if>

            <div class="ph-auth-card-body">
                <#nested "form">
            </div>

            <#if social?? && social.providers?? && social.providers?has_content>
                <div class="ph-auth-divider"></div>
                <section class="ph-auth-social-section">
                    <h3>${msg("partyhubLoginSocialTitle")}</h3>
                    <#nested "socialProviders">
                </section>
            </#if>

            <#if displayInfo>
                <div class="ph-auth-divider"></div>
                <div class="ph-auth-info">
                    <#nested "info">
                </div>
            </#if>
        </section>

        <p class="ph-auth-footer">${msg("partyhubLoginFooter")}</p>
    </main>
</div>
</body>
</html>
</#macro>
