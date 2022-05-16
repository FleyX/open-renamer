<template>
  <div class="app">
    <el-input v-model="token" placeholder="请输入密钥" style="width: 40em; margin-bottom: 1em" />
    <el-button type="primary" @click="checkToken">确认</el-button>
  </div>
</template>

<script>
import httpUtil from "../../utils/HttpUtil";
export default {
  name: "login",
  data() {
    return {
      token: "",
    };
  },
  methods: {
    async checkToken() {
      let res = await httpUtil.post("/public/checkToken", null, { token: this.token });
      if (!res) {
        this.$message.error("密钥错误");
        return;
      }
      window.token = this.token;
      localStorage.setItem("token", this.token);
      this.$router.replace("/");
    },
  },
};
</script>

<style lang="less" scoped>
.app {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
