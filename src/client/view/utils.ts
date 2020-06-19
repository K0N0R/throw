import { render } from "preact";

export function goTo(vnode: preact.ComponentChild) {
    render(vnode, document.body);
}