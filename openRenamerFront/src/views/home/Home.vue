<template>
  <div v-loading="loading" element-loading-text="后台处理中，请稍候">
    <br />
    <el-button type="success" @click="submit" size="default">开始重命名</el-button>
    <el-divider content-position="left"><div class="head-text">规则设置</div></el-divider>
    <!-- 规则列表 -->
    <rule-block @ruleUpdate="ruleUpdate" />
    <el-divider content-position="left"><div class="head-text">文件预览</div></el-divider>
    <!-- 文件预览列表 -->
    <div class="fileList">
      <div>
        <el-button type="primary" @click="showFileAdd" size="small">新增</el-button>
        收藏路径:<el-tag
          v-for="item in savePathList"
          :round="true"
          class="savePath"
          closable
          :key="item.id"
          @click="clickSavePath(item)"
          @close="deleteSavePath(item)"
          text
          >{{ item.name }}</el-tag
        >
      </div>
      <div>
        <el-button type="primary" size="small" @click="selectAllFiles">反选</el-button>
        <el-button type="danger" size="small" @click="deleteCheckedFiles">删除</el-button>
        <template v-if="showMove">
          <el-button type="primary" size="small" @click="moveIndex('top')">
            <el-tooltip effect="dark" content="上移规则" placement="top">
              <el-icon><top /></el-icon>
            </el-tooltip>
          </el-button>
          <el-button type="primary" size="small" @click="moveIndex('bottom')">
            <el-tooltip effect="dark" content="下移规则" placement="top"
              ><el-icon><bottom /></el-icon
            ></el-tooltip>
          </el-button>
        </template>
      </div>
      <div class="fileBlock">
        <!-- 左侧原始文件名 -->
        <div style="flex: 4">
          <div v-for="(item, index) in fileList" :key="index" class="oneLine">
            <el-checkbox v-model="item.checked" style="height: 1.2em">{{ item.name }}</el-checkbox>
          </div>
        </div>
        <!-- 右边的预览文件名 -->
        <div style="flex: 4">
          <div v-for="(item, index) in changedFileList" :key="index" class="oneLine">
            <div style="flex: 4">{{ item.name }}</div>
            <div style="color: red; flex: 1">{{ item.errorMessage }}</div>
          </div>
        </div>
      </div>
    </div>
    <!-- 新增文件弹窗 -->

    <el-dialog title="新增文件" v-model="dialogVisible" width="70%">
      <file-chose ref="fileChose" :curChoosePath="curChoosePath" @addData="addData" @refreshSavePathList="refreshSavePathList" />
    </el-dialog>
  </div>
</template>

<script>
// @ is an alias to /src
import { Top, Bottom } from "@element-plus/icons-vue";
import HttpUtil from "../../utils/HttpUtil";
import FileChose from "@/components/FileChose";
import RuleBlock from "./components/RuleBlock.vue";
import Bus from "../../utils/Bus";

let numberSet = new Set(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);

export default {
  name: "Home",
  components: {
    FileChose,
    RuleBlock,
    Top,
    Bottom,
  },
  data() {
    return {
      loading: false, //遮罩
      dialogVisible: false, //新增文件弹窗
      ruleList: [], //当前生效的规则
      fileList: [], //选择的文件
      changedFileList: [], //执行修改后的文件
      needPreview: false, //需要点击预览
      applicationRule: null, //当前应用的应用规则模板
      savePathList: [], //收藏的路径列表
      curChoosePath: null, //当前选择的收藏路径
      timer: null, //修改顺序计时器
    };
  },
  computed: {
    showMove() {
      return this.fileList.filter((item) => item.checked == true).length == 1;
    },
  },
  async created() {
    this.savePathList = await HttpUtil.get("/file/path");
    window.isWindows = await HttpUtil.get("/file/isWindows");
    Bus.$on("refreshSavePathList", this.refreshSavePathList);
  },
  methods: {
    //新增文件
    async addData(data) {
      data.forEach((item) => (item.checked = false));
      this.fileList.push(...data);
      this.fileList = [...this.fileList.sort((a, b) => compareStr(a.name, b.name))];
      this.dialogVisible = false;
      this.needPreview = true;
      await this.showResult();
    },
    async ruleUpdate(rules) {
      this.ruleList = rules;
      this.needPreview = true;
      await this.showResult();
    },
    //预览结果
    async showResult() {
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
      this.needPreview = false;
      this.loading = false;
    },
    //提交
    async submit() {
      if (!this.checkRuleAndFile()) {
        return;
      }
      if (this.changedFileList.filter((item) => item.errorMessage).length > 0) {
        this.$message({ message: "存在错误，无法执行操作", type: "error" });
        return;
      }
      this.loading = true;
      let body = {
        fileList: this.fileList,
        changedFileList: this.changedFileList,
      };
      try {
        await HttpUtil.post("/renamer/submit", null, body);
        this.$message({ message: "重命名成功", type: "success" });
      } finally {
        this.loading = false;
      }
    },
    //删除选中的文件名
    async deleteCheckedFiles() {
      this.fileList = this.fileList.filter((item) => !item.checked);
      this.needPreview = true;
      await this.showResult();
    },
    //反选
    selectAllFiles() {
      this.fileList.forEach((item) => (item.checked = !item.checked));
    },
    //检查规则和文件
    checkRuleAndFile() {
      if (this.fileList.length == 0) {
        this.$message({ message: "请选择文件", type: "warning" });
        return false;
      }
      if (this.ruleList.filter((item) => !item.blocked).length == 0) {
        this.$message({ message: "无生效规则", type: "warning" });
        return false;
      }
      return true;
    },
    //移动文件顺序
    async moveIndex(type) {
      let temp = this.fileList.filter((item) => item.checked == true)[0];
      let index = this.fileList.indexOf(temp);
      let newIndex;
      if (type == "top") {
        if (index == 0) {
          return;
        }
        newIndex = index - 1;
      } else {
        if (index == this.fileList.length - 1) {
          return;
        }
        newIndex = index + 1;
      }
      this.fileList[index] = this.fileList[newIndex];
      this.fileList[newIndex] = temp;
      this.fileList = [...this.fileList];
      this.needPreview = true;
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
      await HttpUtil.delete("/file/path/delete", { id: item.id });
      Bus.$emit("refreshSavePathList");
    },
    async refreshSavePathList() {
      this.savePathList = await HttpUtil.get("/file/path");
    },
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
  for (let i = 0; i < an; ) {
    let charA = readChar(a, i, an);
    let charB = readChar(b, i, bn);
    if (charB.length == 0) {
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
    .oneLine {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgb(214, 212, 212);
      height: 1.5em;
      padding-top: 0.1em;
      padding-bottom: 0.1em;
      padding-right: 0.2em;
    }

    .oneFileName {
      display: flex;
      align-items: center;
    }
  }
}
</style>
