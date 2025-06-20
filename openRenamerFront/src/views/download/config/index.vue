<template>
  <el-form :model="data.qbConfig" label-width="10em">
    <el-form-item :label="t('qbConfig.version')">
      {{ data.qbConfig.version ? data.qbConfig.version : $t("qbConfig.error") }}
    </el-form-item>
    <el-form-item :label="t('qbConfig.address')">
      <el-input :disabled="data.disabled" type="text" v-model="data.qbConfig.address"
                :placeholder="t('qbConfig.addressAlt')" />
    </el-form-item>
    <el-form-item :label="t('qbConfig.username')">
      <el-input :disabled="data.disabled" type="text" v-model="data.qbConfig.username"
                :placeholder="t('qbConfig.usernameAlt')" />
    </el-form-item>
    <el-form-item :label="t('qbConfig.password')">
      <el-input :disabled="data.disabled" type="password" v-model="data.qbConfig.password"
                :placeholder="t('qbConfig.passwordAlt')" />
    </el-form-item>
    <el-form-item :label="t('qbConfig.downloadPath')">
      <el-input :disabled="data.disabled" type="text" v-model="data.qbConfig.qbDownloadPath"
                :placeholder="t('qbConfig.downloadPathAlt')" />
    </el-form-item>
    <el-form-item :label="t('qbConfig.localPath')">
      <el-input :disabled="data.disabled" type="text" v-model="data.qbConfig.renameQbDownloadPath"
                :placeholder="t('qbConfig.localPathAlt')" />
    </el-form-item>
    <div style="text-align: center">
      <template v-if="!data.disabled">
        <el-button type="warning" @click="data.disabled= true">{{ $t("action.cancel") }}</el-button>
        <el-button type="primary" @click="submitQb">{{ $t("action.submit") }}</el-button>
      </template>
      <el-button type="primary" @click="data.disabled= false" v-else>{{ $t("action.edit") }}</el-button>
    </div>
  </el-form>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { ElMessage } from "element-plus";
import http from "@/utils/HttpUtil";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

//表单
const data = reactive({
  qbConfig: {},
  disabled: true

});

onMounted(async () => {
  data.qbConfig = await http.get("/qb/config");
});

async function submitQb() {
  data.qbConfig = await http.post("/qb/saveQbInfo", null, data.qbConfig);
  ElMessage({ message: t("action.success"), type: "success" });

}
</script>

<style lang="less" scoped>
.item {
  display: flex;
  text-align: left;
  padding-bottom: 0.5em;

  .left {
    width: 6em;
    font-weight: 600;
  }

  .right {
    flex: 1;
  }
}
</style>