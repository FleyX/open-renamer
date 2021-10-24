<template>
  <div v-loading="loading" element-loading-text="后台处理中，请稍候">
    <el-button type="primary" @click="dialogVisible = true" size="small"
      >新增文件</el-button
    >
    <el-button type="primary" @click="showResult" size="small">预览</el-button>
    <el-button type="primary" @click="submit" size="small">重命名</el-button>
    <!-- 规则列表 -->
    <div class="ruleList">
      <div class="menu">
        <span>应用规则</span>
        <el-button type="primary" size="mini" @click="ruleDialogShow = true"
          >新增</el-button
        >
        <el-button
          type="primary"
          size="mini"
          v-if="checkedRules.length == 1"
          @click="editClick"
          >编辑</el-button
        >
        <el-button type="warning" size="mini" @click="block"
          >禁用/启用</el-button
        >
        <el-button type="danger" size="mini" @click="deleteRule"
          >删除</el-button
        >
      </div>
      <div class="ruleBlock">
        <el-checkbox
          v-model="item.checked"
          v-for="(item, index) in ruleList"
          :key="index"
        >
          <s v-if="item.blocked">{{ item.message }}</s>
          <span v-else>{{ item.message }}</span>
        </el-checkbox>
      </div>
    </div>
    <!-- 文件预览列表 -->
    <div class="fileList">
      <div>
        文件列表

        <el-button type="primary" size="mini" @click="selectAllFiles"
          >反选</el-button
        >
        <el-button type="danger" size="mini" @click="deleteCheckedFiles"
          >删除</el-button
        >
      </div>
      <div class="fileBlock">
        <!-- 左侧原始文件名 -->
        <el-checkbox
          style="display: block"
          v-for="(item, index) in fileList"
          :key="index"
          v-model="item.checked"
          ><div class="oneFileName">
            {{ item.name }}
            <ArrowDownBold
              style="width: 20px; padding-left: 10px"
              v-if="index < fileList.length - 1"
              @click.stop.prevent="moveIndex(index + 1, index)"
            />
            <ArrowUpBold
              style="width: 20px; padding-left: 10px"
              v-if="index > 0"
              @click.stop.prevent="moveIndex(index - 1, index)"
            />
          </div>
        </el-checkbox>
      </div>
      <div class="fileBlock">
        <!-- 右侧修改后的文件名-->
        <div v-for="(item, index) in changedFileList" :key="index">
          {{ item.name }}
        </div>
      </div>
    </div>
  </div>
  <el-dialog
    title="新增文件"
    v-model="dialogVisible"
    width="70%"
    :before-close="handleClose"
  >
    <file-chose v-if="dialogVisible" @addData="addData" />
  </el-dialog>

  <el-dialog
    title="新增规则"
    v-model="ruleDialogShow"
    width="70%"
    :before-close="handleClose"
  >
    <rule :editRule="editRule" v-if="ruleDialogShow" @ruleAdd="ruleAdd" />
  </el-dialog>
</template>

<script>
// @ is an alias to /src
import { ArrowDownBold, ArrowUpBold } from "@element-plus/icons";
import HttpUtil from "../../utils/HttpUtil";
import FileChose from "@/components/FileChose";
import Rule from "@/components/Rule";
export default {
  name: "Home",
  components: { FileChose, Rule, ArrowDownBold, ArrowUpBold },
  data() {
    return {
      loading: false, //遮罩
      dialogVisible: false,
      ruleDialogShow: false, //规则弹床
      fileList: [],
      changedFileList: [],
      ruleList: [],
      editRule: null, //当前编辑的规则
      needPreview: false, //需要点击预览
    };
  },
  computed: {
    checkedRules() {
      return this.ruleList.filter((item) => item.checked);
    },
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
    //新增规则
    async ruleAdd(data) {
      data.checked = false;
      data.blocked = false;
      if (this.editRule != null) {
        let index = this.ruleList.indexOf(this.editRule);
        this.ruleList.splice(index, 1, data);
        this.editRule = null;
      } else {
        this.ruleList.push(data);
      }
      this.ruleDialogShow = false;

      this.needPreview = true;
      await this.showResult();
    },
    //禁用/启用
    async block() {
      this.ruleList
        .filter((item) => item.checked)
        .forEach((item) => (item.blocked = !item.blocked));
      this.needPreview = true;
      await this.showResult();
    },
    //删除规则
    async deleteRule() {
      this.ruleList = this.ruleList.filter((item) => !item.checked);
      this.needPreview = true;
      await this.showResult();
    },
    //编辑规则
    editClick() {
      this.editRule = this.checkedRules[0];
      this.ruleDialogShow = true;
    },
    //预览结果
    async showResult() {
      if (!this.checkRuleAndFile()) {
        return;
      }
      this.loading = true;
      let body = {
        fileList: this.fileList,
        ruleList: this.ruleList,
      };
      this.changedFileList = await HttpUtil.post(
        "/renamer/preview",
        null,
        body
      );
      this.needPreview = false;
      this.loading = false;
    },
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
      await HttpUtil.post("/renamer/submit", null, body);
      this.loading = false;
      this.$message({ message: "重命名成功", type: "success" });
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
.ruleList {
  border: 1px solid black;
  padding: 5px;
  .menu {
    display: flex;
    justify-content: left;
    align-items: center;
  }
  .ruleBlock {
    text-align: left;
    display: flex;
    flex-direction: column;
    align-items: baseline;
  }
}

.fileList {
  margin-top: 20px;
  text-align: left;

  .fileBlock {
    text-align: left;
    display: inline-block;
    width: 50%;

    .oneFileName {
      display: flex;
      align-items: center;
    }
  }
}
</style>
