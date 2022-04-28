<template>
  <div class="flex">
    <span class="left">起始数：</span>
    <div class="right">
      <el-input-number :min="1" size="small" v-model="ruleObj.data.start" />
    </div>
  </div>
  <div class="flex">
    <span class="left">增量：</span>
    <div class="right">
      <el-input-number :min="1" size="small" v-model="ruleObj.data.increment" />
    </div>
  </div>
  <div class="flex">
    <span class="left">填充0补足：</span>
    <div class="right">
      <el-switch v-model="ruleObj.data.addZero" />
      <el-input-number size="small" :min="1" :disabled="!ruleObj.data.addZero" v-model="ruleObj.data.numLength" />
    </div>
  </div>
  <div class="flex">
    <span class="left">位置：</span>
    <div class="location">
      <el-radio style="margin-top: 1em" v-model="ruleObj.data.insertType" label="front">前缀</el-radio>
      <el-radio style="margin-top: 1em" v-model="ruleObj.data.insertType" label="backend">后缀</el-radio>
      <el-radio style="margin-top: 1em" v-model="ruleObj.data.insertType" label="at"
        >位置:<el-input-number size="mini" :min="1" :disabled="ruleObj.data.insertType !== 'at'" v-model="ruleObj.data.insertValue" />
      </el-radio>
    </div>
  </div>

  <div class="flex">
    <div class="left">忽略拓展名:</div>
    <el-switch v-model="ruleObj.data.ignorePostfix" />
  </div>
</template>

<script>
export default {
  name: "SerializationRule",

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
      this.ruleObj.message = `序列化:从开始${this.ruleObj.data.start}，增量${this.ruleObj.data.increment}`;
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
