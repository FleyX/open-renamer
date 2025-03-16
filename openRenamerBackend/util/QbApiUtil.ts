import {Method} from "axios";
import axios from "axios";
import querystring from "querystring";
import QbConfigDto from "../entity/dto/QbConfigDto";
import GlobalService from '../service/GlobalConfigService';

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
 *
 * @param url
 * @param data
 * @param formType 1:application/json 2:formdata 3:application/x-www-form-urlencoded
 */
async function request(method: Method, url: string, query: any, body: any, formType = 1) {
    if (!qbInfo.valid) {
        throw new Error("qbittorrent无法连接，请检查配置");
    }
    let isTryLogin = false;
    while (true) {
        let headers = {"Cookie": cookie};
        if (method == 'post') {
            if (formType == 1) {
                headers['content-type'] = "application/json";
            } else if (formType == 2) {
                headers['content-type'] = "multipart/form-data";
            } else {
                headers['content-type'] = "application/x-www-form-urlencoded";
            }
        }
        let res = await axios.request({
            baseURL: qbInfo.address,
            url: "/api/v2" + url,
            method,
            params: query,
            data: body,
            headers,
        });
        if (res.status == 200) {
            return res.data;
        }
        if (res.status == 403) {
            if (isTryLogin) {
                throw new Error("qb用户名密码设置有误");
            } else {
                await tryLogin();
                isTryLogin = true;
            }
        } else {
            throw new Error("请求报错:" + res.data);
        }
    }

}

export async function tryLogin(): Promise<boolean> {
    if (qbInfo == null || qbInfo.address == null || qbInfo.address == "") {
        return false;
    }
    let body = {username: qbInfo.username, password: qbInfo.password};
    try {
        let res = await axios.post(qbInfo.address + `/api/v2/auth/login`, querystring.stringify(body), {
            headers: {"Content-Type": "application/x-www-form-urlencoded"}
        });
        let success = res.data.toLocaleLowerCase().indexOf('ok') > -1;
        if (success) {
            cookie = res.headers['set-cookie'];
        }
        qbInfo.valid = success;
        return success;
    } catch (error:any) {
        console.error("qb登录报错：" );
        return false;

    }
}
