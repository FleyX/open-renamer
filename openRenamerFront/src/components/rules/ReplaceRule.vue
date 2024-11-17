<template>
  <div class="flex">
    <span class="left">源：</span>
    <el-input style="width:20em" v-model="ruleObj.data.source" />
  </div>
  <div class="flex">
    <span class="left">目标：</span>
    <el-input style="width:20em" v-model="ruleObj.data.target" />
  </div>
  <div class="flex">
    <div class="left">正则模式:</div>
    <el-switch v-model="ruleObj.data.regFlag" />
    <el-tooltip effect="dark" :content="regTip" placement="right">
      <el-icon>
        <InfoFilled />
      </el-icon>
    </el-tooltip>
  </div>
  <div class="flex">
    <div class="left">区分大小写:</div>
    <el-switch v-model="ruleObj.data.regI" />
  </div>
  <div class="flex">
    <span class="left">替换选项：</span>
    <div class="location">
      <el-radio v-for="item in radioList" :key="item.code" v-model="ruleObj.data.type" :label="item.code"
      >{{ item.label }}
      </el-radio>
    </div>
  </div>
  <div class="flex">
    <div class="left">忽略拓展名:</div>
    <el-switch v-model="ruleObj.data.ignorePostfix"/>
  </div>
</template>

<script>
import { InfoFilled } from "@element-plus/icons-vue";
import { nullToDefault } from "@/utils/ValUtil";

export default {
  name: "ReplaceRule",
  components: { InfoFilled },
  props: ["editRule"],
  data() {
    return {
      regTip: `开启支持js正则匹配，支持分组匹配,目标字符串支持模板#{groupN},N表示匹配到的第几组。比如#{group1}将被替换为匹配到的第一组数据`,
      radioList: [
        {
          label: "替换第一个",
          code: 1
        },
        {
          label: "替换最后一个",
          code: 2
        },
        {
          label: "全部替换",
          code: 3
        }
      ],
      ruleObj: {
        type: "replace",
        message: "",
        data: {
          source: "",
          target: "",
          type: 1, //1:替换第一个，2：替换最后一个，3：全部替换
          ignorePostfix: true,  //忽略拓展名
          regFlag: false,  //正则模式
          regI: false  //是否区分大小写
        }
      }
    };
  },
  created() {
    if (this.editRule) {
      console.log(this.editRule);
      this.ruleObj = JSON.parse(JSON.stringify(this.editRule));
      //兼容历史数据
      this.ruleObj.data.ignorePostfix = nullToDefault(this.ruleObj.data.ignorePostfix, true);
      this.ruleObj.data.regFlag = nullToDefault(this.ruleObj.data.regFlag, false);
    }
  },
  methods: {
    exportObj() {
      if (!this.ruleObj.data.source) {
        this.$message({ message: "源不能为空", type: "warning" });
        return null;
      }
      if (!this.ruleObj.data.type) {
        this.$message({ message: "请选择替换选项", type: "warning" });
        return null;
      }
      this.ruleObj.message = `替换:将${this.ruleObj.data.source}替换为${this.ruleObj.data.target};`
        + this.radioList.filter(item => item.code === this.ruleObj.data.type)[0].label;
      return this.ruleObj;
    }
  }
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
