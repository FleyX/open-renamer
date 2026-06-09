<template>
  <div class="flex">
    <span class="left">{{ $t('autoRule.recognitionType') }}</span>
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
    <div class="left">{{ $t('autoRule.episodeWidth') }}</div>
    <el-input-number :min="1" v-model="ruleObj.data.eNumWidth" />
  </div>
  <div class="flex">
    <div class="left">{{ $t('autoRule.frontAdd') }}</div>
    <el-input v-model="ruleObj.data.frontAdd" :placeholder="$t('autoRule.frontAddPlaceholder')" style="width: 20em" />
  </div>
  <div class="flex">
    <div class="left">{{ $t('autoRule.endAdd') }}</div>
    <el-input v-model="ruleObj.data.endAdd" :placeholder="$t('autoRule.endAddPlaceholder')" style="width: 20em" />
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
          label: this.$t('autoRule.seasonRecognition'),
          message: this.$t('autoRule.seasonRecognitionTip'),
          code: "season",
        },
        {
          label: this.$t('autoRule.episodeRecognition'),
          message: this.$t('autoRule.episodeRecognitionTip'),
          code: "eNum",
        },
        {
          label: this.$t('autoRule.titleRecognition'),
          message: this.$t('autoRule.titleRecognitionTip'),
          code: "name",
        },
        {
          label: this.$t('autoRule.resolutionRecognition'),
          message: this.$t('autoRule.resolutionRecognitionTip'),
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
          eNumWidth: 3,
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
        this.$message({ message: this.$t('autoRule.pleaseSelectRecognitionType'), type: "warning" });
        return null;
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
