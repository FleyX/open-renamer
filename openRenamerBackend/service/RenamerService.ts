import config from '../config';
import * as path from 'path';
import * as fs from 'fs-extra';

import ProcessHelper from '../util/ProcesHelper';
import FileObj from '../vo/FileObj';
import RuleObj from 'vo/RuleObj';
import DeleteRule from '../vo/rules/DeleteRule';

class RenamerService {
    static async readPath(fileList: Array<FileObj>, ruleList): Promise<Array<FileObj>> {
        let obj = new RuleObj({});
        return null;
    }


}

export default RenamerService;
