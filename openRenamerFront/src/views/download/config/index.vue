<template>
  <div>配置qb</div>
  <div class="item">
    <div class="left">qb信息</div>
    <div class="right">{{ qbInfo }}</div>
  </div>
  <el-form v-if="showHostConfig" :model="qbBody" label-width="4em">
    <div v-if="qbReach" style="text-align: center">qb实例不可访问，请重新配置</div>
    <el-form-item label="qb地址"><el-input type="text" v-model="qbbody.address" placeholder="例如:http://192.168.1.4:8080" /></el-form-item>
    <el-form-item label="用户名"><el-input type="text" v-model="qbbody.username" placeholder="qb访问用户名" /></el-form-item>
    <el-form-item label="密码"><el-input type="password" v-model="qbbody.password" placeholder="qb访问密码" /></el-form-item>
    <div style="text-align: center"><el-button type="primary" @click="submitQb">提交</el-button></div>
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

const qbInfo = computed(() => {
  if (downloadConfig.qbAddress) {
    return downloadConfig.qbAddress + " 用户名：" + downloadConfig.qbUsername;
  } else {
    return "尚未配置";
  }
});
const showHostConfig = computed(() => {
  return !downloadConfig.qbAddress || !qbReach;
});

onMounted(async () => {
  downloadConfig = reactive(await http.post("/config/multCode", null, ["qbAddress", "qbUsername", "qbPassword"]));
});

async function submitQb() {
	let res = await http.post('')
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
