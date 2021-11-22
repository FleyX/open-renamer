<template>
  <div>
    <el-table :data="applicationRuleList" style="width: 100%">
      <el-table-column prop="createdDate" label="创建时间" width="180" />
      <el-table-column prop="name" label="名称" width="180" />
      <el-table-column prop="comment" label="备注" />
    </el-table>
  </div>
</template>

<script>
import HttpUtil from "../../../utils/HttpUtil";
export default {
  name: "ApplicationRuleList",
  data() {
    return {
      applicationRuleList: [],
    };
  },
  async mounted() {
    this.applicationRuleList = await HttpUtil.get("/applicationRule");
  },
};
</script>

<style>
</style>