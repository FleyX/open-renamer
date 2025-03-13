import QbConfigDto from "../entity/dto/QbConfigDto";
import {get, getQbInfo, post, tryLogin, updateQbInfo} from '../util/QbApiUtil';
import GlobalConfigService from "./GlobalConfigService";
import GlobalConfig from "../entity/po/GlobalConfig";
import BtListItemDto from "../entity/dto/BtListItemDto";
import QbCommonDto from "../entity/dto/QbCommonDto";
import logger from "../util/LogUtil";

class QbService {

    /**
     * 保存地址
     * @param body
     */
    static async saveAddress(body: QbConfigDto): Promise<QbConfigDto> {
        if (body.address.endsWith("/")) {
            body.address = body.address.substring(0, body.address.length - 1);
        }
        updateQbInfo(body);
        body.valid = await tryLogin();
        body.version = body ? (await get("/app/version", null)) : null;
        if (parseFloat(body.version.replace("v", "")) < 4.1) {
            body.valid = false;
            body.version = null;
            throw new Error("qb.version-error");
        }
        await GlobalConfigService.insertOrReplace(new GlobalConfig("qbConfig", JSON.stringify(body), "qb config"));
        return body;
    }

    /**
     * 获取当前配置
     */
    static async getConfig(): Promise<QbConfigDto> {
        return getQbInfo();
    }

    /**
     * get torrents list from qb
     */
    static async getBtList(): Promise<Array<BtListItemDto>> {
        let res = await get("/api/v2/torrents/info?category=&sort=added_on", null);
        return res;
    }

    static async commonGet(body: QbCommonDto): Promise<any> {
        return await get(body.url, body.body);
    }


    static async commonPost(body: QbCommonDto): Promise<any> {
        return await post(body.url, body.query, body.body, body.contentType);
    }


    /**
     * 初始化
     */
    static async init() {
        let config = await GlobalConfigService.getVal("qbConfig");
        let qbInfo: QbConfigDto = config == null ? {} : JSON.parse(config);
        updateQbInfo(qbInfo);
        try {
            qbInfo.valid = await tryLogin();
            qbInfo.version = qbInfo.valid ? (await get("/app/version", null)) : null;
        } catch (e) {
            logger.error("qb登录失败:", e);
        }
    }
}

export default QbService;
