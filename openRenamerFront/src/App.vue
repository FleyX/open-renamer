<template>
  <div class="app">
    <el-menu :default-active="activeIndex" mode="horizontal" background-color="#545c64" text-color="#fff" active-text-color="#ffd04b" router>
      <el-menu-item index="">重命名</el-menu-item>
    </el-menu>
    <div class="content">
      <router-view />
    </div>
    <div class="footer">版本：{{ version }}&nbsp;&nbsp;开源地址:<a href="https://github.com/FleyX/open-renamer">open-renamer</a></div>
  </div>
</template>

<script>
import httpUtil from "./utils/HttpUtil";
export default {
  name: "Home",
  data() {
    return {
      version: "1.2",
      activeIndex: this.$route.hash,
    };
  },
  async created() {
    let token = localStorage.getItem("token");
    window.token = token;
    await httpUtil.get("/file/isWindows");
  },
};
</script>

<style lang="less">
html,
body {
  padding: 0;
  border: 0;
  margin: 0;
  background-color: #e8e8e5;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  width: 80%;
  min-width: 800px;
  margin: 0 auto;
  background-color: white;

  .content {
    flex: 1;
    padding: 0 10px 0 10px;
  }
}

#nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}

.head-text {
  font-size: 1.5em;
  font-weight: 600;
  padding-right: 0.5em;
}
</style>
