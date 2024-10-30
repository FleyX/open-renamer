<template>
  <div v-loading="loading" element-loading-text="后台处理中，请稍候">
    <br/>
    <el-button type="success" @click="submit" size="default">开始重命名</el-button>
    <el-divider content-position="left">
      <div class="head-text">规则设置</div>
    </el-divider>
    <!-- 规则列表 -->
    <rule-block @ruleUpdate="ruleUpdate"/>
    <el-divider content-position="left">
      <div class="head-text">文件预览</div>
    </el-divider>
    <!-- 文件预览列表 -->
    <div class="fileList">
      <div>
        <el-tooltip effect="dark" content="添加需要重命名的文件" placement="top">
          <el-button type="primary" @click="showFileAdd" size="small">添加</el-button>
        </el-tooltip>
        收藏路径:
        <el-tag v-for="item in savePathList" :round="true" class="savePath" closable :key="item.id"
                @click="clickSavePath(item)" @close="deleteSavePath(item)" text>{{ item.name }}
        </el-tag>
      </div>
      <div style="margin-top: 5px">
        <el-button type="primary" size="small" @click="selectAllFiles">{{ allChecked ? "不选" : "全选" }}</el-button>
        <el-tooltip effect="dark" content="一键选中所有的非视频、字幕文件和小于5MB的视频文件" placement="bottom">
          <el-button type="success" size="small" @click="choseAdFile">一键选择</el-button>
        </el-tooltip>
        <el-tooltip effect="dark" content="移除（非删除）需要重命名的文件" placement="bottom">
          <el-button type="warning" size="small" @click="removeCheckedFiles">移除</el-button>
        </el-tooltip>
        <el-popconfirm width="250" confirm-button-text="确认" cancel-button-text="取消"
                       title="确认删除勾选的文件(无法恢复)？" @confirm="deleteCheckedFiles">
          <template #reference>
            <el-button type="danger" size="small">删除</el-button>
          </template>
        </el-popconfirm>
        <el-button type="primary" size="small" @click="moveIndex('top')">
          <el-tooltip effect="dark" content="上移规则" placement="top">
            <el-icon>
              <top/>
            </el-icon>
          </el-tooltip>
        </el-button>
        <el-button type="primary" size="small" @click="moveIndex('bottom')">
          <el-tooltip effect="dark" content="下移规则" placement="top">
            <el-icon>
              <bottom/>
            </el-icon>
          </el-tooltip>
        </el-button>
        <el-button type="primary" size="small" @click="editFile">
          <el-tooltip effect="dark" content="修改文件名" placement="top">
            <el-icon>
              <Edit/>
            </el-icon>
          </el-tooltip>
        </el-button>
      </div>
      <div class="fileBlock">
        <!-- 左侧原始文件名 -->
        <div style="width:50%;">
          <div v-for="(item, index) in showFileList" :key="index" class="oneLine">
            <el-checkbox class="oneLineText" style="width: 95%" v-model="item.checked">
              <el-tooltip show-after="300" style="color:white" effect="dark" :content="item.name" placement="top">
                <span class="oneLineText" style="width: 100%;display: inline-block">{{ item.name }}</span>
              </el-tooltip>
            </el-checkbox>
          </div>
        </div>
        <!-- 右边的预览文件名 -->
        <div style="width:50%">
          <div v-for="(item, index) in showChangedFileList" :key="index" class="oneLine">
            <div style="display:inline-block;width:72%;" class="oneLineText">
              <el-tooltip show-after="300" style="color:white" effect="dark" :content="item.name" placement="top">
                <span class="oneLineText" style="width: 100%;display: inline-block">{{ item.name }}</span>
              </el-tooltip>
            </div>
            <div style="display:inline-block;color: red; width: 25%">{{ item.errorMessage }}</div>
          </div>
        </div>
      </div>
    </div>
    <!-- 新增文件弹窗 -->

    <el-dialog title="新增文件" v-model="dialogVisible" width="70%">
      <file-chose ref="fileChose" type="file" :curChoosePath="curChoosePath" @addData="addData"
                  @refreshSavePathList="refreshSavePathList"/>
    </el-dialog>
    <el-dialog title="编辑名称" v-model="showNameEditDialog" width="50%">
      <el-input type="text" v-model="newName"/>
      <div>
        <el-button type="primary" @click="doEditFile">确认</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
// @ is an alias to /src
import {Top, Bottom, Edit} from "@element-plus/icons-vue";
import HttpUtil from "../../utils/HttpUtil";
import FileChose from "@/components/FileChose";
import RuleBlock from "@/components/rules/RuleBlock.vue";
import Bus from "../../utils/Bus";
import Tips from '@/components/Tips';

let numberSet = new Set(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);

export default {
  name: "Home",
  components: {
    FileChose, RuleBlock, Top, Bottom, Tips, Edit
  },
  data() {
    return {
      loading: false, //遮罩
      dialogVisible: false, //新增文件弹窗
      ruleList: [], //当前生效的规则
      fileList: [], //选择的文件
      changedFileList: [], //执行修改后的文件
      applicationRule: null, //当前应用的应用规则模板
      savePathList: [], //收藏的路径列表
      curChoosePath: null, //当前选择的收藏路径
      timer: null, //修改顺序计时器
      newName: "", //新的文件名
      currentEditFile: null,
      showNameEditDialog: false //显示编辑文件弹窗
    };
  },
  computed: {
    allChecked() {
      return this.fileList.length > 0 && this.fileList.filter(item => item.checked).length === this.fileList.length;
    },
    showFileList() {
      return this.fileList.length > 500 ? this.fileList.slice(0, 500) : this.fileList;
    },
    showChangedFileList() {
      return this.changedFileList && this.changedFileList.length > 500 ? this.changedFileList.slice(0, 500) : this.changedFileList;
    }
  },
  async created() {
    this.savePathList = await HttpUtil.get("/file/path");
    window.isWindows = await HttpUtil.get("/file/isWindows");
    Bus.$on("refreshSavePathList", this.refreshSavePathList);
  },
  methods: {
    //新增文件
    async addData(data) {
      let existSet = new Set();
      data.forEach((item) => (item.checked = false));
      this.fileList.forEach(item => existSet.add(item.path + item.name));
      this.fileList.push(...data.filter(item => !existSet.has(item.path + item.name)));
      this.fileList = [...this.fileList.sort((a, b) => compareStr(a.name, b.name))];
      this.dialogVisible = false;
      await this.showResult();
    },
    async ruleUpdate(rules, preview) {
      console.log(rules, preview);
      this.ruleList = rules;
      if (preview) {
        await this.showResult();
      }
    },
    //预览结果
    async showResult() {
      if (this.fileList.length > 500) {
        this.$message.info("文件数过多，仅展示前500个(不影响重命名)");
      }
      this.changedFileList = [];
      if (!this.checkRuleAndFile()) {
        return;
      }
      this.loading = true;
      let body = {
        fileList: this.fileList,
        ruleList: this.ruleList.filter((item) => !item.blocked),
      };
      this.changedFileList = await HttpUtil.post("/renamer/preview", null, body);
      this.fileList = [...this.fileList];
      this.loading = false;
    },
    //提交
    async submit() {
      if (!this.checkRuleAndFile()) {
        return;
      }
      if (this.changedFileList.filter((item) => item.errorMessage).length > 0) {
        this.$message({message: "存在错误，无法执行操作", type: "error"});
        return;
      }
      this.loading = true;
      let body = {
        fileList: this.fileList,
        changedFileList: this.changedFileList,
      };
      try {
        await HttpUtil.post("/renamer/submit", null, body);
        this.$message({message: "重命名成功", type: "success"});
      } finally {
        this.loading = false;
      }
    },
    //移除选中的文件名
    async removeCheckedFiles() {
      this.fileList = this.fileList.filter((item) => !item.checked);
      await this.showResult();
    },
    //delete checked item
    async deleteCheckedFiles() {
      let body = this.fileList.filter((item) => item.checked);
      await HttpUtil.post("/file/deleteBatch", null, body);
      this.fileList = this.fileList.filter((item) => !item.checked);
      await this.showResult();
    },
    //edit file
    async editFile() {
      let list = this.fileList.filter((item) => item.checked);
      if (list.length === 0 || list.length > 1) {
        this.$message({message: "只能选择一个进行编辑", type: "warning"});
        return;
      }
      this.newName = list[0].name;
      this.currentEditFile = list[0];
      this.showNameEditDialog = true;
    },
    async doEditFile() {
      if (!this.newName) {
        this.$message({message: "文件名不能为空", type: "warning"});
        return;
      }
      let target = JSON.parse(JSON.stringify(this.currentEditFile));
      target.name = this.newName;
      await HttpUtil.post("/file/rename", null, {source: this.currentEditFile, target});
      this.currentEditFile.name = this.newName;
      this.fileList = [...this.fileList];
      this.currentEditFile = null;
      this.showNameEditDialog = false;
      await this.showResult();
    },
    selectAllFiles() {
      let checked = !this.allChecked;
      this.fileList.forEach((item) => (item.checked = checked));
    },
    //检查规则和文件
    checkRuleAndFile() {
      if (this.fileList.length === 0) {
        this.$message({message: "请选择文件", type: "warning"});
        return false;
      }
      if (this.ruleList.filter((item) => !item.blocked).length === 0) {
        this.$message({message: "无生效规则", type: "warning"});
        return false;
      }
      return true;
    },
    //移动文件顺序
    async moveIndex(type) {
      let temps = this.fileList.filter((item) => item.checked === true);
      if (temps.length === 0) {
        this.$message({type: "warning", message: "未选中文件，无法移动"});
        return;
      }
      if (type == "top") {
        if (this.fileList.indexOf(temps[0]) == 0) {
          this.$message({type: "warning", message: "无法上移"});
          return;
        }
      } else {
        if (this.fileList.indexOf(temps[temps.length - 1]) == this.fileList.length - 1) {
          this.$message({type: "warning", message: "无法下移"});
          return;
        }
        temps = temps.reverse();
      }
      for (let i in temps) {
        let temp = temps[i];
        let index = this.fileList.indexOf(temp);
        let newIndex = index + (type == "top" ? -1 : 1);
        this.fileList[index] = this.fileList[newIndex];
        this.fileList[newIndex] = temp;
      }
      this.fileList = [...this.fileList];
      if (this.timer != null) {
        clearTimeout(this.timer);
      }
      this.timer = setTimeout(() => {
        this.showResult();
        this.timer = null;
      }, 1000);
    },
    showFileAdd() {
      this.dialogVisible = true;
    },
    //点击收藏路径
    async clickSavePath(item) {
      this.curChoosePath = JSON.parse(item.content);
      this.dialogVisible = true;
    },
    async deleteSavePath(item) {
      console.log(item);
      await HttpUtil.delete("/file/path/delete", {id: item.id});
      Bus.$emit("refreshSavePathList");
    },
    async refreshSavePathList() {
      this.savePathList = await HttpUtil.get("/file/path");
    },
    async choseAdFile() {
      this.fileList.forEach(item => item.checked = item.isAdFile);
    }
  },
};

/**
 * 数字字母混合排序
 * @param a str
 * @param b str
 */
function compareStr(a, b) {
  let an = a.length;
  let bn = b.length;
  for (let i = 0; i < an;) {
    let charA = readChar(a, i, an);
    let charB = readChar(b, i, bn);
    if (charB.length === 0) {
      return 1;
    }
    if (charA !== charB) {
      //读取字符串不相等说明可以得到排序结果
      //如果都为数字，按照数字的比较方法，否则按照字符串比较
      return numberSet.has(charA.charAt(0)) && numberSet.has(charB.charAt(0)) ? Number(charA) - Number(charB) : charA.localeCompare(charB);
    }
    i += charA.length;
  }
  //排到最后都没分结果说明相等
  return 0;
}

/**
 * 读取字符，如果字符为数字就读取整个数字
 * @param a a
 * @param n 数字长度
 */
function readChar(a, i, n) {
  let res = "";
  for (; i < n; i++) {
    let char = a.charAt(i);
    if (numberSet.has(char)) {
      //如果当前字符是数字，添加到结果中
      res += char;
    } else {
      //如果不为数字，但是为第一个字符，直接返回，否则返回res
      if (res.length == 0) {
        return char;
      } else {
        return res;
      }
    }
  }
  return res;
}
</script>

<style lang="less" scoped>
.savePath {
  cursor: pointer;
  margin-right: 0.5em;
}

.fileList {
  margin-top: 20px;
  text-align: left;

  .fileBlock {
    margin-top: 20px;
    display: flex;

    .el-checkbox__label {
      width: 95%;
    }


    .oneLine {
      display: flex;
      align-items: center;
      border-top: 1px solid rgb(214, 212, 212);
      height: 1.5em;
      padding-top: 0.1em;
      padding-bottom: 0.1em;
      padding-right: 0.2em;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .oneLineText {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .oneFileName {
      display: flex;
      align-items: center;
    }
  }
}
</style>
