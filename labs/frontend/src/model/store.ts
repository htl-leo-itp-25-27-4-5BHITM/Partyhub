import { BehaviorSubject, Subject } from "rxjs"
import { Draft, produce } from "immer"
import { Model } from "./model"

const initialState: Model = {
    user: {
        id: "",
        email: "",
        firstName: "",
        lastName: "",
        username: "",
        roles: []
    },
    posts: []
}

const store = new BehaviorSubject<Model>(initialState)

export const model: Subject<Model> = store

export function set(recipe: (model: Draft<Model>) => void) {
    function doSet(mod: Draft<Model>) {
        recipe(mod)
    }
    const model = produce(store.getValue(), doSet)
    store.next(model)
}