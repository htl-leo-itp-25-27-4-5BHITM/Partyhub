import { html, render } from "lit-html"

class LoginComponent extends HTMLDivElement {
    connectedCallback() {
        console.log("connected dialog")
        render(this.template(), this)
    }
    template() {
        return html`
            <style>
                input:invalid {
                    border: 3px solid red;
                }            
            </style>
            <div class="grid">
                <dialog open="true">
                <div>
                    <hgroup>
                        <h1>Sign in</h1>
                        <h2>A minimalist layout for Login pages</h2>
                    </hgroup>
                    <form @submit=${ () => this.submit()}>
                        <input type="email" value="" class="form-control" placeholder="e-Mail" required autocomplete="email"/>
                        <input type="password" name="password" value="" class="form-control"
                            placeholder="Password" required minlength=6 autocomplete="current-password"/>
                        <fieldset>
                            <label for="remember">
                                <input type="checkbox" name="remember" value="1" id="remember" />
                                Remember me
                            </label>
                        </fieldset>
                        <small>
                        </small>
    
                        <input type="submit" name="submit" value="Login" class="contrast" />
                        <!-- <button type="submit" class="contrast" onclick="event.preventDefault()">Login</button> -->
                    </form>
                </div>
                <div>
    
                </div>
            </dialog>
            </div>
        `
    }
    submit() {
        alert("submit")
    }
}
customElements.define("login-dialog", LoginComponent, {extends: "div"})


