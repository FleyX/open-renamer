<template>
  <div class="app">
    <div class="content">
      <el-menu :default-active="activeIndex" class="el-menu-demo" mode="horizontal" @select="handleSelect">
        <el-menu-item index="dealCenter">处理中心</el-menu-item>
      </el-menu>
      <router-view />
    </div>
    <div class="footer">版本：{{ version }}&nbsp;&nbsp;开源地址:<a href="https://github.com/FleyX/open-renamer">open-renamer</a></div>
  </div>
</template>

<script>
export default {
  name: "Home",
  data() {
    return {
      activeIndex: "dealCenter",
      version: "0.6",
    };
  },
};
</script>

<style lang="less">
html,
body {
  padding: 0;
  border: 0;
  margin: 0;
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

  .content {
    flex: 1;
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
</style>
