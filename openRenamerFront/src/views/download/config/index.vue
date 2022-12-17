<template>
  <div>配置qb</div>
  <div class="item">
    <div class="left">qb信息</div>
    <div class="right">{{ qbInfo }}<el-button @click="editInfo = true">编辑</el-button></div>
  </div>
  <el-form v-if="editInfo" :model="qbBody" label-width="4em">
    <el-form-item label="qb地址"><el-input type="text" v-model="qbBody.address" placeholder="例如:http://192.168.1.4:8080" /></el-form-item>
    <el-form-item label="用户名"><el-input type="text" v-model="qbBody.username" placeholder="qb访问用户名" /></el-form-item>
    <el-form-item label="密码"><el-input type="password" v-model="qbBody.password" placeholder="qb访问密码" /></el-form-item>
    <div style="text-align: center">
      <el-button type="" @click="editInfo = false">取消</el-button>
      <el-button type="primary" @click="submitQb">提交</el-button>
    </div>
  </el-form>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import http from "@/utils/HttpUtil";
//表单
const qbBody = reactive({
  address: "",
  username: "",
  password: "",
});
//配置中心数据
let downloadConfig = reactive({});
//qb是否可访问
let qbReach = ref(true);
let editInfo = ref(false);

const qbInfo = computed(() => {
  if (downloadConfig.qbAddress) {
    return downloadConfig.qbAddress + " 用户名：" + downloadConfig.qbUsername;
  } else {
    return "尚未配置";
  }
});

onMounted(async () => {
  downloadConfig = reactive(await http.post("/config/multCode", null, ["qbAddress", "qbUsername", "qbPassword"]));
});

async function submitQb() {
  let res = await http.post("");
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
