import { headers } from "../../auth"
import { set } from "../../model"
import { Post } from "./post"
console.log("posts loaded")

export async function loadPosts(publishedOnly: boolean) {
    const url = "./api/posts"
    const response = await fetch(url, {headers: headers()})
    if (response.ok) {
        const posts: Post[] = await response.json()
        set(model => model.posts = posts)
    } else {
        console.warn("failed to load posts", response)
    }
}
