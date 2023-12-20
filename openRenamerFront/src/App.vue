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
      <el-tooltip effect="dark" content="点击查看更新记录" placement="top">
        <a href="https://blog.fleyx.com/blog/detail/20221130/#%E7%89%88%E6%9C%AC%E6%9B%B4%E6%96%B0%E8%AE%B0%E5%BD%95"
           target="_blank">
          {{ version }}</a>
      </el-tooltip>
      &nbsp;&nbsp;
      <template v-if="latestVersion && showNewVersion">
        最新版本:
        <el-tooltip effect="dark" content="点击查看更新文档" placement="top">
          <a href="https://blog.fleyx.com/blog/detail/20221130/#%E7%89%88%E6%9C%AC%E6%9B%B4%E6%96%B0%E8%AE%B0%E5%BD%95"
             target="_blank">
            {{ latestVersion }}</a>
        </el-tooltip>
        &nbsp;&nbsp;
      </template>
      开源地址:<a href="https://github.com/FleyX/open-renamer" target="_blank">open-renamer</a>
      &nbsp;&nbsp;<a href="https://github.com/FleyX/open-renamer/issues" target="_blank">反馈</a>
    </div>
  </div>
</template>

<script>
import httpUtil from "./utils/HttpUtil";

export default {
  name: "Home",
  data() {
    return {
      version: "1.6.2",
      latestVersion: null,
      activeIndex: location.pathname,
      showNewVersion: false
    };
  },
  async beforeCreate() {
    console.log("beforeCreate");
    let queryMap = {};
    location.search.substring(1).split("&").forEach(item => {
      let arr = item.split("=");
      queryMap[arr[0]] = arr[1];
    })
    if (queryMap.port) {
      window.baseUrl = "http://localhost:" + queryMap.port;
    } else {
      window.baseUrl = "";
    }
    window.token = localStorage.getItem("token");
    window.isWindows = await httpUtil.get("/file/isWindows");
  },
  async created() {
    //获取最新版本
    let config = await httpUtil.get("https://s3.fleyx.com/picbed/openRenamer/config.json");
    this.latestVersion = config.version;
    this.showNewVersion = checkVersion(this.version, this.latestVersion);

  },
  async mounted() {
    console.log(this.$route);
    console.log(location);
  },
};

function checkVersion(version, latestVersion) {
  let versions = version.split(".");
  let latestVersions = latestVersion.split('.');
  for (let i = 0; i < versions.length; i++) {
    if (i >= latestVersions.length) {
      return false;
    }
    let versionNum = parseInt(versions[i]);
    let latestVersionNum = parseInt(latestVersions[i]);
    if (versionNum !== latestVersionNum) {
      return versionNum < latestVersionNum;
    }
  }
  return false;
}
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
