import { createGameServer } from '../backend/server';
createGameServer()
    .then(({ server, match, lobby }) => {
        server.listen(0, '127.0.0.1', () =>
            process.send?.({ port: (server.address() as { port: number }).port }),
        );
        let stopped = false;
        const stop = () => {
            if (stopped) return;
            stopped = true;
            lobby.dispose();
            match.dispose();
            server.close();
            if (process.connected) process.disconnect();
        };
        process.once('message', stop);
        process.once('disconnect', stop);
        process.once('SIGINT', stop);
        process.once('SIGTERM', stop);
    })
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
