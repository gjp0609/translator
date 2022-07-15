import puppeteer from 'puppeteer-core';
import { IncomingMessage, ServerResponse } from 'http';
import { writeResult, getPage } from '../utils/index.js';

let browser: puppeteer.Browser;

let isStarted = false;
const ser = Math.random();

async function init(req: IncomingMessage, res: ServerResponse) {
    if (browser) {
        await Promise.all((await browser.pages()).map((page) => page.close()));
        await browser.close();
    }
    browser = await puppeteer.launch({
        args: ['--disable-features=site-per-process'],
        // 开发调试阶段，设置为false,
        headless: false,
        // devtools: true,
        defaultViewport: null,
        // 降低操作速度
        slowMo: 1,
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
    });
    const page = (await browser.pages())[0];
    isStarted = true;
    page.waitForTimeout(1000 * 60 * 60 * 24);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/json');
    res.end(
        JSON.stringify({
            code: 1
        })
    );
}

const replace_text = '{{QUERY}}';
const sites: Site[] = [
    {
        name: 'baidu',
        domain: 'fanyi.baidu.com',
        url: 'https://fanyi.baidu.com/#en/zh/' + replace_text,
        selector: '.trans-right .output-bd .target-output',
        type: 'p'
    },
    {
        name: 'google',
        domain: 'translate.google.cn',
        url: 'https://translate.google.cn/?sl=auto&tl=zh-CN&op=translate&text=' + replace_text,
        selector: 'div[data-language="zh-CN"]>div>span',
        type: 'span'
    }
];

async function common(site: Site, query: string, result: TranslateResult) {
    try {
        console.log(site.name, 'get page');
        const page = await getPage(browser, site.domain, 1);
        console.log(site.name, 'goto query');
        await page.goto(site.url.replace(replace_text, query), { waitUntil: 'domcontentloaded' });
        console.log(site.name, 'wait for selector');
        await page.waitForSelector(site.selector);
        console.log(site.name, 'get result');
        result[site.name] =
            (await page.evaluate(
                (selector, type) => {
                    switch (type) {
                        case 'p':
                            return (document.querySelector(selector)! as HTMLParagraphElement).innerText;
                        case 'span':
                            return (document.querySelector(selector)! as HTMLSpanElement).innerText;
                    }
                },
                site.selector,
                site.type
            )) ?? 'none';
    } catch (e) {}
}

async function translate(req: IncomingMessage, resp: ServerResponse) {
    try {
        const query = req.url?.split('?k=')[1] ?? '';
        const result = {
            baidu: '',
            google: ''
        };
        if (query) {
            const arr = [];
            for (let site of sites) {
                arr.push(common(site, query, result));
            }
            await Promise.all(arr);
            console.log(result);
            writeResult(resp, { code: 1, obj: { input: decodeURIComponent(query), result } });
        }
    } catch (e) {
        let msg = 'error: ';
        if (typeof e === 'string') {
            msg += e.toUpperCase();
        } else if (e instanceof Error) {
            msg += e.message;
        }
        writeResult(resp, { code: -1, msg });
    }
}

export { init, translate };

// async function waitForResult(page: puppeteer.Page, selector: string, result: TranslateResult) {
//     await page.waitForSelector(selector);
//     let text = '';
//     let getTask: NodeJS.Timer;
//     let checkTask: NodeJS.Timer;
//     try {
//         getTask = setInterval(async () => {
//             text =
//                 (await page.evaluate(() => {
//                     return document.querySelector('#tta_output_ta')!.textContent;
//                 })) ?? '';
//         }, 500);
//         checkTask = setInterval(() => {
//             console.log('--' + text + '--');
//             if (text) {
//                 clearInterval(getTask);
//                 clearInterval(checkTask);
//                 result.bing = text;
//             }
//         }, 500);
//     } catch (e) {}
//     setTimeout(() => {
//         if (getTask) clearInterval(getTask);
//         if (checkTask) clearInterval(checkTask);
//     }, 5000);
// }
