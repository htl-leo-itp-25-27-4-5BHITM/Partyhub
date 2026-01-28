import Keycloak, { KeycloakInitOptions } from 'keycloak-js'
import { AUTHENTICATION_SETTINGS } from '../env'
import { set } from "../model"

const keycloak = new Keycloak(AUTHENTICATION_SETTINGS)    
const _ = setInterval(() => {
    if (keycloak.authenticated) {
        keycloak.updateToken();
        console.log("token updated", keycloak.token)
    }
}, 30000)

/** check if the user is authenticated */
async function checkIfUserIsAuthenticated() {
    const initOptions: KeycloakInitOptions = {
        onLoad: "check-sso",
        enableLogging: true
    }
    try {
        let authenticated = await keycloak.init(initOptions)

        if (authenticated) {
            set(model => model.token = keycloak.token)
            console.log("token is", keycloak.token)
            loadProfile()
        } else {
           set(model => delete model.token)
        }
    } catch (error) {
        console.error('Failed to initialize adapter:', error)
    }
}
async function loadProfile() {
    const profile = await keycloak.loadUserProfile()
    set(model => {
        model.token = keycloak.token
        model.user.firstName = profile.firstName 
        model.user.lastName = profile.lastName
        model.user.email = profile.email
        model.user.id = profile.id
        model.user.token = keycloak.token
        model.user.roles = keycloak.realmAccess.roles
    })
}
async function login() {
    await keycloak.login()
}
async function logout() {
    await keycloak.logout()
    keycloak.clearToken()
    set(model => delete model.token)
}
function token() {
    return keycloak.token
}
export { checkIfUserIsAuthenticated, login, logout, token }
