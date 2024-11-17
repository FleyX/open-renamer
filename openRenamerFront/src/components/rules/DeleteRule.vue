<template>
  <div class="flex">
    <span class="left">部分删除:</span>
    <div class="location">
      <div>
        <div>开始</div>
        <div class="line">
          <el-radio v-model="ruleObj.data.start.type" label="location" :disabled="deleteAll">位置：</el-radio>
          <el-input-number :min="1" size="small" :disabled="deleteAll" v-model="startIndex"/>
        </div>
        <div class="line">
          <el-radio v-model="ruleObj.data.start.type" label="text" :disabled="deleteAll">文本:</el-radio>
          <el-input v-model="startText" size="small" :disabled="deleteAll"/>
        </div>
        <div class="line">
          <el-radio v-model="ruleObj.data.start.type" label="reg" :disabled="deleteAll">正则:</el-radio>
          <el-input v-model="startReg" size="small" :disabled="deleteAll"/>
        </div>
      </div>
      <div style="margin-left: 4em">
        <div>结束</div>
        <div class="line">
          <el-radio v-model="ruleObj.data.end.type" label="location" :disabled="deleteAll">位置：</el-radio>
          <el-input-number size="small" :disabled="deleteAll" v-model="endIndex"/>
        </div>
        <div class="line">
          <el-radio v-model="ruleObj.data.end.type" label="text" :disabled="deleteAll">文本:</el-radio>
          <el-input v-model="endText" size="small" :disabled="deleteAll"/>
        </div>
        <div class="line">
          <el-radio v-model="ruleObj.data.end.type" label="reg" :disabled="deleteAll">正则:</el-radio>
          <el-input v-model="endReg" size="small" :disabled="deleteAll"/>
        </div>
        <div class="line">
          <el-radio v-model="ruleObj.data.end.type" label="end" :disabled="deleteAll">直到末尾</el-radio>
        </div>
      </div>
    </div>
  </div>
  <div v-if="ruleObj.data.start.type==='reg' || ruleObj.data.end.type==='reg'" class="flex">
    <div class="left">区分大小写:</div>
    <el-switch v-model="ruleObj.data.regI"/>
  </div>
  <div class="flex">
    <div class="left">全部删除:</div>
    <el-switch v-model="deleteAll" @change="allDeleteChange"/>
  </div>

  <div class="flex">
    <div class="left">忽略拓展名:</div>
    <el-switch v-model="ruleObj.data.ignorePostfix"/>
  </div>
</template>

<script>
export default {
  name: "DeleteRule",
  props: ["editRule"],
  data() {
    return {
      ruleObj: {
        type: "delete",
        message: "",
        data: {
          type: "deletePart",
          start: {
            type: "location",
            value: "",
          },
          end: {
            type: "location",
            value: "",
          },
          ignorePostfix: true,
          regI: false,//reg是否区分大小写
        },
      },
      startIndex: 1,
      endIndex: 1,
      startText: "",
      startReg: "",
      endText: "",
      endReg: "",
      deleteAll: false,
    };
  },
  created() {
    if (this.editRule) {
      this.ruleObj = JSON.parse(JSON.stringify(this.editRule));
      if (this.ruleObj.data.type === "deletePart") {
        if (this.ruleObj.data.start.type === "location") {
          this.startIndex = parseInt(this.ruleObj.data.start.value);
        } else if (this.ruleObj.data.start.type === "text") {
          this.startText = this.ruleObj.data.start.value;
        } else {
          this.startReg = this.ruleObj.data.start.value;
        }

        if (this.ruleObj.data.end.type === "location") {
          this.endIndex = parseInt(this.ruleObj.data.end.value);
        } else if (this.ruleObj.data.end.type === "text") {
          this.endText = this.ruleObj.data.end.value;
        } else {
          this.endReg = this.ruleObj.data.end.value;
        }
      } else {
        this.deleteAll = true;
      }
    }
  },
  methods: {
    exportObj() {
      if (this.ruleObj.data.type.length == 0) {
        this.$message({message: "请填写完整", type: "warning"});
        return null;
      }
      if (this.ruleObj.data.type === "deletePart") {
        if (
            ('text' === this.ruleObj.data.start.type && this.startText.length === 0) ||
            ('text' === this.ruleObj.data.end.type && this.endText.length === 0) ||
            ('reg' === this.ruleObj.data.start.type && this.startReg.length === 0) ||
            ('reg' === this.ruleObj.data.end.type && this.endReg.length === 0)
        ) {
          this.$message({
            message: "开始或者结束文本不能为空",
            type: "warning",
          });
          return null;
        }
      }
      let startType = this.ruleObj.data.start.type;
      this.ruleObj.data.start.value = startType === "location" ? this.startIndex.toString() : startType === 'text' ? this.startText : this.startReg;
      let endType = this.ruleObj.data.end.type;
      this.ruleObj.data.end.value = endType === "location" ? this.endIndex.toString() : endType === 'text' ? this.endText : this.endReg;
      let message = `删除:`;
      if (this.deleteAll) {
        message += "全部删除";
      } else {
        message += `从"${this.ruleObj.data.start.value}"到"${this.ruleObj.data.end.type === "end" ? "末尾" : this.ruleObj.data.end.value}"`;
      }
      this.ruleObj.message = message;
      return this.ruleObj;
    },
    allDeleteChange(val) {
      this.deleteAll = val;
      this.ruleObj.data.type = val ? "deleteAll" : "deletePart";
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
    display: flex;
    flex: 1;

    .line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.5em;
    }
  }
}
</style>
