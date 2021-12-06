<template>
  <div v-loading="loading" element-loading-text="后台处理中，请稍候">
    <br />
    <el-button type="primary" @click="submit" size="default">重命名</el-button>
    <br /><br />
    <!-- 规则列表 -->
    <rule-block @ruleUpdate="ruleUpdate" />
    <!-- 文件预览列表 -->
    <div class="fileList">
      <div>
        文件列表
        <el-button type="primary" @click="dialogVisible = true" size="small">新增</el-button>
        <el-button type="primary" size="mini" @click="selectAllFiles">反选</el-button>
        <el-button type="danger" size="mini" @click="deleteCheckedFiles">删除</el-button>
      </div>
      <div class="fileBlock">
        <div class="oneLine" v-for="(item, index) in fileList" :key="index">
          <!-- 左侧原始文件名 -->
          <el-checkbox v-model="item.checked" class="left">
            <div class="oneFileName">
              {{ item.name }}
              <ArrowDownBold
                style="width: 20px; padding-left: 10px"
                v-if="index < fileList.length - 1"
                @click.stop.prevent="moveIndex(index + 1, index)"
              />
              <ArrowUpBold style="width: 20px; padding-left: 10px" v-if="index > 0" @click.stop.prevent="moveIndex(index - 1, index)" />
            </div>
          </el-checkbox>
          <!-- 修改后的文件名 -->
          <div class="right">
            {{ changedFileList.length > index ? changedFileList[index].name : "" }}
          </div>
        </div>
      </div>
    </div>
    <!-- 新增文件弹窗 -->

    <el-dialog title="新增文件" v-model="dialogVisible" width="70%">
      <file-chose @addData="addData" />
    </el-dialog>
  </div>
</template>

<script>
// @ is an alias to /src
import { ArrowDownBold, ArrowUpBold } from "@element-plus/icons";
import HttpUtil from "../../utils/HttpUtil";
import FileChose from "@/components/FileChose";
import RuleBlock from "./components/RuleBlock.vue";
export default {
  name: "Home",
  components: {
    FileChose,
    ArrowDownBold,
    ArrowUpBold,
    RuleBlock,
  },
  data() {
    return {
      loading: false, //遮罩
      dialogVisible: false, //新增文件弹窗
      ruleList: [], //当前生效的规则
      fileList: [],
      changedFileList: [],
      needPreview: false, //需要点击预览
      applicationRule: null, //当前应用的应用规则模板
    };
  },

  methods: {
    //新增文件
    async addData(data) {
      data.forEach((item) => (item.checked = false));
      this.fileList.push(...data);
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
    async moveIndex(newIndex, index) {
      let temp = this.fileList[index];
      this.fileList[index] = this.fileList[newIndex];
      this.fileList[newIndex] = temp;
      this.fileList = [...this.fileList];
      this.needPreview = true;
      await this.showResult();
    },
  },
};
</script>

<style lang="less" scoped>
.fileList {
  margin-top: 20px;
  text-align: left;

  .fileBlock {
    margin-top: 20px;
    .oneLine {
      display: flex;
      border-top: 1px solid rgb(228, 224, 224);
      .left {
        flex: 1;
      }
      .right {
        flex: 1;
        display: flex;
        align-items: center;
      }
    }

    .oneFileName {
      display: flex;
      align-items: center;
    }
  }
}
</style>
