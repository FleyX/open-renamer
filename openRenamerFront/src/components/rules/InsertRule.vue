<template>
  <div class="flex">
    <span class="left">{{ $t('insertRule.insert') }}</span>
    <el-input style="flex: 1" v-model="ruleObj.data.insertContent" />
  </div>
  <div class="flex">
    <span class="left">{{ $t('insertRule.position') }}</span>
    <div class="location">
      <el-radio style="margin-top: 1em" v-model="ruleObj.data.type" label="front">{{ $t('insertRule.prefix') }}</el-radio>
      <el-radio style="margin-top: 1em" v-model="ruleObj.data.type" label="backend">{{ $t('insertRule.suffix') }}</el-radio>
      <el-radio style="margin-top: 1em" v-model="ruleObj.data.type" label="at"
        >{{ $t('insertRule.positionLabel') }}<el-input-number size="small" v-model="ruleObj.data.atInput" />
        &nbsp;&nbsp;
        <el-switch v-model="ruleObj.data.atIsRightToleft" :min="1" :active-text="$t('insertRule.fromRightToLeft')" :inactive-text="$t('insertRule.fromLeftToRight')" />
      </el-radio>
      <el-radio style="margin-top: 1em" v-model="ruleObj.data.type" label="replace">{{ $t('insertRule.replaceCurrentFileName') }}</el-radio>
    </div>
  </div>
  <div class="flex">
    <div class="left">{{ $t('insertRule.ignoreExtension') }}</div>
    <el-switch v-model="ruleObj.data.ignorePostfix" />
  </div>
  <div class="flex">
    <div class="left">{{ $t('insertRule.seasonIdentification') }}</div>
    <el-switch v-model="ruleObj.data.autoSeason" />
    <el-tooltip effect="dark" :content="message1" placement="top">
      <el-icon><InfoFilled /></el-icon>
    </el-tooltip>
  </div>
  <div class="flex">
    <div class="left">{{ $t('insertRule.validSuffix') }}</div>
    <el-switch v-model="ruleObj.data.endFilter" />
    <template v-if="ruleObj.data.endFilter">
      <el-tag v-for="item in ruleObj.data.validEnd" closable :key="item" @close="deleteEnd(item)" text>{{ item }}</el-tag>
      <el-input v-if="validEndInputShow" v-model="validEndInput" style="width: 5em" size="small" @keyup.enter="validEndAdd" @blur="validEndAdd" />
      <el-button v-else class="button-new-tag ml-1" size="small" @click="validEndInputShow = true">+ {{ $t('insertRule.add') }}</el-button>
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
      message1: this.$t('insertRule.seasonIdentificationTip'),
      message2: this.$t('insertRule.validSuffixTip'),
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
        this.$message({ message: this.$t('insertRule.pleaseFillComplete'), type: "warning" });
        return null;
      }
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
