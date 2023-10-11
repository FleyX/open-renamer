<template>
  <div>配置qb</div>
  <el-form :model="data.qbConfig" label-width="8em">
    <el-form-item label="qb版本">
      {{ data.qbConfig.version ? data.qbConfig.version : "配置错误，无法访问" }}
    </el-form-item>
    <el-form-item label="访问地址">
      <el-input type="text" v-model="data.qbConfig.address" placeholder="qb访问地址"/>
    </el-form-item>
    <el-form-item label="用户名">
      <el-input type="text" v-model="data.qbConfig.username" placeholder="qb访问用户名"/>
    </el-form-item>
    <el-form-item label="密码">
      <el-input type="password" v-model="data.qbConfig.password" placeholder="qb访问密码"/>
    </el-form-item>
    <el-form-item label="qb下载路径">
      <el-input type="text" v-model="data.qbConfig.qbDownloadPath" placeholder="qb下载路径(qb中选择的下载路径)"/>
    </el-form-item>
    <el-form-item label="对应本系统路径">
      <el-input type="text" v-model="data.qbConfig.renameQbDownloadPath" placeholder="qb下载路径对应到本软件中的路径"/>
    </el-form-item>
    <div style="text-align: center">
      <el-button type="" @click="editInfo = false">取消</el-button>
      <el-button type="primary" @click="submitQb">提交</el-button>
    </div>
  </el-form>
</template>

<script setup>
import {ref, reactive, onMounted, computed} from "vue";
import http from "@/utils/HttpUtil";
//表单
const data = reactive({
  qbConfig: {},
});
//qb是否可访问
let editInfo = ref(false);

onMounted(async () => {
  data.qbConfig = await http.get("/qb/config");
});

async function submitQb() {
  data.qbConfig = await http.post("/qb/saveQbInfo", null, data.qbConfig);
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