import { createGameServer } from './server';
import { CONFIG } from './config';
createGameServer()
    .then(({ server, match }) => {
        server.listen(CONFIG.PORT, () => console.log(`Throw http://localhost:${CONFIG.PORT}`));
        const shutdown = () => {
            match.dispose();
            server.close();
        };
        process.once('SIGINT', shutdown);
        process.once('SIGTERM', shutdown);
    })
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
