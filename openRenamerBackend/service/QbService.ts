import QbAddressDto from "../entity/dto/QbAddressDto";
import { tryLogin, updateQbInfo } from '../util/QbApiUtil';
import GlobalConfigService from "./GlobalConfigService";
import GlobalConfig from "../entity/po/GlobalConfig";

class QbService {

	static async saveAddress(body: QbAddressDto) {
		await tryLogin(body.address, body.username, body.password, false);
		await GlobalConfigService.insertOrReplace(new GlobalConfig("qbAddress", body.address, "qbAdress"));
		await GlobalConfigService.insertOrReplace(new GlobalConfig("qbUsername", body.username, ""));
		await GlobalConfigService.insertOrReplace(new GlobalConfig("qbPassword", body.password, ""));
		await updateQbInfo(body, true);
	}
}

export default QbService;
