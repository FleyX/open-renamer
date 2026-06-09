<template>
  <div class="main">
    <div class="menu">
      <el-button v-if="rules == undefined" type="warning" size="small" @click="block">{{ $t('ruleBlock.disableEnable') }}</el-button>
      <el-button type="danger" size="small" @click="deleteRule">{{ $t('ruleBlock.delete') }}</el-button>
      <template v-if="rules == undefined">
        <el-button type="primary" size="small" @click="templateSubmit">{{ $t('ruleBlock.save') }}</el-button>
        <el-button type="primary" size="small" @click="ruleTemplateShow = true">{{ $t('ruleBlock.selectTemplate') }}</el-button>
      </template>
      <template v-if="checkedRules.length == 1">
        <el-button type="primary" size="small" @click="editClick">
          <el-tooltip effect="dark" :content="$t('ruleBlock.editRule')" placement="top">
            <el-icon>
              <edit/>
            </el-icon>
          </el-tooltip>
        </el-button>
        <el-button type="primary" size="small" @click="move('top')">
          <el-tooltip effect="dark" :content="$t('ruleBlock.moveUpRule')" placement="top">
            <el-icon>
              <top/>
            </el-icon>
          </el-tooltip>
        </el-button>
        <el-button type="primary" size="small" @click="move('bottom')">
          <el-tooltip effect="dark" :content="$t('ruleBlock.moveDownRule')" placement="top"
          >
            <el-icon>
              <bottom/>
            </el-icon
            >
          </el-tooltip>
        </el-button>
      </template>
    </div>
    <div class="ruleBlock">
      <el-checkbox v-model="item.checked" v-for="(item, index) in ruleList" :key="index" @dblclick="editClick(item)">
        <s v-if="item.blocked">{{ getRuleMessage(item) }}</s>
        <span v-else>{{ getRuleMessage(item) }}</span>
      </el-checkbox>
      <div style="padding-top: 0.5em">
        <el-button type="primary" size="small" text @click="addRuleDialogShow = true">+ {{ $t('ruleBlock.addRule') }}</el-button>
      </div>
    </div>
    <el-dialog :title="editRule ? $t('ruleBlock.editRuleTitle') : $t('ruleBlock.addRuleTitle')" v-model="addRuleDialogShow" :width="dialogWidth"
               @close="ruleDialogClose">
      <rule :editRule="editRule" @ruleAdd="ruleAdd" v-if="addRuleDialogShow" :isAutoPlan="rules != undefined"/>
    </el-dialog>
    <el-dialog :title="$t('ruleBlock.templateManagement')" v-model="ruleTemplateShow" :width="dialogWidth">
      <application-rule-list v-if="ruleTemplateShow" :curId="chosedTemplate.id" @templateUpdate="templateUpdate"/>
    </el-dialog>
  </div>
</template>

<script>
import Rule from "@/components/Rule";
import ApplicationRuleList from "./ApplicationRuleList";
import HttpUtil from "@/utils/HttpUtil";
import {Top, Bottom, Edit} from "@element-plus/icons-vue";

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
  data() {
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
    checkedRules() {
      return this.ruleList.filter((item) => item.checked);
    },
    dialogWidth() {
      return window.innerWidth <= 768 ? '100%' : '70%';
    }
  },
  async created() {
    //如果外部传入了规则
    if (this.rules !== undefined) {
      this.ruleList = JSON.parse(JSON.stringify(this.rules));
    } else {
      this.chosedTemplate = await HttpUtil.get("/applicationRule/default");
      this.ruleList = JSON.parse(this.chosedTemplate.content);
      await this.ruleUpdate(false);
    }
  },
  watch: {
    rules: function (newVal, oldVal) {
      console.log("rules变化", newVal);
      this.ruleList = JSON.parse(JSON.stringify(newVal));
    },
  },
  methods: {
    //获取规则的国际化消息
    getRuleMessage(rule) {
      const { type, data } = rule;
      
      switch (type) {
        case 'insert':
          return this.$t('insertRule.insertMessage', { content: data.insertContent });
        
        case 'delete':
          if (data.type === 'deleteAll') {
            return `${this.$t('deleteRule.delete')}:${this.$t('deleteRule.deleteAllText')}`;
          } else {
            const endValue = data.end.type === 'end' ? this.$t('deleteRule.toEnd') : data.end.value;
            return `${this.$t('deleteRule.delete')}:${this.$t('deleteRule.deleteFromTo', { start: data.start.value, end: endValue })}`;
          }
        
        case 'replace':
          const option = data.type === 1 ? this.$t('replaceRule.replaceFirst') : 
                        data.type === 2 ? this.$t('replaceRule.replaceLast') : 
                        this.$t('replaceRule.replaceAll');
          return this.$t('replaceRule.replaceText', { 
            source: data.source, 
            target: data.target, 
            option: option 
          });
        
        case 'serialization':
          return this.$t('serializationRule.serializationMessage', { 
            start: data.start, 
            increment: data.increment 
          });
        
        case 'auto':
          let typeLabel = '';
          switch (data.type) {
            case 'season':
              typeLabel = this.$t('autoRule.seasonRecognition');
              break;
            case 'eNum':
              typeLabel = this.$t('autoRule.episodeRecognition');
              break;
            case 'name':
              typeLabel = this.$t('autoRule.titleRecognition');
              break;
            case 'resolution':
              typeLabel = this.$t('autoRule.resolutionRecognition');
              break;
          }
          let message = this.$t('autoRule.autoIdentifyMessage', { type: typeLabel });
          if (data.type === 'eNum') {
            message += this.$t('autoRule.episodeWidthLabel') + data.eNumWidth + ';';
          }
          if (data.frontAdd) {
            message += this.$t('autoRule.frontAddLabel') + data.frontAdd;
          }
          if (data.endAdd) {
            message += this.$t('autoRule.endAddLabel') + data.endAdd;
          }
          return message;
        
        case 'translate':
          const translateType = data.type === 1 ? this.$t('translateRule.simplifiedToTraditional') : 
                               this.$t('translateRule.traditionalToSimplified');
          let traditionalTypeText = '';
          switch (data.traditionalType) {
            case 0:
              traditionalTypeText = this.$t('translateRule.traditionalChinese');
              break;
            case 1:
              traditionalTypeText = this.$t('translateRule.hongKongTraditional');
              break;
            case 2:
              traditionalTypeText = this.$t('translateRule.taiwanTraditional');
              break;
          }
          return `${this.$t('translateRule.translate')}:"${translateType}",${this.$t('translateRule.traditionalTypeLabel')}${traditionalTypeText}`;
        
        default:
          return rule.message;
      }
    },
    
    //规则更新
    ruleUpdate(preview) {
      if (preview !== undefined && preview === false) {
        preview = false;
      } else {
        preview = true;
      }
      let temp = this.ruleList.filter((item) => !item.blocked);
      this.$emit("ruleUpdate", temp, preview);
    },
    //模板内容提交
    async templateSubmit() {
      this.chosedTemplate.content = JSON.stringify(this.ruleList);
      await HttpUtil.post("/applicationRule", null, this.chosedTemplate);
      this.$message.success(this.$t('action.success'));
    },
    //切换模板
    async templateUpdate(newVal) {
      console.debug("新的模板:", newVal);
      this.ruleList = JSON.parse(newVal.content);
      this.chosedTemplate = newVal;
      this.ruleUpdate();
      this.ruleTemplateShow = false;
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
      await this.ruleUpdate();
    },
    //删除规则
    async deleteRule() {
      this.ruleList = this.ruleList.filter((item) => !item.checked);
      this.ruleUpdate();
    },
    //编辑规则
    editClick(rule) {
      this.editRule = rule && rule.data ? rule : this.checkedRules[0];
      this.addRuleDialogShow = true;
    },
    //移动规则
    async move(type) {
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
    ruleDialogClose() {
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
    flex-wrap: wrap;
    gap: 5px;
  }

  .ruleBlock {
    text-align: left;
    display: flex;
    flex-direction: column;
    align-items: baseline;

    :deep(.el-checkbox) {
      margin-right: 1em;
      margin-bottom: 0.3em;
      align-items: flex-start;
      white-space: normal;
      height: auto;
      min-height: 1.5em;
    }
  }

  .choseTemplate {
    text-align: center;
    padding-top: 2em;
    padding-bottom: 2em;
  }
}
</style>
