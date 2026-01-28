
export interface User {
    readonly id: string
    readonly email: string
    readonly firstName: string
    readonly lastName: string
    readonly username: string
    readonly token?: string
    readonly roles: string[]
}
