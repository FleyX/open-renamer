<template>
  <div class="main">
    <el-menu class="rule-menu" mode="vertical" :default-active="currentIndex" @select="menuChange">
      <el-menu-item :disabled="editRule != null" index="insert">{{ $t('rule.insert') }}</el-menu-item>
      <el-menu-item :disabled="editRule != null" index="delete">{{ $t('rule.delete') }}</el-menu-item>
      <el-menu-item :disabled="editRule != null" index="replace">{{ $t('rule.replace') }}</el-menu-item>
      <el-menu-item :disabled="editRule != null || isAutoPlan" index="serialization">{{ $t('rule.serialization') }}</el-menu-item>
      <el-menu-item :disabled="editRule != null" index="auto">{{ $t('rule.autoIdentify') }}</el-menu-item>
      <el-menu-item :disabled="editRule != null" index="translate">{{ $t('rule.translate') }}</el-menu-item>
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
    <el-button type="primary" @click="submit">{{ $t('rule.confirm') }}</el-button>
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
      options: [{label: this.$t('rule.insert'), value: "insert"}],
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

  .rule-menu {
    width: 8em;
  }

  .rule {
    padding: 5px;
    flex: 1;
    overflow: auto;
  }
}

@media (max-width: 768px) {
  .main {
    flex-direction: column;
    height: auto;
    max-height: 70vh;

    .rule-menu {
      width: 100%;
      display: flex;
      flex-direction: row;
      overflow-x: auto;

      :deep(.el-menu-item) {
        height: 40px;
        line-height: 40px;
        padding: 0 10px;
      }
    }

    .rule {
      padding: 5px;
    }
  }
}
</style>
