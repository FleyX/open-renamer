<template>
  <div v-loading="loading" :element-loading-text="$t('homeDialog.loadingText')">
    <el-divider content-position="left">
      <div class="head-text">{{ $t('aiRename.serviceConfig') }}</div>
    </el-divider>
    <div class="service-config">
      <el-input v-model="service.baseUrl" class="service-input" type="text"
        :placeholder="$t('aiRename.baseUrlPlaceholder')" @change="persistService" />
      <el-input v-model="service.model" class="service-input" type="text"
        :placeholder="$t('aiRename.modelPlaceholder')" @change="persistService" />
      <el-input v-model="service.apiKey" class="service-input" type="password" show-password
        :placeholder="$t('aiRename.apiKeyPlaceholder')" />
    </div>

    <el-divider content-position="left">
      <div class="head-text">{{ $t('aiRename.fileAndTarget') }}</div>
    </el-divider>
    <div class="file-action-btns">
      <el-button type="primary" size="small" @click="showFileDialog">{{ $t('aiRename.addFiles') }}</el-button>
      <el-button type="primary" size="small" @click="showFolderDialog">{{ $t('aiRename.addFolder') }}</el-button>
      <el-button type="warning" size="small" @click="clearFiles">{{ $t('aiRename.clearFiles') }}</el-button>
      <span class="target-root-label">{{ $t('aiRename.targetRoot') }}</span>
      <el-input v-model="targetRoot" class="target-root-input" type="text" readonly
        :placeholder="$t('aiRename.targetRootPlaceholder')" />
      <el-button type="primary" size="small" @click="showTargetRootDialog">{{ $t('aiRename.chooseTargetRoot') }}</el-button>
    </div>
    <div class="file-list">
      <div v-for="(item, index) in files" :key="index" class="oneLine">
        <span class="oneLineText file-source">{{ item.path }}{{ separator }}{{ item.name }}</span>
        <el-button type="danger" size="small" text @click="removeFile(index)">{{ $t('aiRename.remove') }}</el-button>
      </div>
      <div v-if="files.length === 0" class="empty-hint">{{ $t('aiRename.noFiles') }}</div>
    </div>

    <el-divider content-position="left">
      <div class="head-text">{{ $t('aiRename.specTitle') }}</div>
    </el-divider>
    <el-input v-model="instruction" type="textarea" :rows="3"
      :placeholder="$t('aiRename.specPlaceholder')" />

    <div class="generate-line">
      <el-button type="success" @click="generate">{{ $t('aiRename.generate') }}</el-button>
    </div>

    <template v-if="preview">
      <el-divider content-position="left">
        <div class="head-text">{{ $t('aiRename.previewTitle') }}</div>
      </el-divider>
      <div v-if="preview.error" class="preview-error">{{ preview.error }}</div>
      <div class="preview-table" v-if="preview.rows.length > 0">
        <div class="preview-row preview-head">
          <span class="col-source">{{ $t('aiRename.colSource') }}</span>
          <span class="col-target">{{ $t('aiRename.colTarget') }}</span>
          <span class="col-full">{{ $t('aiRename.colFullTarget') }}</span>
          <span class="col-problem">{{ $t('aiRename.colProblem') }}</span>
        </div>
        <div v-for="row in preview.rows" :key="row.id" class="preview-row">
          <span class="col-source oneLineText" :title="row.sourcePath">{{ row.contextPath }}</span>
          <span class="col-target">
            <el-input v-model="row.targetRel" type="text" size="small" @input="onRowEdit" />
          </span>
          <span class="col-full oneLineText" :title="row.targetAbs">{{ row.targetAbs }}</span>
          <span class="col-problem problem-text">{{ row.problem }}</span>
        </div>
      </div>
      <div class="generate-line">
        <el-button type="success" :disabled="!canSubmit" @click="submit">{{ $t('aiRename.submit') }}</el-button>
      </div>
    </template>

    <template v-if="result">
      <el-divider content-position="left">
        <div class="head-text">{{ $t('aiRename.resultTitle') }}</div>
      </el-divider>
      <div v-for="(item, index) in result.completed" :key="'c' + index">
        {{ $t('aiRename.completed') }}: {{ item.sourcePath }} → {{ item.targetAbs }}
      </div>
      <div v-for="(item, index) in result.failed" :key="'f' + index" class="problem-text">
        {{ $t('aiRename.failed') }}: {{ item.row.sourcePath }} - {{ item.error }}
      </div>
      <div v-for="(item, index) in result.pending" :key="'p' + index" class="problem-text">
        {{ $t('aiRename.pending') }}: {{ item.sourcePath }}
      </div>
    </template>

    <el-dialog v-model="fileDialogVisible" :width="dialogWidth">
      <file-chose ref="fileChose" type="file" emit-selection @addData="addFiles" />
    </el-dialog>
    <el-dialog v-model="folderDialogVisible" :width="dialogWidth">
      <file-chose ref="folderChose" type="folder" @folderChose="addFolder" />
    </el-dialog>
    <el-dialog v-model="targetRootDialogVisible" :width="dialogWidth">
      <file-chose ref="targetRootChose" type="folder" @folderChose="chooseTargetRoot" />
    </el-dialog>
  </div>
</template>

<script>
import HttpUtil from "../../utils/HttpUtil";
import FileChose from "@/components/FileChose";

const SERVICE_BASE_URL_KEY = "aiRename.baseUrl";
const SERVICE_MODEL_KEY = "aiRename.model";

export default {
  name: "AiRename",
  components: { FileChose },
  data() {
    return {
      loading: false,
      // 服务地址和模型名保存在浏览器本地，API Key 仅驻留本次界面会话
      service: {
        baseUrl: localStorage.getItem(SERVICE_BASE_URL_KEY) || "",
        model: localStorage.getItem(SERVICE_MODEL_KEY) || "",
        apiKey: "",
      },
      files: [], // 所选源文件（目录选择的文件带来源目录 sourceDir）
      targetRoot: "",
      instruction: "",
      fileDialogVisible: false,
      folderDialogVisible: false,
      targetRootDialogVisible: false,
      preview: null, // { batchId, version, rows, error? }
      result: null,
      requestSeq: 0, // 忽略过时的异步响应
      revalidateTimer: null,
      revalidateInFlight: 0, // 编辑校验进行中（显示最新结果前禁用提交）
      revalidateChain: null, // 串行应用编辑校验
      editVersion: 0,
      validatedEditVersion: 0,
    };
  },
  computed: {
    separator() {
      return window.isWindows ? "\\" : "/";
    },
    dialogWidth() {
      return window.innerWidth <= 768 ? "100%" : "70%";
    },
    canSubmit() {
      return (
        this.preview &&
        !this.loading &&
        !this.preview.error &&
        this.editVersion === this.validatedEditVersion &&
        this.preview.rows.length > 0 &&
        this.revalidateTimer == null &&
        this.revalidateInFlight === 0 &&
        this.preview.rows.every((row) => row.problem === "")
      );
    },
  },
  watch: {
    instruction() {
      this.invalidatePreview();
    },
  },
  beforeUnmount() {
    this.invalidatePreview();
  },
  methods: {
    persistService() {
      localStorage.setItem(SERVICE_BASE_URL_KEY, this.service.baseUrl || "");
      localStorage.setItem(SERVICE_MODEL_KEY, this.service.model || "");
    },
    showFileDialog() {
      this.fileDialogVisible = true;
      this.$nextTick(() => this.$refs.fileChose.refresh());
    },
    showFolderDialog() {
      this.folderDialogVisible = true;
      this.$nextTick(() => this.$refs.folderChose.refresh());
    },
    showTargetRootDialog() {
      this.targetRootDialogVisible = true;
      this.$nextTick(() => this.$refs.targetRootChose.refresh());
    },
    filePath(item) {
      const parent = item.path || "";
      return parent && !parent.endsWith(this.separator)
        ? parent + this.separator + item.name
        : parent + item.name;
    },
    mergeFiles(existing, added) {
      const byPath = new Map(existing.map((item) => [this.filePath(item), item]));
      for (const item of added) {
        const key = this.filePath(item);
        if (!byPath.has(key) || (!byPath.get(key).sourceDir && item.sourceDir)) {
          byPath.set(key, item);
        }
      }
      return [...byPath.values()];
    },
    async addSelection(selection) {
      this.invalidatePreview();
      const seq = this.requestSeq;
      this.loading = true;
      try {
        const expanded = await Promise.all(selection.map(async (item) => {
          if (!item.isFolder) {
            return [item];
          }
          const sourceDir = this.filePath(item);
          const files = await HttpUtil.post("/file/recursionQuery", null, [item]);
          return files.map((file) => ({ ...file, sourceDir }));
        }));
        if (seq === this.requestSeq) {
          this.files = this.mergeFiles(this.files, expanded.flat());
        }
      } finally {
        this.loading = false;
      }
    },
    addFiles(selection) {
      this.fileDialogVisible = false;
      return this.addSelection(selection);
    },
    addFolder(folders) {
      this.folderDialogVisible = false;
      return this.addSelection(folders);
    },
    chooseTargetRoot(folders) {
      if (!folders || folders.length === 0) {
        return;
      }
      const folder = folders[0];
      this.targetRoot = this.filePath(folder);
      this.targetRootDialogVisible = false;
      this.invalidatePreview();
    },
    removeFile(index) {
      this.files.splice(index, 1);
      this.invalidatePreview();
    },
    clearFiles() {
      this.files = [];
      this.invalidatePreview();
    },
    // 修改文件集合或规范使当前预览失效，并忽略过时响应
    invalidatePreview() {
      this.requestSeq += 1;
      this.preview = null;
      this.result = null;
      this.editVersion = 0;
      this.validatedEditVersion = 0;
      if (this.revalidateTimer != null) {
        clearTimeout(this.revalidateTimer);
        this.revalidateTimer = null;
      }
    },
    async generate() {
      if (this.files.length === 0) {
        this.$message({ message: this.$t('aiRename.noFiles'), type: "warning" });
        return;
      }
      if (!this.targetRoot) {
        this.$message({ message: this.$t('aiRename.targetRootPlaceholder'), type: "warning" });
        return;
      }
      if (!this.instruction.trim()) {
        this.$message({ message: this.$t('aiRename.specPlaceholder'), type: "warning" });
        return;
      }
      this.invalidatePreview();
      const seq = this.requestSeq;
      this.loading = true;
      try {
        const preview = await HttpUtil.post("/aiRename/generate", null, {
          files: this.files,
          targetRoot: this.targetRoot,
          instruction: this.instruction,
          service: {
            baseUrl: this.service.baseUrl,
            model: this.service.model,
            apiKey: this.service.apiKey,
          },
        });
        if (seq !== this.requestSeq) {
          return; // 预览已被新的修改置为无效
        }
        this.preview = preview;
        this.result = null;
      } finally {
        this.loading = false;
      }
    },
    // 编辑目标路径后重新校验整批（不请求模型）
    onRowEdit() {
      this.editVersion += 1;
      if (this.revalidateTimer != null) {
        clearTimeout(this.revalidateTimer);
      }
      this.revalidateTimer = setTimeout(() => {
        this.revalidateTimer = null;
        this.revalidate();
      }, 600);
    },
    // 串行应用编辑校验：一次一个请求，最新的校验结果才允许提交
    revalidate() {
      const seq = this.requestSeq;
      const batchId = this.preview && this.preview.batchId;
      if (!batchId) {
        return;
      }
      const chain = this.revalidateChain || Promise.resolve();
      this.revalidateChain = chain.then(() => this.applyRevalidate(seq, batchId));
    },
    async applyRevalidate(seq, batchId) {
      this.revalidateInFlight += 1;
      try {
        const rows =
          this.preview && this.preview.batchId === batchId
            ? this.preview.rows
            : null;
        if (!rows) {
          return;
        }
        const editVersion = this.editVersion;
        const updated = await HttpUtil.post("/aiRename/preview/validate", null, {
          batchId,
          rows: rows.map((row) => ({
            id: row.id,
            targetRel: row.targetRel,
          })),
        });
        if (seq !== this.requestSeq || editVersion !== this.editVersion ||
          !this.preview || this.preview.batchId !== batchId) {
          return;
        }
        this.preview = updated;
        this.validatedEditVersion = editVersion;
      } catch (error) {
        // HttpUtil 已提示错误
      } finally {
        this.revalidateInFlight -= 1;
      }
    },
    async submit() {
      if (!this.canSubmit) {
        return;
      }
      this.loading = true;
      try {
        this.result = await HttpUtil.post("/aiRename/submit", null, {
          batchId: this.preview.batchId,
          version: this.preview.version,
        });
        const completedSet = new Set(
          this.result.completed.map((row) => row.sourcePath),
        );
        this.files = this.files.filter(
          (item) => !completedSet.has(this.filePath(item)),
        );
        this.$message({
          message: this.$t('aiRename.submitDone'),
          type: this.result.failed.length > 0 ? "warning" : "success",
        });
        this.preview = null;
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style lang="less" scoped>
.head-text {
  font-weight: bold;
}

.service-config {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5em;

  .service-input {
    width: 260px;
  }
}

.file-action-btns {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;

  .target-root-label {
    margin-left: 0.5em;
  }

  .target-root-input {
    width: 320px;
  }
}

.file-list {
  text-align: left;
  margin-top: 0.5em;

  .oneLine {
    display: flex;
    align-items: center;
    border-top: 1px solid rgb(214, 212, 212);
    padding: 0.15em 0;
  }

  .oneLineText {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .file-source {
    width: 85%;
  }

  .empty-hint {
    color: #909399;
  }
}

.generate-line {
  margin-top: 1em;
  text-align: left;
}

.preview-error {
  color: red;
  text-align: left;
}

.preview-table {
  text-align: left;

  .preview-row {
    display: flex;
    align-items: center;
    gap: 0.5em;
    border-top: 1px solid rgb(214, 212, 212);
    padding: 0.2em 0;

    &.preview-head {
      font-weight: bold;
      border-top: none;
    }

    .col-source {
      width: 22%;
    }

    .col-target {
      width: 30%;
    }

    .col-full {
      width: 33%;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .col-problem {
      width: 15%;
    }
  }

  .problem-text {
    color: red;
  }
}

@media (max-width: 768px) {
  .service-config {
    .service-input {
      width: 100%;
    }
  }

  .file-action-btns {
    .target-root-input {
      width: 100%;
    }
  }
}
</style>
