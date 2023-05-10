<template>
  <div class="flex">
    <span class="left">源：</span>
    <el-input style="width:20em" v-model="ruleObj.data.source"/>
  </div>
  <div class="flex">
    <span class="left">目标：</span>
    <el-input style="width:20em" v-model="ruleObj.data.target"/>
  </div>
  <div class="flex">
    <span class="left">替换选项：</span>
    <div class="location">
      <el-radio v-for="item in radioList" :key="item.code" v-model="ruleObj.data.type" :label="item.code"
      >{{ item.label }}
      </el-radio>

    </div>
  </div>
</template>

<script>

export default {
  name: "ReplaceRule",
  props: ["editRule"],
  data() {
    return {
      radioList: [
        {
          label: "替换第一个",
          code: 1,
        },
        {
          label: "替换最后一个",
          code: 2,
        },
        {
          label: "全部替换",
          code: 3,
        },
      ],
      ruleObj: {
        type: "replace",
        message: "",
        data: {
          source: "",
          target: "",
          type: 1, //1:替换第一个，2：替换最后一个，3：全部替换
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
      if (!this.ruleObj.data.source) {
        this.$message({message: "源不能为空", type: "warning"});
        return null;
      }
      if (!this.ruleObj.data.type) {
        this.$message({message: "请选择替换选项", type: "warning"});
        return null;
      }
      this.ruleObj.message = `替换:将${this.ruleObj.data.source}替换为${this.ruleObj.data.target};`
          + this.radioList.filter(item => item.code === this.ruleObj.data.type)[0].label;
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
