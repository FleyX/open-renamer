<template>
  <div class="flex">
    <span class="left">插入：</span>
    <el-input style="flex: 1" v-model="ruleObj.data.insertContent" />
  </div>
  <div class="flex">
    <span class="left">位置：</span>
    <div class="location">
      <el-radio style="margin-top: 1em" v-model="ruleObj.data.type" label="front">前缀</el-radio>
      <el-radio style="margin-top: 1em" v-model="ruleObj.data.type" label="backend">后缀</el-radio>
      <el-radio style="margin-top: 1em" v-model="ruleObj.data.type" label="at"
        >位置:<el-input-number size="small" v-model="ruleObj.data.atInput" />
        &nbsp;&nbsp;
        <el-switch v-model="ruleObj.data.atIsRightToleft" :min="1" active-text="从右到左" inactive-text="从左到右" />
      </el-radio>
      <el-radio style="margin-top: 1em" v-model="ruleObj.data.type" label="replace">替换当前文件名</el-radio>
    </div>
  </div>
  <div class="flex">
    <div class="left">忽略拓展名:</div>
    <el-switch v-model="ruleObj.data.ignorePostfix" />
  </div>
  <div class="flex">
    <div class="left">季号识别:</div>
    <el-switch v-model="ruleObj.data.autoSeason" />
    <el-tooltip effect="dark" :content="message1" placement="top">
      <el-icon><InfoFilled /></el-icon>
    </el-tooltip>
  </div>
  <div class="flex">
    <div class="left">有效后缀:</div>
    <el-switch v-model="ruleObj.data.endFilter" />
    <template v-if="ruleObj.data.endFilter">
      <el-tag v-for="item in ruleObj.data.validEnd" closable :key="item" @close="deleteEnd(item)" text>{{ item }}</el-tag>
      <el-input v-if="validEndInputShow" v-model="validEndInput" style="width: 5em" size="small" @keyup.enter="validEndAdd" @blur="validEndAdd" />
      <el-button v-else class="button-new-tag ml-1" size="small" @click="validEndInputShow = true">+ 新增</el-button>
    </template>
    <el-tooltip effect="dark" :content="message2" placement="top">
      <el-icon><InfoFilled /></el-icon>
    </el-tooltip>
  </div>
</template>

<script>
import { InfoFilled } from "@element-plus/icons-vue";
export default {
  name: "InsertRule",
  props: ["editRule"],
  components: { InfoFilled },
  data() {
    return {
      message1: '通过识别文件夹名称获取季号，放在插入文本最后,可识别"s1","s01","season 01","season01"等以s或season开头后接数字的',
      message2: '开启本选项后，本规则只在后缀匹配时才会生效.(输入后缀不包含".")',
      validEndInputShow: false,
      validEndInput: "",
      ruleObj: {
        type: "insert",
        message: "",
        data: {
          insertContent: "",
          type: "",
          atInput: 0,
          atIsRightToleft: false,
          ignorePostfix: true,
          autoSeason: false,
          endFilter: false,
          validEnd: ["srt", "ass"],
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
      if (this.ruleObj.data.insertContent.length == 0 || this.ruleObj.data.type.length == 0) {
        this.$message({ message: "请填写完整", type: "warning" });
        return null;
      }
      this.ruleObj.message = `插入:"${this.ruleObj.data.insertContent}"`;
      return this.ruleObj;
    },
    validEndAdd() {
      this.ruleObj.data.validEnd.push(this.validEndInput);
      this.validEndInput = "";
      this.validEndInputShow = false;
    },
    deleteEnd(item) {
      this.ruleObj.data.validEnd.splice(this.ruleObj.data.validEnd.indexOf(item), 1);
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
    flex-direction: column;
    display: flex;
  }
}
</style>
