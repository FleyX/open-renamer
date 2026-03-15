<template>
  <div class="app">
    <el-input v-model="token" :placeholder="$t('login.tokenPlaceholder')" style="width: 40em; margin-bottom: 1em" />
    <el-button type="primary" @click="checkToken">{{ $t('login.confirmButton') }}</el-button>
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
        this.$message.error(this.$t('login.tokenError'));
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
