import { html, render } from "lit-html"
import { login, logout } from "../../auth"
import { Model, isLoggedIn, model } from "../../model"

class LoginButtonElement extends HTMLElement {
    connectedCallback() {
        model.subscribe(model => this.render(model))
    }
    render(model: Model) {
        render(template(model), this)
    }
}

customElements.define("login-button", LoginButtonElement)

function template(model: Model) {
    let title, icon
    if (isLoggedIn(model)) {
        title = "Logout"
        icon = "logout"
    } else {
        title = "Login"
        icon = "person"

    }
    function onClick(model: Model) {
        if (!!model.token) {
            logout()
        } else {
            login()
        }
    }
    return html`
        <a href="#" title=${title}><span class="material-icons" @click=${() => onClick(model)}>${icon}</span></a>

    `
}
