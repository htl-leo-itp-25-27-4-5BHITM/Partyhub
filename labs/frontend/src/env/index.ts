/** Make settings from Webpack Define Plugin available in typescript */

interface AuthenticationSettings {
    url: string
    realm: string,
    clientId: string
}

declare const AUTHENTICATION_SETTINGS: AuthenticationSettings
const authSettings = AUTHENTICATION_SETTINGS

export { authSettings as AUTHENTICATION_SETTINGS }
