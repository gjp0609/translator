import { ServerResponse } from 'http';
import puppeteer from 'puppeteer-core';

function writeResult(resp: ServerResponse, result: Result) {
    resp.statusCode = 200;
    resp.setHeader('Content-Type', 'text/json');
    resp.end(JSON.stringify(result));
}
async function getPage(browser: puppeteer.Browser, url: string, count?: number): Promise<puppeteer.Page> {
    console.log('wait page', count ?? '', url);
    let pages = await browser.pages();
    for (let i = 0; i < pages.length; i++) {
        pages[i].url();
        if (pages[i].url() && pages[i].url().indexOf(url) >= 0) {
            return pages[i];
        }
    }
    await (await browser.pages())[0].waitForTimeout(1000);
    if (typeof count === 'number') {
        if (count <= 0) {
            return await browser.newPage();
        }
        return await getPage(browser, url, count - 1);
    } else {
        return await getPage(browser, url);
    }
}

export { writeResult, getPage };
