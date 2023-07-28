import QbAddressDto from "../entity/dto/QbAddressDto";
import {tryLogin, updateQbInfo, getQbInfo} from '../util/QbApiUtil';
import GlobalConfigService from "./GlobalConfigService";
import GlobalConfig from "../entity/po/GlobalConfig";

class QbService {

    /**
     * 保存地址
     * @param body
     */
    static async saveAddress(body: QbAddressDto): Promise<boolean> {
        await GlobalConfigService.insertOrReplace(new GlobalConfig("qbAddress", body.address, "qbAdress"));
        await GlobalConfigService.insertOrReplace(new GlobalConfig("qbUsername", body.username, ""));
        await GlobalConfigService.insertOrReplace(new GlobalConfig("qbPassword", body.password, ""));
        body.valid = await tryLogin();
        updateQbInfo(body);
        return body.valid;
    }

    /**
     * 获取当前配置
     */
    static async getAddress(): Promise<QbAddressDto> {
        return getQbInfo();
    }

    static async init() {
        let config = await GlobalConfigService.getMultVal(["qbAddress", "qbUsername", "qbPassword"]);
        let qbInfo: QbAddressDto = {
            address: config.qbAddress,
            username: config.qbUsername,
            password: config.qbPassword,
            valid: true
        }
        updateQbInfo(qbInfo);
        qbInfo.valid = await tryLogin();
    }
}

export default QbService;
