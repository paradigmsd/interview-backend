import { buildApp } from './app.js';

const start = async () => {
    try {
        const app = await buildApp();
        const port = 8080;
        await app.listen({ port, host: '0.0.0.0' });
        console.log(`Server running at http://localhost:${port}`);
        console.log(`Documentation available at http://localhost:${port}/docs`);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

start();
