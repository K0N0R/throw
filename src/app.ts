function component() {
    let element = document.createElement('div');

    element.innerHTML = 'Hello - here is startup project.';

    return element;
}

document.body.appendChild(component());