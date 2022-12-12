import { Method } from "axios";
import axios from "axios";
import QbAddressDto from "../entity/dto/QbAddressDto";
import GlobalService from '../service/GlobalConfigService';
import { setUncaughtExceptionCaptureCallback } from "process";

//qb状态，true正常，false:无法访问
let qbStatus = true;
let qbInfo: QbAddressDto = null;
let cookie: string = null;

export function getQbStatus() {
	return qbStatus;
}

export async function updateQbInfo(info: QbAddressDto, status: boolean) {
	if (!info) {
		let obj = await GlobalService.getMultVal(["qbAddress", "qbUsername", "qbPassword"]);
		if (!obj.qbAddress) {
			qbStatus = false;
			return;
		}
		qbInfo.address = obj.qbAddress;
		qbInfo.username = obj.qbUsername;
		qbInfo.password = obj.qbPassword;
	} else {
		qbInfo = info;
	}
	if (status) {
		qbStatus = status;
	}

	axios.defaults.baseURL = qbInfo.address;
}

export function get() {

}

export function post() {

}

async function request(method: Method, url: string, query: any, body: any, isForm = false) {
	if (!qbStatus) {
		throw new Error("qbittorrent无法连接，请检查配置");
	}
	let isTryLogin = false;
	while (true) {
		let headers = { "Cookie": cookie };
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
		} if (res.status == 403) {
			if (isTryLogin) {
				throw new Error("qb用户名密码设置有误");
			} else {
				await tryLogin(qbInfo.address, qbInfo.username, qbInfo.password, true);
				isTryLogin = true;
			}
		} else {
			throw new Error("请求报错:" + res.data);
		}
	}

}

export async function tryLogin(address: string, username: string, password: string, updateStatus: boolean): Promise<void> {
	let body = { username, password };
	try {
		let res = await axios.post(address + "/api/v2/auth/login", body, {
			headers: { "Content-Type": "multipart/form-data;boundary=--------------------------125002698093981740970152" }
		});
		let success = res.data.toLocaleLowerCase().contains('ok');
		if (updateStatus) {
			qbStatus = success;
		}
		if (!success) {
			throw new Error("登录失败");
		} else {
			cookie = res.headers['Cookie'];
		}
	} catch (error) {
		console.error("登录报错：", error);
		if (updateStatus) {
			qbStatus = false;
		}
		throw new Error("登录出错");
	}
}
