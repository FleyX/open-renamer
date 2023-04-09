<template>
  <div class="app">
    <el-menu :default-active="activeIndex" mode="horizontal" background-color="#545c64" text-color="#fff"
             active-text-color="#ffd04b" router>
      <el-menu-item index="/">重命名</el-menu-item>
      <!--      <el-menu-item index="/auto">自动化</el-menu-item>-->
      <!-- <el-sub-menu index="/download">
        <template #title>bt下载</template>
        <el-menu-item index="/download/center">下载中心</el-menu-item>
        <el-menu-item index="/download/config">配置</el-menu-item>
      </el-sub-menu> -->
    </el-menu>
    <div class="content">
      <router-view/>
    </div>
    <div class="footer">版本：
      <el-tooltip effect="dark" content="点击查看更新内容" placement="top">
        <a href="https://blog.fleyx.com/blog/detail/20221130/#13" target="_blank">
          {{ version }}</a>
      </el-tooltip>
      &nbsp;&nbsp;
      <template v-if="latestVersion && latestVersion>version">
        最新版本:
        <el-tooltip effect="dark" content="点击查看更新文档" placement="top">
          <a href="https://blog.fleyx.com/blog/detail/20221130/#%e5%8d%87%e7%ba%a7" target="_blank">
            {{ latestVersion }}</a>
        </el-tooltip>
        &nbsp;&nbsp;
      </template>
      开源地址:<a href="https://github.com/FleyX/open-renamer">open-renamer</a>
      &nbsp;&nbsp;<a href="https://github.com/FleyX/open-renamer/issues">反馈</a>
    </div>
  </div>
</template>

<script>
import httpUtil from "./utils/HttpUtil";

export default {
  name: "Home",
  data() {
    return {
      version: 1.4,
      latestVersion: null,
      activeIndex: location.pathname,
    };
  },
  async beforeCreate() {
    window.token = localStorage.getItem("token");
    window.isWindows = await httpUtil.get("/file/isWindows");
  },
  async created() {
    //获取最新版本
    let config = await httpUtil.get("https://s3.fleyx.com/picbed/openRenamer/config.json");
    this.latestVersion = config.version;
  },
  async mounted() {
    console.log(this.$route);
    console.log(location);
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
