<template>
  <div v-loading="loading" class="main">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item><a @click.prevent="breadcrumbClick(-1)">根</a></el-breadcrumb-item>
      <el-breadcrumb-item v-for="(item, index) in pathList" :key="index">
        <a v-if="index < pathList.length - 1" @click.prevent="breadcrumbClick(index)">{{ item }}</a>
        <span v-else>{{ item }}</span>
      </el-breadcrumb-item>
    </el-breadcrumb>

    <div class="fileList">
      <div>
        <el-input style="display: inline-block; width: 150px" type="text" size="small" placeholder="关键词过滤" v-model="filterText" clearable />
        <el-button type="primary" @click="selectAll(true)" size="small">全选</el-button>
        <el-button type="primary" @click="selectAll(false)" size="small">全不选</el-button>
        <el-button type="primary" @click="refresh" size="small">刷新</el-button>
        <el-button v-if="curSavePathId" type="warning" @click="cancelSavePath" size="small">取消收藏</el-button>
        <el-button v-else type="primary" @click="showSave = true" size="small">收藏路径</el-button>
      </div>
      <div v-for="(item, index) in filterFileList" :key="index">
        <span class="folder" v-if="item.isFolder" @click="fileClick(item)">{{ item.name }}</span>
        <el-checkbox style="height: 1.4em" v-model="item.checked" v-else>{{ item.name }}</el-checkbox>
      </div>
    </div>

    <div>
      <el-button type="primary" @click="submit">确定</el-button>
    </div>

    <el-dialog title="保存路径" v-model="showSave" width="40em">
      <el-input type="text" v-model="saveName" placeholder="输入名称" />
      <el-button type="primary" @click="savePath" style="padding-top: 1em">提交</el-button>
    </el-dialog>
  </div>
</template>

<script>
import HttpUtil from "../utils/HttpUtil";
import Bus from "../utils/Bus";
export default {
  name: "FileChose",
  props: ["curChoosePath"],
  data() {
    return {
      isWindows: false,
      fileList: [], //路径下的文件节点
      pathList: [], //选择的路径
      loading: false, //加载
      filterText: "", //关键字过滤
      showSave: false, //保存路径
      saveName: "",
      savePathList: [], //保存的路径
    };
  },
  computed: {
    filterFileList() {
      let text = this.filterText.trim();
      return text === "" ? this.fileList : this.fileList.filter((item) => item.name.indexOf(text) > -1);
    },
    curSavePathId() {
      let curPath = JSON.stringify(this.pathList);
      let targetList = this.savePathList.filter((item) => item.content == curPath);
      return targetList.length > 0 ? targetList[0].id : null;
    },
  },
  watch: {
    async curChoosePath(newVal) {
      console.log("变更路径:", newVal);
      this.pathList = newVal;
      await this.breadcrumbClick(this.pathList.length - 1);
    },
  },
  async created() {
    if (this.curChoosePath && this.curChoosePath.length > 0) {
      this.pathList = this.curChoosePath;
    }
    await this.breadcrumbClick(this.pathList.length - 1);
    await this.refreshSavePathList();
    Bus.$on("refreshSavePathList", this.refreshSavePathList);
  },

  methods: {
    async refresh() {
      await this.breadcrumbClick(this.pathList.length - 1);
    },
    //刷新保存的路径
    async refreshSavePathList() {
      this.savePathList = await HttpUtil.get("/file/path");
    },
    //点击面包蟹
    async breadcrumbClick(index) {
      this.loading = true;
      try {
        let path = this.createPath(index);
        let fileList = await HttpUtil.get("/file/query", {
          path: encodeURIComponent(path),
          showHidden: false,
        });
        fileList.forEach((item) => (item.checked = false));
        this.fileList = fileList;
        this.filterText = "";
      } finally {
        this.loading = false;
      }
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
      this.filterFileList.filter((item) => !item.isFolder).forEach((item) => (item.checked = status));
    },
    //根据index构建路径
    createPath(index) {
      console.log("当前路径为:", this.pathList);
      let path;
      if (index == -1) {
        path = "";
        this.pathList = [];
      } else {
        this.pathList = this.pathList.slice(0, index + 1);
        let str = this.pathList.join(window.isWindows ? "\\" : "/") + (window.isWindows ? "\\" : "/");
        path = window.isWindows ? str : "/" + str;
      }
      console.log("构建出的路径为:", path);
      return path;
    },
    //点击确定
    submit() {
      let chosedFiles = this.fileList.filter((item) => item.checked);
      if (chosedFiles.length == 0) {
        this.$message({ message: "未选择文件", type: "warning" });
        return;
      }
      this.$emit("addData", JSON.parse(JSON.stringify(chosedFiles)));
      this.fileList.forEach((item) => (item.checked = false));
      this.fileList = [...this.fileList];
      this.filterText = "";
    },
    //收藏路径
    async savePath() {
      await HttpUtil.post("/file/path/save", null, { name: this.saveName, content: JSON.stringify(this.pathList) });
      Bus.$emit("refreshSavePathList");
      this.saveName = "";
      this.showSave = false;
      this.$message.success("操作成功");
    },
    //取消收藏路径
    async cancelSavePath() {
      await HttpUtil.delete("/file/path/delete", { id: this.curSavePathId });
      Bus.$emit("refreshSavePathList");
      this.$message.success("操作成功");
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
    line-height: 1.4em;
  }
}
</style>
