<template>
  <div>
    <div style="text-align: right">
      <el-button type="primary" @click="showEditAddModal = true">新增模板</el-button>
    </div>
    <el-table :data="applicationRuleList" style="width: 100%">
      <el-table-column prop="createdDate" label="创建时间" width="130" :formatter="formatDateTime" />
      <el-table-column prop="updatedDate" label="更新时间" width="130" :formatter="formatDateTime" />
      <el-table-column prop="name" label="名称" width="180" />
      <el-table-column prop="comment" label="备注" />
      <el-table-column label="操作" width="250">
        <template #default="scope">
          <el-button text type="primary" style="margin-left: 0" size="small" @click="ruleTemplateAction('chose', scope.row)">选择</el-button>
          <el-button text type="primary" style="margin-left: 0" size="small" @click="ruleTemplateAction('edit', scope.row)">编辑</el-button>
          <el-button text type="warning" style="margin-left: 0" size="small" @click="ruleTemplateAction('delete', scope.row)">删除</el-button>
          <el-button v-if="defaultTemplateId != scope.row.id" text type="primary" size="small" @click="ruleTemplateAction('default', scope.row)"
            >设为默认</el-button
          >
        </template>
      </el-table-column>
    </el-table>
  </div>
  <el-dialog :title="curEdit != null ? '修改' : '新增模板'" v-model="showEditAddModal" width="40em" @close="closeAddEdit" append-to-body>
    <el-form-item label="名称">
      <el-input v-model="templateForm.name"></el-input>
    </el-form-item>
    <el-form-item label="描述">
      <el-input v-model="templateForm.comment"></el-input>
    </el-form-item>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="saveTemplateDilalogShow = false">取消</el-button>
        <el-button type="primary" @click="templateSubmit">提交</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import HttpUtil from "../../../utils/HttpUtil";
import dayjs from "dayjs";
export default {
  name: "ApplicationRuleList",
  props: ["curId"],
  emits: ["templateUpdate"],
  data() {
    return {
      applicationRuleList: [],
      curEdit: null,
      defaultTemplateId: null,
      showEditAddModal: false,
      templateForm: {
        name: "",
        comment: "",
      },
    };
  },
  async created() {
    await this.init();
  },
  methods: {
    async init() {
      this.defaultTemplateId = parseInt(await HttpUtil.get("/config/code?code=defaultTempleteId"));
      this.applicationRuleList = await HttpUtil.get("/applicationRule");
    },
    formatDateTime(row, column, value) {
      return dayjs(value).format("YYYY-MM-DD");
    },
    //操作
    async ruleTemplateAction(action, rowData) {
      if (action === "chose") {
        await this.$emit("templateUpdate", rowData);
      } else if (action === "default") {
        let body = { code: "defaultTempleteId", val: rowData.id.toString() };
        await HttpUtil.post("/config/update", null, body);
        this.defaultTemplateId = rowData.id;
      } else if (action === "edit") {
        this.curEdit = rowData;
        this.templateForm.name = rowData.name;
        this.templateForm.comment = rowData.comment;
        this.showEditAddModal = true;
      } else {
        if (this.curId == rowData.id) {
          this.$message({ message: "当前模板使用中，无法删除", type: "warning" });
          return;
        }
        await HttpUtil.delete("/applicationRule/" + rowData.id);
        await this.init();
      }
    },
    //表单提交
    async templateSubmit() {
      let body;
      if (this.curEdit) {
        body = JSON.parse(JSON.stringify(this.curEdit));
        body.name = this.templateForm.name;
        body.comment = this.templateForm.comment;
      } else {
        body = this.templateForm;
        body.content = "[]";
      }
      await HttpUtil.post("/applicationRule", null, body);
      await this.init();
      this.closeAddEdit();
      this.$message.success("操作成功");
    },
    closeAddEdit() {
      this.curEdit = null;
      this.showEditAddModal = false;
      this.templateForm = { name: "", templte: "" };
    },
  },
};
</script>

<style></style>
