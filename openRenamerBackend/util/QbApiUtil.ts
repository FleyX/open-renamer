import QbConfigDto from "../entity/dto/QbConfigDto.ts";
import GlobalService from '../service/GlobalConfigService.ts';
import * as logger from 'std/log/mod.ts';

let qbInfo: QbConfigDto = null;
let cookie: any = null;

export function updateQbInfo(info: QbConfigDto) {
    qbInfo = info;
}

export function getQbInfo() {
    return qbInfo;
}

export async function get(url: string, data: object) {
    return await request("get", url, data, null, 1);
}

/**
 *
 * @param url
 * @param data
 * @param formType 1:application/json 2:formdata 3:application/x-www-form-urlencoded
 */
export async function post(url: string, query: any, data: object, formType = 1) {
    return await request("post", url, query, data, formType);
}

/**
 * 字符串化对象，用于URL搜索参数
 */
function stringify(obj: Record<string, any>): string {
    const params = new URLSearchParams();
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            params.append(key, obj[key]);
        }
    }
    return params.toString();
}

/**
 *
 * @param url
 * @param data
 * @param formType 1:application/json 2:formdata 3:application/x-www-form-urlencoded
 */
async function request(method: string, url: string, query: any, body: any, formType = 1) {
    if (!qbInfo.valid) {
        throw new Error("qbittorrent无法连接，请检查配置");
    }
    let isTryLogin = false;
    while (true) {
        let headers: Record<string, string> = {};
        if (cookie) {
            headers["Cookie"] = cookie;
        }
        
        // 构建完整URL
        const apiUrl = new URL(qbInfo.address + "/api/v2" + url);
        
        // 添加查询参数
        if (query) {
            for (const key in query) {
                if (query.hasOwnProperty(key)) {
                    apiUrl.searchParams.append(key, query[key]);
                }
            }
        }
        
        // 准备请求体
        let requestBody: BodyInit | null = null;
        if (method == 'post') {
            if (formType == 1) {
                headers['Content-Type'] = "application/json";
                requestBody = JSON.stringify(body);
            } else if (formType == 2) {
                headers['Content-Type'] = "multipart/form-data";
                // 这里简化处理，实际应用中可能需要更复杂的表单数据处理
                requestBody = body as BodyInit;
            } else {
                headers['Content-Type'] = "application/x-www-form-urlencoded";
                requestBody = stringify(body as Record<string, any>);
            }
        }
        
        // 发送请求
        const res = await fetch(apiUrl, {
            method,
            headers,
            body: requestBody,
        });
        
        // 处理响应
        if (res.status === 200) {
            const data = await res.text();
            try {
                return JSON.parse(data);
            } catch {
                return data;
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
        
        // 处理响应头中的cookie
        const setCookie = res.headers.get('set-cookie');
        if (setCookie) {
            cookie = setCookie;
        }
        
        const data = await res.text();
        const success = data.toLowerCase().indexOf('ok') > -1;
        qbInfo.valid = success;
        return success;
    } catch (error: any) {
        logger.error("qb登录报错：", error);
        return false;
    }
}