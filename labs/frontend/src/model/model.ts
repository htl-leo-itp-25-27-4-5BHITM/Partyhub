import { User } from "./user"
import { Hello } from "../feature/hello"
import { Post } from "../feature/post"

export interface Model {
    /** the json web token */
    token?: string
    
    user: User,
    hello?: Hello,
    posts: Post[]
}
export function isLoggedIn(model: Model) {
    return !!model.token
}

export { Hello }