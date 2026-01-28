import "@picocss/pico"
import "./css/styles.css"
import "./components/nav/login-button"
import "./components/content/content-component"
import { checkIfUserIsAuthenticated, isUserInRole } from "./auth"
import { model } from "./model/store"
import { distinctUntilChanged, filter} from "rxjs"
import { loadHello } from "./feature/hello"
import { isLoggedIn } from "./model"
import { loadPosts } from "./feature/post"

checkIfUserIsAuthenticated()
loadHello()

model
    .pipe(
        filter(isLoggedIn),
        filter(model => model.posts.length == 0),
        distinctUntilChanged()
    )
    .subscribe(model => {
        const isEditor = !isUserInRole(model, "editor")
        loadPosts(isEditor)
    })


