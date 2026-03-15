<template>
  <div class="flex">
    <span class="left">{{ $t('replaceRule.source') }}</span>
    <el-input style="width:20em" v-model="ruleObj.data.source" />
  </div>
  <div class="flex">
    <span class="left">{{ $t('replaceRule.target') }}</span>
    <el-input style="width:20em" v-model="ruleObj.data.target" />
  </div>
  <div class="flex">
    <div class="left">{{ $t('replaceRule.regexMode') }}</div>
    <el-switch v-model="ruleObj.data.regFlag" />
    <el-tooltip effect="dark" :content="regTip" placement="right">
      <el-icon>
        <InfoFilled />
      </el-icon>
    </el-tooltip>
  </div>
  <div class="flex">
    <div class="left">{{ $t('replaceRule.caseSensitive') }}</div>
    <el-switch v-model="ruleObj.data.regI" />
  </div>
  <div class="flex">
    <span class="left">{{ $t('replaceRule.replaceOption') }}</span>
    <div class="location">
      <el-radio v-for="item in radioList" :key="item.code" v-model="ruleObj.data.type" :label="item.code"
      >{{ item.label }}
      </el-radio>
    </div>
  </div>
  <div class="flex">
    <div class="left">{{ $t('replaceRule.ignoreExtension') }}</div>
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
      regTip: this.$t('replaceRule.regexTip'),
      radioList: [
        {
          label: this.$t('replaceRule.replaceFirst'),
          code: 1
        },
        {
          label: this.$t('replaceRule.replaceLast'),
          code: 2
        },
        {
          label: this.$t('replaceRule.replaceAll'),
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
        this.$message({ message: this.$t('replaceRule.sourceCannotBeEmpty'), type: "warning" });
        return null;
      }
      if (!this.ruleObj.data.type) {
        this.$message({ message: this.$t('replaceRule.pleaseSelectReplaceOption'), type: "warning" });
        return null;
      }
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
