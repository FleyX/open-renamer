<template>
  <div class="app">
    <div class="header">
      <el-menu :default-active="activeIndex" mode="horizontal" :ellipsis="true" background-color="#545c64"
               text-color="#fff"
               active-text-color="#ffd04b" router>
        <el-menu-item index="/">{{ $t("menu.rename") }}</el-menu-item>
        <!--      <el-menu-item index="/auto">自动化</el-menu-item>-->
      </el-menu>
      <el-dropdown class="lang-dropdown" @command="langChange">
        {{ $t("langChange") }} : {{ data.curLangLabel }}
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-for="item in data.langList" :key="item.code" :command="item.code">
              {{ item.label }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    <div class="content">
      <router-view />
    </div>
    <div class="footer">{{ $t("version") }}：
      <el-tooltip effect="dark" content="点击查看更新记录" placement="top">
        <a href="https://blog.fleyx.com/blog/detail/20221130/#%E7%89%88%E6%9C%AC%E6%9B%B4%E6%96%B0%E8%AE%B0%E5%BD%95"
           target="_blank">
          {{ data.version }}</a>
      </el-tooltip>
      &nbsp;&nbsp;
      <template v-if="data.latestVersion && data.showNewVersion">
        {{ $t("newestVersion") }}:
        <el-tooltip effect="dark" content="点击查看更新文档" placement="top">
          <a href="https://blog.fleyx.com/blog/detail/20221130/#%E7%89%88%E6%9C%AC%E6%9B%B4%E6%96%B0%E8%AE%B0%E5%BD%95"
             target="_blank">
            {{ data.latestVersion }}</a>
        </el-tooltip>
        &nbsp;&nbsp;
      </template>
      {{ $t("openSourceLocation") }}:<a href="https://github.com/FleyX/open-renamer">github open-renamer</a>
      &nbsp;&nbsp;<a href="https://github.com/FleyX/open-renamer/issues">{{ $t("feedback") }}</a>
    </div>
  </div>
</template>

<script setup>
import { onBeforeMount, reactive } from "vue";
import { useI18n } from "vue-i18n";
import axios from "axios";

const { locale, t } = useI18n();
import httpUtil from "./utils/HttpUtil";
import {version} from './config';

const data = reactive({
  version,
  latestVersion: null,
  activeIndex: location.pathname,
  showNewVersion: false,
  curLangLabel: "",
  langList: [{ code: "en", label: "English" },
    { code: "zh", label: "中文" }]
});

onBeforeMount(async () => {
  window.token = localStorage.getItem("token");
  window.isWindows = await httpUtil.get("/file/isWindows");
  //获取最新版本
  try {
    let res = await axios.get("https://api.github.com/repos/FleyX/open-renamer/releases/latest");
    data.latestVersion = res.data.tag_name.replace(/^v/, '');
    data.showNewVersion = checkVersion(data.version, data.latestVersion);
  } catch (e) {
    console.error("获取最新版本失败", e);
  }
  data.curLangLabel = data.langList.filter(item => item.code === locale.value)[0].label;
  console.log(data.curLangLabel);
});

function langChange(command) {
  data.curLangLabel = data.langList.filter(item => command === item.code)[0].label;
  locale.value = command;
  localStorage.setItem("lang", command);
  console.log(command);
}

function checkVersion(version, latestVersion) {
  let versions = version.split(".");
  let latestVersions = latestVersion.split(".");
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

  .header {
    position: relative;
  }

  .content {
    flex: 1;
    padding: 0 10px 0 10px;
  }
}

.lang-dropdown {
  position: absolute;
  right: 1em;
  top: 1em;
  color: white;
  cursor: pointer;
}

@media (max-width: 768px) {
  .app {
    width: 100%;
    min-width: auto;

    .content {
      padding: 0 5px 0 5px;
    }
  }

  .lang-dropdown {
    right: 0.5em;
    top: 0.8em;
  }

  .footer {
    font-size: 0.8em;
    padding: 0.5em;
    line-height: 1.8;
    word-break: break-all;
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
