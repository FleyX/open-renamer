import QbConfigDto from "../entity/dto/QbConfigDto";
import {tryLogin, get, post, updateQbInfo, getQbInfo} from '../util/QbApiUtil';
import GlobalConfigService from "./GlobalConfigService";
import GlobalConfig from "../entity/po/GlobalConfig";
import BtListItemDto from "../entity/dto/BtListItemDto";

class QbService {

    /**
     * 保存地址
     * @param body
     */
    static async saveAddress(body: QbConfigDto): Promise<QbConfigDto> {
        if (body.address.endsWith("/")) {
            body.address = body.address.substring(0, body.address.length - 1);
        }
        await GlobalConfigService.insertOrReplace(new GlobalConfig("qbConfig", JSON.stringify(body), "qb config"));
        updateQbInfo(body);
        body.valid = await tryLogin();
        body.version = body ? (await get("/app/version", null)) : null;
        return body;
    }
a
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

    /**
     * 初始化
     */
    static async init() {
        let config = await GlobalConfigService.getVal("qbConfig");
        let qbInfo: QbConfigDto = config == null ? {} : JSON.parse(config);
        updateQbInfo(qbInfo);
        qbInfo.valid = await tryLogin();
        qbInfo.version = qbInfo.valid ? (await get("/app/version", null)) : null;
        return qbInfo;
    }
}

export default QbService;
