<template>
  <div>
    <edit-form />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import editForm from "./components/editForm.vue";
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

async function submit () {
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
