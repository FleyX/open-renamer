<template>
  <div>
    <el-table :data="applicationRuleList" style="width: 100%">
      <el-table-column prop="createdDate" label="创建时间" width="180" />
      <el-table-column prop="name" label="名称" width="180" />
      <el-table-column prop="comment" label="备注" />
      <el-table-column label="操作" width="150">
        <template #default="scope">
          <el-button text type="primary" size="small" @click="ruleTemplateAction('chose', scope.row)">选择</el-button>
          <el-button text type="warning" size="small" @click="ruleTemplateAction('delete', scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import HttpUtil from "../../../utils/HttpUtil";
import dayjs from "dayjs";
export default {
  name: "ApplicationRuleList",
  data() {
    return {
      applicationRuleList: [],
    };
  },
  async created() {
    this.init();
  },
  methods: {
    async init() {
      this.applicationRuleList = await HttpUtil.get("/applicationRule");
      this.applicationRuleList.forEach((item) => (item.createdDate = dayjs(item.createdDate).format("YYYY-MM-DD")));
    },
    //操作
    async ruleTemplateAction(action, rowData) {
      if (action === "chose") {
        await this.$emit("update:modelValue", rowData);
        await this.$emit("close");
      } else {
        await HttpUtil.delete("/applicationRule/" + rowData.id);
        await this.init();
      }
    },
  },
};
</script>

<style></style>
