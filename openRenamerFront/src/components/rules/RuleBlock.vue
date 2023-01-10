<template>
  <div class="main">
    <div class="menu">
      <el-button v-if="rules == undefined" type="warning" size="small" @click="block">禁用/启用</el-button>
      <el-button type="danger" size="small" @click="deleteRule">删除</el-button>
      <template v-if="rules == undefined">
        <el-button type="primary" size="small" @click="templateSubmit">保存</el-button>
        <el-button type="primary" size="small" @click="ruleTemplateShow = true">选择模板</el-button>
      </template>
      <template v-if="checkedRules.length == 1">
        <el-button type="primary" size="small" @click="editClick">
          <el-tooltip effect="dark" content="编辑规则" placement="top">
            <el-icon>
              <edit />
            </el-icon>
          </el-tooltip>
        </el-button>
        <el-button type="primary" size="small" @click="move('top')">
          <el-tooltip effect="dark" content="上移规则" placement="top">
            <el-icon>
              <top />
            </el-icon>
          </el-tooltip>
        </el-button>
        <el-button type="primary" size="small" @click="move('bottom')">
          <el-tooltip effect="dark" content="下移规则" placement="top"><el-icon>
              <bottom />
            </el-icon></el-tooltip>
        </el-button>
      </template>
    </div>
    <div class="ruleBlock">
      <el-checkbox v-model="item.checked" v-for="(item, index) in ruleList" :key="index" @dblclick="editClick(item)">
        <s v-if="item.blocked">{{ item.message }}</s>
        <span v-else>{{ item.message }}</span>
      </el-checkbox>
      <div style="padding-top: 0.5em">
        <el-button type="primary" size="small" text @click="addRuleDialogShow = true">+ 新增规则</el-button>
      </div>
    </div>
    <el-dialog title="新增规则" v-model="addRuleDialogShow" width="70%" @close="ruleDialogClose">
      <rule :editRule="editRule" @ruleAdd="ruleAdd" v-if="addRuleDialogShow" />
    </el-dialog>
    <el-dialog title="模板管理" v-model="ruleTemplateShow" width="70%">
      <application-rule-list v-if="ruleTemplateShow" :curId="chosedTemplate.id" @templateUpdate="templateUpdate" />
    </el-dialog>
  </div>
</template>

<script>
import Rule from "@/components/Rule";
import ApplicationRuleList from "./ApplicationRuleList";
import HttpUtil from "@/utils/HttpUtil";
import { Top, Bottom, Edit } from "@element-plus/icons-vue";
export default {
  name: "RuleBlock",
  props: ["rules"],
  components: {
    Rule,
    ApplicationRuleList,
    Edit,
    Top,
    Bottom,
  },
  data () {
    return {
      addRuleDialogShow: false, //是否显示新增规则弹窗
      ruleTemplateShow: false, //是否显示选择规则模板弹窗
      ruleList: [],
      editRule: null, //当前编辑的规则
      chosedTemplate: null,
    };
  },
  computed: {
    //选中的规则
    checkedRules () {
      return this.ruleList.filter((item) => item.checked);
    },
  },
  async created () {
    //如果外部传入了规则
    if (this.rules != undefined) {
      this.ruleList = JSON.parse(JSON.stringify(this.rules));
    } else {
      this.chosedTemplate = await HttpUtil.get("/applicationRule/default");
      this.ruleList = JSON.parse(this.chosedTemplate.content);
      await this.ruleUpdate();
    }
  },
  methods: {
    //规则更新
    ruleUpdate () {
      let temp = this.ruleList.filter((item) => !item.blocked);
      this.$emit("ruleUpdate", temp);
    },
    //模板内容提交
    async templateSubmit () {
      this.chosedTemplate.content = JSON.stringify(this.ruleList);
      await HttpUtil.post("/applicationRule", null, this.chosedTemplate);
      this.$message.success("操作成功");
    },
    //切换模板
    async templateUpdate (newVal) {
      this.ruleList = JSON.parse(newVal.content);
      this.ruleUpdate();
      this.ruleTemplateShow = false;
    },
    //新增规则
    async ruleAdd (data) {
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
    async block () {
      this.ruleList
        .filter((item) => item.checked)
        .forEach((item) => {
          item.blocked = !item.blocked;
          item.checked = false;
        });
      await this.ruleUpdate();
    },
    //删除规则
    async deleteRule () {
      this.ruleList = this.ruleList.filter((item) => !item.checked);
      this.ruleUpdate();
    },
    //编辑规则
    editClick (rule) {
      this.editRule = rule && rule.data ? rule : this.checkedRules[0];
      this.addRuleDialogShow = true;
    },
    //移动规则
    async move (type) {
      let index = this.ruleList.indexOf(this.checkedRules[0]);
      let newIndex;
      if (type == "top") {
        if (index == 0) {
          return;
        }
        newIndex = index - 1;
      } else {
        if (index == this.ruleList.length - 1) {
          return;
        }
        newIndex = index + 1;
      }
      let temp = this.checkedRules[0];
      this.ruleList[index] = this.ruleList[newIndex];
      this.ruleList[newIndex] = temp;
      this.ruleList = [...this.ruleList];
      await this.ruleUpdate();
    },
    //规则弹窗关闭
    ruleDialogClose () {
      this.editRule = null;
      this.addRuleDialogShow = false;
    },
  },
};
</script>

<style lang="less" scoped>
.main {
  text-align: left;
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
