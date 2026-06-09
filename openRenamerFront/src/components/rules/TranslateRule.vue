<template>
  <div class="flex">
    <span class="left">{{ $t('translateRule.operation') }}</span>
    <div class="location">
      <el-radio v-model="ruleObj.data.type" :label="1">{{ $t('translateRule.simplifiedToTraditional') }}</el-radio>
      <el-radio v-model="ruleObj.data.type" :label="2">{{ $t('translateRule.traditionalToSimplified') }}</el-radio>
    </div>
  </div>

  <div class="flex">
    <span class="left">{{ $t('translateRule.traditionalType') }}</span>
    <div class="location">
      <el-radio v-model="ruleObj.data.traditionalType" :label="0">{{ $t('translateRule.traditionalChinese') }}</el-radio>
      <el-radio v-model="ruleObj.data.traditionalType" :label="1">{{ $t('translateRule.hongKongTraditional') }}</el-radio>
      <el-radio v-model="ruleObj.data.traditionalType" :label="2">{{ $t('translateRule.taiwanTraditional') }}</el-radio>
    </div>
  </div>
</template>

<script>
import {InfoFilled} from "@element-plus/icons-vue";

export default {
  name: "TranslateRule",
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

@media (max-width: 768px) {
  .flex {
    flex-direction: column;
    align-items: flex-start;

    .left {
      width: auto;
      margin-bottom: 0.3em;
      font-weight: 600;
    }
  }
}
</style>
