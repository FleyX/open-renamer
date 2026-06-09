<template>
  <div v-loading="loading" class="main">
    <el-breadcrumb class="file-breadcrumb" separator="/">
      <el-breadcrumb-item><a @click.prevent="breadcrumbClick(-1)">{{ $t('fileChose.root') }}</a></el-breadcrumb-item>
      <el-breadcrumb-item v-for="(item, index) in pathList" :key="index">
        <a v-if="index < pathList.length - 1" @click.prevent="breadcrumbClick(index)">{{ item }}</a>
        <span v-else>{{ item }}</span>
      </el-breadcrumb-item>
    </el-breadcrumb>

    <div class="fileList">
      <div class="file-toolbar">
        <el-input class="filter-input" type="text" size="small" :placeholder="$t('fileChose.filterPlaceholder')"
                  v-model="filterText" clearable/>
        <template v-if="type === 'file'">
          <el-button type="primary" @click="selectAll(true)" size="small">{{ $t('fileChose.selectAll') }}</el-button>
          <el-button type="primary" @click="selectAll(false)" size="small">{{ $t('fileChose.deselectAll') }}</el-button>
          <el-button type="primary" @click="refresh" size="small">{{ $t('fileChose.refresh') }}</el-button>
          <el-button v-if="curSavePathId" type="warning" @click="cancelSavePath" size="small">{{ $t('fileChose.cancelSavePath') }}</el-button>
          <el-button v-else type="primary" @click="showSave = true" size="small">{{ $t('fileChose.savePath') }}</el-button>
        </template>
      </div>
      <div class="file-item" v-for="(item, index) in filterFileList" :key="index">
        <el-checkbox v-model="item.checked" :disabled="type==='folder' && !item.isFolder">
          <a v-if="item.isFolder" @click="fileClick(item)" style="color: #289fff">{{ item.name }}</a>
          <span v-else>{{ item.name }}</span>
        </el-checkbox>
      </div>
    </div>

    <div>
      <el-button type="primary" @click="submit">{{ $t('fileChose.confirm') }}</el-button>
    </div>

    <el-dialog :title="$t('fileChose.savePathTitle')" v-model="showSave" :width="saveDialogWidth">
      <el-input type="text" v-model="saveName" :placeholder="$t('fileChose.savePathNamePlaceholder')"/>
      <el-button type="primary" @click="savePath" style="padding-top: 1em">{{ $t('fileChose.submit') }}</el-button>
    </el-dialog>
  </div>
</template>

<script>
import HttpUtil from "../utils/HttpUtil";
import Bus from "../utils/Bus";

export default {
  name: "FileChose",
  //type:folder:选择文件夹。file:选择文件
  props: ["curChoosePath", "type"],
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
      let targetList = this.savePathList.filter((item) => item.content === curPath);
      return targetList.length > 0 ? targetList[0].id : null;
    },
    saveDialogWidth() {
      return window.innerWidth <= 768 ? '100%' : '40em';
    }
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
      this.filterFileList.forEach((item) => (item.checked = status));
    },
    //根据index构建路径
    createPath(index) {
      console.log("当前路径为:", this.pathList);
      let path;
      if (index === -1) {
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
    async submit() {
      let chosenFiles = this.fileList.filter((item) => item.checked);
      if (chosenFiles.length === 0) {
        this.$message({message: this.$t('fileChose.noFileSelected'), type: "warning"});
        return;
      }
      if (this.type === 'file') {
        let body = await HttpUtil.post("/file/recursionQuery", null, chosenFiles);
        this.$emit("addData", JSON.parse(JSON.stringify(body)));
        this.fileList.forEach((item) => (item.checked = false));
        this.fileList = [...this.fileList];
      } else if (this.type === 'folder') {
        //选择文件夹
        this.$emit("folderChose", JSON.parse(JSON.stringify(chosenFiles)));
      }
      this.filterText = "";

    },
    //收藏路径
    async savePath() {
      await HttpUtil.post("/file/path/save", null, {name: this.saveName, content: JSON.stringify(this.pathList)});
      Bus.$emit("refreshSavePathList");
      this.saveName = "";
      this.showSave = false;
      this.$message.success("操作成功");
    },
    //取消收藏路径
    async cancelSavePath() {
      await HttpUtil.delete("/file/path/delete", {id: this.curSavePathId});
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

.file-breadcrumb {
  white-space: nowrap;
  overflow-x: auto;
  padding: 0.3em 0;
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

  .file-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5em;
    margin-bottom: 0.5em;

    .filter-input {
      display: inline-block;
      width: 150px;
    }
  }

  .file-item {
    min-height: 1.8em;
    padding: 0.2em 0;

    :deep(.el-checkbox) {
      height: auto;
      min-height: 1.4em;
      align-items: center;
    }

    a, span {
      display: inline-block;
      padding: 0.15em 0;
    }
  }
}

@media (max-width: 768px) {
  .main {
    height: 55vh;
  }

  .fileList {
    height: 75%;
    padding: 0.5em;

    .file-toolbar {
      .filter-input {
        width: 100%;
      }
    }

    .file-item {
      min-height: 2em;
      padding: 0.3em 0;
      font-size: 0.95em;
    }
  }
}
</style>
