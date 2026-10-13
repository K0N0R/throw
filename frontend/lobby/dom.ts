export function node<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = '') {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = text;
    return element;
}
export function button(text: string, action: () => void) {
    const element = node('button', 'button', text);
    element.type = 'button';
    element.onclick = action;
    return element;
}
