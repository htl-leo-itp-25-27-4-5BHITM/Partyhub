import { headers } from "../../auth"
import { set } from "../../model"
import { Hello } from "./hello"

export async function loadHellos() {
    const response = await fetch("./api/hello", { headers: headers() })
    if (response.ok) {
        const greeting: Hello = await response.json()
        console.log("greeting loaded:", greeting)
        set(model => model.hello = greeting)
    } else {
        console.warn("failed to load hello", response)
    }
}
