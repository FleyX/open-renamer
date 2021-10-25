<template>
  <div v-loading="loading" class="main">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item
        ><a @click.prevent="breadcrumbClick(-1)">根</a></el-breadcrumb-item
      >
      <el-breadcrumb-item v-for="(item, index) in pathList" :key="index">
        <a
          v-if="index < pathList.length - 1"
          @click.prevent="breadcrumbClick(index)"
          >{{ item }}</a
        >
        <span v-else>{{ item }}</span>
      </el-breadcrumb-item>
    </el-breadcrumb>

    <div class="fileList">
      <div>
        <el-input
          style="display: inline-block; width: 150px"
          type="text"
          size="small"
          placeholder="关键词过滤"
          v-model="filterText"
        />
        <el-button type="primary" @click="selectAll(true)" size="mini"
          >全选</el-button
        >
        <el-button type="primary" @click="selectAll(false)" size="mini"
          >全不选</el-button
        >
      </div>
      <div v-for="(item, index) in filterFileList" :key="index">
        <span class="folder" v-if="item.isFolder" @click="fileClick(item)">{{
          item.name
        }}</span>
        <el-checkbox v-model="item.checked" v-else>{{ item.name }}</el-checkbox>
      </div>
    </div>

    <div>
      <el-button type="primary" @click="submit">确定</el-button>
    </div>
  </div>
</template>

<script>
import HttpUtil from "../utils/HttpUtil";
export default {
  name: "FileChose",
  data() {
    return {
      isWindows: false,
      fileList: [], //路径下的文件节点
      chosedFileList: [], //选中的文件节点
      pathList: [], //选择的路径
      loading: false, //加载
      filterText: "", //关键字过滤
    };
  },
  computed: {
    filterFileList() {
      let text = this.filterText.trim();
      return text === ""
        ? this.fileList
        : this.fileList.filter((item) => item.name.indexOf(text) > -1);
    },
  },
  async mounted() {
    this.isWindows = await HttpUtil.get("/file/isWindows");
    await this.breadcrumbClick(-1);
  },
  methods: {
    //点击面包蟹
    async breadcrumbClick(index) {
      this.loading = true;
      let path = this.createPath(index);
      let fileList = await HttpUtil.get("/file/query", {
        path: encodeURIComponent(path),
        showHidden: false,
      });
      fileList.forEach((item) => (item.checked = false));
      this.fileList = fileList;
      this.loading = false;
      return false;
    },
    //文件列表点击
    fileClick(item) {
      if (item.isFolder) {
        this.pathList.push(item.name);
        this.breadcrumbClick(this.pathList.length);
      } else {
        item.checked = !item.checked;
      }
    },
    //全选
    selectAll(status) {
      this.filterFileList
        .filter((item) => !item.isFolder)
        .forEach((item) => (item.checked = status));
    },
    //根据index构建路径
    createPath(index) {
      let path;
      if (index == -1) {
        path = "/";
        this.pathList = [];
      } else {
        this.pathList = this.pathList.slice(0, index + 1);
        let str = this.pathList.join(this.isWindows ? "\\" : "/");
        path = this.isWindows ? str : "/" + str;
      }
      return path;
    },
    //点击确定
    submit() {
      let chosedFiles = this.fileList.filter((item) => item.checked);
      if (chosedFiles.length == 0) {
        this.$message({ message: "未选择文件", type: "warning" });
        return;
      }
      this.$emit("addData", chosedFiles);
    },
  },
};
</script>

<style lang="less" scoped>
.main {
  height: 65vh;
}
.fileList {
  padding: 1em;
  text-align: left;
  height: 80%;
  overflow: hidden auto;

  .folder {
    cursor: pointer;
    color: blue;
    display: inline-block;
    min-width: 3em;
  }
}
</style>
