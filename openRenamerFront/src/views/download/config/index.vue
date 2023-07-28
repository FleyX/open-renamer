<template>
  <div>配置qb</div>
  <div class="item">
    <div class="left">qb信息</div>
    <div class="right">{{ qbInfo }}
      <el-button @click="editInfo = true">编辑</el-button>
    </div>
  </div>
  <el-form v-if="editInfo" :model="data.qbConfig" label-width="4em">
    <el-form-item label="qb地址">
      <el-input type="text" v-model="data.qbConfig.address" placeholder="例如:http://192.168.1.4:8080"/>
    </el-form-item>
    <el-form-item label="用户名">
      <el-input type="text" v-model="data.qbConfig.username" placeholder="qb访问用户名"/>
    </el-form-item>
    <el-form-item label="密码">
      <el-input type="password" v-model="data.qbConfig.password" placeholder="qb访问密码"/>
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
  currentQbConfig: {},
  qbConfig: {
    address: "",
    username: "",
    password: "",
  },
});
//qb是否可访问
let qbReach = ref(true);
let editInfo = ref(false);

const qbInfo = computed(() => {
  console.log("数据变了", data.qbConfig);
  if (data.currentQbConfig.address) {
    return data.qbConfig.address + " 用户名：" + data.qbConfig.username + " " + (data.currentQbConfig.valid ? "配置有效" : "配置无效");
  } else {
    return "尚未配置";
  }
});

onMounted(async () => {
  data.currentQbConfig = await http.get("/qb/config");
  data.qbConfig.address = data.currentQbConfig.address;
  data.qbConfig.username = data.currentQbConfig.username;
  data.qbConfig.password = data.currentQbConfig.password;
});

async function submitQb() {
  let res = await http.post("/qb/saveQbInfo", null, qbBody);
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
