<template>
  <div v-loading="loading" element-loading-text="后台处理中，请稍候">
    <el-button type="primary" @click="dialogVisible = true" size="small"
      >新增文件</el-button
    >
    <el-button type="primary" @click="showResult" size="small">预览</el-button>
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
      <div>文件列表</div>
      <div class="fileBlock">
        <div v-for="(item, index) in fileList" :key="index">
          {{ item.name }}
        </div>
      </div>
      <div class="fileBlock">
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
import HttpUtil from "../../utils/HttpUtil";
import FileChose from "@/components/FileChose";
import Rule from "@/components/Rule";
export default {
  name: "Home",
  components: { FileChose, Rule },
  data() {
    return {
      loading: false, //遮罩
      dialogVisible: false,
      ruleDialogShow: false, //规则弹床
      fileList: [],
      changedFileList: [],
      ruleList: [],
      editRule: null,
    };
  },
  computed: {
    checkedRules() {
      return this.ruleList.filter((item) => item.checked);
    },
  },
  methods: {
    addData(data) {
      console.log(data);
      this.fileList.push(...data);
      this.dialogVisible = false;
    },
    ruleAdd(data) {
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
    },
    //禁用/启用
    block() {
      this.ruleList
        .filter((item) => item.checked)
        .forEach((item) => (item.blocked = !item.blocked));
    },
    //删除规则
    deleteRule() {
      this.ruleList = this.ruleList.filter((item) => !item.checked);
    },
    //编辑规则
    editClick() {
      this.editRule = this.checkedRules[0];
      this.ruleDialogShow = true;
    },
    //预览结果
    showResult() {
      this.loading = true;
      HttpUtil.post();
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

.fileBlock {
  text-align: left;
  display: inline-block;
  width: 50%;
}
</style>
