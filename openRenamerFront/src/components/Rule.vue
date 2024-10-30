<template>
  <div class="main">
    <el-menu style="width: 8em" mode="vertical" :default-active="currentIndex" @select="menuChange">
      <el-menu-item :disabled="editRule != null" index="insert">插入</el-menu-item>
      <el-menu-item :disabled="editRule != null" index="delete">删除</el-menu-item>
      <el-menu-item :disabled="editRule != null" index="replace">替换</el-menu-item>
      <el-menu-item :disabled="editRule != null || isAutoPlan" index="serialization">序列化</el-menu-item>
      <el-menu-item :disabled="editRule != null" index="auto">自动识别</el-menu-item>
      <el-menu-item :disabled="editRule != null" index="translate">简繁转换</el-menu-item>
    </el-menu>
    <div class="rule">
      <insert-rule ref="rule" :editRule="editRule" v-if="currentIndex === 'insert'"/>
      <delete-rule ref="rule" :editRule="editRule" v-else-if="currentIndex === 'delete'"/>
      <replace-rule ref="rule" :editRule="editRule" v-else-if="currentIndex === 'replace'"/>
      <serialization-rule ref="rule" :editRule="editRule" v-else-if="currentIndex === 'serialization'"/>
      <auto-rule ref="rule" :editRule="editRule" v-else-if="currentIndex === 'auto'"/>
      <translate-rule ref="rule" :editRule="editRule" v-else-if="currentIndex === 'translate'"/>
    </div>
  </div>
  <div style="text-align: center">
    <el-button type="primary" @click="submit">确定</el-button>
  </div>
</template>

<script>
import InsertRule from "./rules/InsertRule.vue";
import DeleteRule from "./rules/DeleteRule.vue";
import SerializationRule from "./rules/SerializationRule.vue";
import AutoRule from "./rules/AutoRule";
import ReplaceRule from "@/components/rules/ReplaceRule";
import TranslateRule from '@/components/rules/TranslateRule.vue';

export default {
  components: {InsertRule, DeleteRule, SerializationRule, AutoRule, ReplaceRule, TranslateRule},
  props: ["editRule", "isAutoPlan"],
  emits: ["ruleAdd"],
  name: "Rule",
  data() {
    return {
      currentIndex: "insert",
      options: [{label: "插入", value: "insert"}],
    };
  },
  created() {
    if (this.editRule) {
      this.currentIndex = this.editRule.type;
    }
  },
  methods: {
    menuChange(index) {
      this.currentIndex = index;
    },
    submit() {
      let data = this.$refs["rule"].exportObj();
      if (data != null) {
        this.$emit("ruleAdd", data);
      }
    },
  },
};
</script>

<style lang="less" scoped>
.main {
  display: flex;
  height: 65vh;
  text-align: left;

  .rule {
    padding: 5px;
    flex: 1;
  }
}
</style>
