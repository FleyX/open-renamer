<template>
  <div class="flex">
    <span class="left">识别类型：</span>
    <div class="location">
      <el-radio v-for="item in radioList" :key="item.code" v-model="ruleObj.data.type" :label="item.code"
        >{{ item.label }}
        <el-tooltip effect="dark" :content="item.message" placement="top">
          <el-icon><InfoFilled /></el-icon>
        </el-tooltip>
      </el-radio>
    </div>
  </div>
  <div class="flex" v-if="ruleObj.data.type == 'eNum'">
    <div class="left">集数宽度:</div>
    <el-input-number :min="1" v-model="ruleObj.data.eNumWidth" />
  </div>
  <div class="flex">
    <div class="left">前面追加:</div>
    <el-input v-model="ruleObj.data.frontAdd" placeholder="识别内容前面追加,未识别到不会追加" style="width: 20em" />
  </div>
  <div class="flex">
    <div class="left">后面追加:</div>
    <el-input v-model="ruleObj.data.endAdd" placeholder="识别内容后面追加,未识别到不会追加" style="width: 20em" />
  </div>
</template>

<script>
import { InfoFilled } from "@element-plus/icons-vue";
export default {
  name: "AutoRule",
  props: ["editRule"],
  components: { InfoFilled },
  data() {
    return {
      radioList: [
        {
          label: "季号识别",
          message: '通过识别文件夹名称获取季号，放在插入文本最后,可识别"s1","s01","season 01","season01"等以s或season开头后接数字的',
          code: "season",
        },
        {
          label: "集数识别",
          message: "通过提取文件名称来提取集数，支持 E数字/e数字/(数字)/（数字）/.数字/-数字/纯数字 。优先级依次递减，如果存在多组纯数字，选择第一组",
          code: "eNum",
        },
        {
          label: "剧名/电影名识别",
          message:
            "如果父文件夹包含season字段，那么会从父文件夹的父文件夹名称中取剧名，否则将从父文件夹名称中取电影名。规则为从开头开始取，直到遇见第一个空格/./[等符号",
          code: "name",
        },
        {
          label: "分辨率识别",
          message: "通过文件名提取出分辨率，支持 数字P/数字p/1k/1K/2k/2K/4k/4K",
          code: "resolution",
        },
      ],
      ruleObj: {
        type: "auto",
        message: "",
        data: {
          type: "",
          frontAdd: "",
          endAdd: "",
          eNumWidth: 2,
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
      if (this.ruleObj.data.type === "") {
        this.$message({ message: "请选择识别类型", type: "warning" });
        return null;
      }
      this.ruleObj.message = `自动识别:"${this.radioList.filter((item) => item.code == this.ruleObj.data.type)[0].label}";`;
      if (this.ruleObj.data.type == "eNum") {
        this.ruleObj.message += "集数宽度:" + this.ruleObj.data.eNumWidth + ";";
      }
      if (this.ruleObj.data.frontAdd.length > 0) {
        this.ruleObj.message += `前缀添加:${this.ruleObj.data.frontAdd}`;
      }
      if (this.ruleObj.data.endAdd.length > 0) {
        this.ruleObj.message += `后缀添加:${this.ruleObj.data.endAdd}`;
      }
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
    flex-direction: column;
    display: flex;
  }
}
</style>
