import http, { ServerResponse } from 'http';

const port = 3000;

import { init, translate } from './api/test.js';
import { writeResult } from './utils/index.js';

type R = {
    [key: string]: Function;
};

const routes: R = {
    '/init': init,
    '/translate': translate
};

const server = http.createServer((req, resp) => {
    console.log('req: ', req.url);
    let func: Function | undefined = undefined;
    for (let key of Object.keys(routes)) {
        if ((req.url ?? '/').match(key)) {
            func = routes[key];
        }
    }
    if (func) {
        try {
            func(req, resp);
        } catch (e) {
            writeResult(resp, {
                code: 0,
                msg: 'error'
            });
        }
    } else {
        writeResult(resp, { code: 0, msg: 'path not found' });
    }
});

server.listen(port, () => {
    console.log(`Server is running on http://127.0.0.1:${port}/`);
});
