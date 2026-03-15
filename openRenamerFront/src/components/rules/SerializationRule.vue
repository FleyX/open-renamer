<template>
  <div class="flex">
    <span class="left">{{ $t('serializationRule.startNumber') }}</span>
    <div class="right">
      <el-input-number :min="1" size="small" v-model="ruleObj.data.start"/>
    </div>
  </div>
  <div class="flex">
    <span class="left">{{ $t('serializationRule.increment') }}</span>
    <div class="right">
      <el-input-number :min="1" size="small" v-model="ruleObj.data.increment"/>
    </div>
  </div>
  <div class="flex">
    <span class="left">{{ $t('serializationRule.padWithZero') }}</span>
    <div class="right">
      <el-switch v-model="ruleObj.data.addZero"/>
      <el-input-number size="small" :min="1" :disabled="!ruleObj.data.addZero" v-model="ruleObj.data.numLength"/>
    </div>
  </div>
  <div class="flex">
    <span class="left">{{ $t('serializationRule.position') }}</span>
    <div class="location">
      <el-radio style="margin-top: 1em" v-model="ruleObj.data.insertType" label="front">{{ $t('serializationRule.prefix') }}</el-radio>
      <el-radio style="margin-top: 1em" v-model="ruleObj.data.insertType" label="backend">{{ $t('serializationRule.suffix') }}</el-radio>
      <el-radio style="margin-top: 1em" v-model="ruleObj.data.insertType" label="at"
      >{{ $t('serializationRule.positionLabel') }}
        <el-input-number size="small" :min="1" :disabled="ruleObj.data.insertType !== 'at'"
                         v-model="ruleObj.data.insertValue"/>
      </el-radio>
    </div>
  </div>

  <div class="flex">
    <div class="left">{{ $t('serializationRule.ignoreExtension') }}</div>
    <el-switch v-model="ruleObj.data.ignorePostfix"/>
  </div>
  <div class="flex">
    <div class="left">{{ $t('serializationRule.extensionGroup') }}</div>
    <el-switch v-model="ruleObj.data.postfixGroup"/>
    <el-tooltip effect="dark" :content="$t('serializationRule.extensionGroupTip')" placement="right">
      <el-icon>
        <InfoFilled/>
      </el-icon>
    </el-tooltip>
  </div>
</template>

<script>
import {InfoFilled} from "@element-plus/icons-vue";

export default {
  name: "SerializationRule",
  components: {InfoFilled},
  props: ["editRule"],
  data() {
    return {
      ruleObj: {
        type: "serialization",
        message: "",
        data: {
          start: 1,
          increment: 1,
          addZero: false,
          numLength: 1,
          ignorePostfix: true,
          insertType: "front",
          insertValue: 1,
          postfixGroup: true
        },
      },
    };
  },
  created() {
    if (this.editRule) {
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
    flex-direction: column;
    display: flex;
  }
}
</style>
