
import * as jose from "jose"
import { Model } from "../model"
export type Role = "admin" | "editor" | "customer"

interface RealmAccess {
    roles: string[]
}

export function isUserInRole(model: Model, role: Role) {
    let isInRole = false
    const jwt = model.token
    if (!!jwt) {
        const payload = jose.decodeJwt(jwt)
        const realmAccess: RealmAccess = payload["realm_access"] as any
        const foundRole = realmAccess.roles.find(r => r == role)
        isInRole = !!foundRole
    }
    return isInRole
}
