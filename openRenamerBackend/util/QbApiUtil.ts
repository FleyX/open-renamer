import {Method} from "axios";
import axios from "axios";
import querystring from "querystring";
import QbAddressDto from "../entity/dto/QbAddressDto";
import GlobalService from '../service/GlobalConfigService';

let qbInfo: QbAddressDto = null;
let cookie: string = null;

export function updateQbInfo(info: QbAddressDto) {
    qbInfo = info;
}

export function getQbInfo() {
    return qbInfo;
}

export function get() {

}

export function post() {

}

async function request(method: Method, url: string, query: any, body: any, isForm = false) {
    if (!qbInfo.valid) {
        throw new Error("qbittorrent无法连接，请检查配置");
    }
    let isTryLogin = false;
    while (true) {
        let headers = {"Cookie": cookie};
        if (isForm) {
            headers['content-type'] = "multipart/form-data";
        } else if (method == "post") {
            headers['content-type'] = "application/json";
        }
        let res = await axios.request({
            baseURL: qbInfo.address,
            url: url,
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
            cookie = res.headers['Cookie'];
        }
        qbInfo.valid = success;
        return success;
    } catch (error) {
        console.error("登录报错：", error);
        return false;

    }
}
