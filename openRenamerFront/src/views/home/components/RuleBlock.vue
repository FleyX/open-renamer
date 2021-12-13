<template>
  <div class="main">
    <div class="menu">
      <span>应用规则</span>
      <el-button type="primary" size="mini" @click="addRuleDialogShow = true">新增</el-button>
      <el-button type="primary" size="mini" v-if="checkedRules.length == 1" @click="editClick">编辑</el-button>
      <el-button type="warning" size="mini" @click="block">禁用/启用</el-button>
      <el-button type="danger" size="mini" @click="deleteRule">删除</el-button>
      <el-button type="primary" size="mini" v-if="chosedTemplate" @click="templateSubmit">保存规则</el-button>
      <el-button type="primary" size="mini" v-if="chosedTemplate == null && ruleList.length > 0" @click="saveTemplateDilalogShow = true"
        >存为模板</el-button
      >
    </div>
    <div class="ruleBlock">
      <el-checkbox v-model="item.checked" v-for="(item, index) in ruleList" :key="index">
        <s v-if="item.blocked">{{ item.message }}</s>
        <span v-else>{{ item.message }}</span>
      </el-checkbox>
      <div v-if="ruleList.length == 0 && chosedTemplate == null" class="choseTemplate">
        <el-button type="primary" size="mini" @click="ruleTemplateShow = true">选择模板</el-button>
      </div>
    </div>
    <!-- 弹窗 -->
    <el-dialog title="新增规则" v-model="addRuleDialogShow" width="70%">
      <rule :editRule="editRule" @ruleAdd="ruleAdd" v-if="addRuleDialogShow" />
    </el-dialog>
    <el-dialog title="选择规则模板" v-model="ruleTemplateShow" width="70%">
      <application-rule-list v-if="ruleTemplateShow" v-model="chosedTemplate" @close="ruleTemplateShow = false" />
    </el-dialog>
    <el-dialog title="保存模板" v-model="saveTemplateDilalogShow" width="70%">
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
  </div>
</template>

<script>
import Rule from "../../../components/Rule";
import ApplicationRuleList from "./ApplicationRuleList";
import HttpUtil from "../../../utils/HttpUtil";
export default {
  name: "RuleBlock",
  components: {
    Rule,
    ApplicationRuleList,
  },
  data() {
    return {
      addRuleDialogShow: false, //是否显示新增规则弹窗
      ruleTemplateShow: false, //是否显示选择规则模板弹窗
      saveTemplateDilalogShow: false, //是否显示保存模板弹窗
      ruleList: [],
      editRule: null, //当前编辑的规则
      chosedTemplate: null,
      templateForm: {
        name: "",
        comment: "",
      },
    };
  },
  computed: {
    //选中的规则
    checkedRules() {
      return this.ruleList.filter((item) => item.checked);
    },
  },
  watch: {
    chosedTemplate(newVal, oldVal) {
      this.ruleList = JSON.parse(newVal.content);
      this.ruleUpdate();
    },
  },
  methods: {
    //规则更新
    ruleUpdate() {
      this.$emit(
        "ruleUpdate",
        this.ruleList.filter((item) => !item.blocked)
      );
    },
    //保存还是更新模板
    saveOrUpdateTemplate() {
      if (this.chosedTemplate != null) {
        this.templateSubmit();
      } else {
        this.saveTemplateDilalogShow = true;
      }
    },
    //模板内容提交
    async templateSubmit() {
      let body;
      if (this.chosedTemplate) {
        this.chosedTemplate.content = JSON.stringify(this.ruleList);
        body = this.chosedTemplate;
      } else {
        body = {
          name: this.templateForm.name,
          comment: this.templateForm.comment,
          content: JSON.stringify(this.ruleList),
        };
      }
      this.chosedTemplate = await HttpUtil.post("/applicationRule", null, body);
      this.saveTemplateDilalogShow = false;
      this.$message.success("操作成功");
    },
    //新增规则
    async ruleAdd(data) {
      if (this.editRule != null) {
        let index = this.ruleList.indexOf(this.editRule);
        this.ruleList.splice(index, 1, data);
        this.editRule = null;
      } else {
        this.ruleList.push(data);
      }
      data.checked = false;
      this.ruleUpdate();
      this.addRuleDialogShow = false;
    },
    //禁用/启用
    async block() {
      this.ruleList
        .filter((item) => item.checked)
        .forEach((item) => {
          item.blocked = !item.blocked;
          item.checked = false;
        });
      this.ruleUpdate();
    },
    //删除规则
    async deleteRule() {
      this.ruleList = this.ruleList.filter((item) => !item.checked);
      this.ruleUpdate();
    },
    //编辑规则
    editClick() {
      this.editRule = this.checkedRules[0];
      this.addRuleDialogShow = true;
    },
  },
};
</script>

<style lang="less" scoped>
.main {
  text-align: left;
  border: 1px solid black;
  padding: 5px;
  .menu {
    display: flex;
    justify-content: left;
    align-items: center;
  }
  .ruleBlock {
    text-align: left;
    display: flex;
    flex-direction: column;
    align-items: baseline;
  }
  .choseTemplate {
    text-align: center;
    padding-top: 2em;
    padding-bottom: 2em;
  }
}
</style>
