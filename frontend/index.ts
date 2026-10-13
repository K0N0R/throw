import { AppController } from './app/appController';
new AppController().init().catch((error: unknown) => {
    console.error(error);
    const message = document.createElement('p');
    message.className = 'fatal-error';
    message.textContent = 'Nie udało się uruchomić gry. Odśwież stronę.';
    document.body.append(message);
});
