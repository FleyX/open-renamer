<template>
  <div class="flex">
    <span class="left">操作：</span>
    <div class="location">
      <el-radio v-model="ruleObj.data.type" :label="1">简体转繁体</el-radio>
      <el-radio v-model="ruleObj.data.type" :label="2">繁体转简体</el-radio>
    </div>
  </div>

  <div class="flex">
    <span class="left">繁体类型：</span>
    <div class="location">
      <el-radio v-model="ruleObj.data.traditionalType" :label="0">繁体中文</el-radio>
      <el-radio v-model="ruleObj.data.traditionalType" :label="1">港澳繁体</el-radio>
      <el-radio v-model="ruleObj.data.traditionalType" :label="2">台湾正体</el-radio>
    </div>
  </div>
</template>

<script>
import {InfoFilled} from "@element-plus/icons-vue";

const traTypeMap = {
  "0": "繁体中文",
  "1": "港澳繁体",
  "2": "台湾正体"
}

export default {
  name: "InsertRule",
  props: ["editRule"],
  components: {InfoFilled},
  data() {
    return {
      ruleObj: {
        type: "translate",
        message: "",
        data: {
          type: 1,
          traditionalType: 1,
        },
      },
    };
  },
  created() {
    if (this.editRule) {
      console.log(this.editRule);
      this.ruleObj = JSON.parse(JSON.stringify(this.editRule));
    }
  },
  methods: {
    exportObj() {
      this.ruleObj.message = `简繁转换:"${this.ruleObj.data.type === 1 ? '简体转繁体' : '繁体转简体'}",繁体类型：${traTypeMap[this.ruleObj.data.traditionalType]}`;
      return this.ruleObj;
    },
  },
};
</script>

<style lang="less" scoped>
.flex {
  display: flex;
  justify-content: left;
  align-items: center;
  padding-top: 1em;

  .left {
    width: 6em;
  }

  .location {
    justify-content: left;
    //flex-direction: column;
    display: flex;
  }
}
</style>
