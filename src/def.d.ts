type Result = {
    code: number;
    msg?: string;
    obj?: any;
};

type TranslateResult = {
    [key: string]: string;
};

type Site = {
    name: string;
    domain: string;
    url: string;
    selector: string;
    type: 'p' | 'span';
};
