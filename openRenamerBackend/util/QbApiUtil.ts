import QbConfigDto from "../entity/dto/QbConfigDto.ts";
import * as logger from 'std/log/mod.ts';

let qbInfo: QbConfigDto | null = null;
let cookie: string | null = null;

export function updateQbInfo(info: QbConfigDto) {
    qbInfo = info;
}

export function getQbInfo() {
    return qbInfo;
}

export async function get(url: string, data: object | null) {
    return await request("get", url, data, null, 1);
}

/**
 * @param formType 1:application/json 2:formdata 3:application/x-www-form-urlencoded
 */
export async function post(url: string, query: Record<string, string> | null, data: object | null, formType = 1) {
    return await request("post", url, query, data, formType);
}

function stringify(obj: Record<string, string>): string {
    const params = new URLSearchParams();
    for (const key of Object.keys(obj)) {
        params.append(key, obj[key]);
    }
    return params.toString();
}

/**
 * @param formType 1:application/json 2:formdata 3:application/x-www-form-urlencoded
 */
async function request(method: string, url: string, query: Record<string, string> | null, body: object | null, formType = 1) {
    if (!qbInfo || !qbInfo.valid) {
        throw new Error("qbittorrent无法连接，请检查配置");
    }
    let isTryLogin = false;
    while (true) {
        const headers: Record<string, string> = {};
        if (cookie) {
            headers["Cookie"] = cookie;
        }

        const apiUrl = new URL(qbInfo.address + "/api/v2" + url);

        if (query) {
            for (const key of Object.keys(query)) {
                apiUrl.searchParams.append(key, query[key]);
            }
        }

        let requestBody: BodyInit | null = null;
        if (method == 'post') {
            if (formType == 1) {
                headers['Content-Type'] = "application/json";
                requestBody = JSON.stringify(body);
            } else if (formType == 2) {
                headers['Content-Type'] = "multipart/form-data";
                requestBody = body as unknown as BodyInit;
            } else {
                headers['Content-Type'] = "application/x-www-form-urlencoded";
                requestBody = stringify(body as Record<string, string>);
            }
        }

        const res = await fetch(apiUrl, {
            method,
            headers,
            body: requestBody,
        });

        if (res.status === 200) {
            const text = await res.text();
            try {
                return JSON.parse(text);
            } catch {
                return text;
            }
        }

        if (res.status === 403) {
            if (isTryLogin) {
                throw new Error("qb用户名密码设置有误");
            } else {
                await tryLogin();
                isTryLogin = true;
            }
        } else {
            const errorData = await res.text();
            throw new Error("请求报错:" + errorData);
        }
    }
}

export async function tryLogin(): Promise<boolean> {
    if (qbInfo == null || qbInfo.address == null || qbInfo.address == "") {
        return false;
    }

    const body = {username: qbInfo.username, password: qbInfo.password};

    try {
        const res = await fetch(qbInfo.address + `/api/v2/auth/login`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: stringify(body),
        });

        const setCookie = res.headers.get('set-cookie');
        if (setCookie) {
            cookie = setCookie;
        }

        const data = await res.text();
        const success = data.toLowerCase().indexOf('ok') > -1;
        qbInfo.valid = success;
        return success;
    } catch (error: unknown) {
        logger.error("qb登录报错：" + String(error));
        return false;
    }
}
