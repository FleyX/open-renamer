<template>
	<div>
		<el-form ref="configRuleRef" label-width="100px" :model="body" :rules="bodyRule">
			<input type="text" class="form-control" style="display:none" />
			<el-form-item label="剧集目录" prop="paths">
				<div style="text-align:left">
					<template v-for="(item, index) in body.paths" :key="item">
						<el-tag closable @close="closePath(index, 'folder')">{{ item }}</el-tag> <br />
					</template>
					<div style="display:flex;align-items:center">
						<el-button type="primary" link @click="showFolderDialog = true">+新增目录</el-button>
						<tips message="添加剧集的上级目录，此目录下的每一个文件夹都将被认为是一部剧" />
					</div>
				</div>
			</el-form-item>
			<el-form-item label="忽略文件">
				<div style="text-align:left;display:flex;align-items:center">
					<template v-for="(item, index) in body.ignorePaths" :key="item">
						<el-tag closable @close="closePath(index, 'ignore')">{{ item }}</el-tag> <br />
					</template>
					<el-input v-if="ignoreInputVisible" v-model="ignoreInput" class="ml-1 w-20" size="small"
						@keyup.enter="addIngoreFile" @blur="addIngoreFile" />
					<el-button v-else class="button-new-tag ml-1" size="small" @click="ignoreInputVisible = true">
						+ 忽略
					</el-button>
					<tips message="名字匹配的文件/文件夹将会忽略处理" />
				</div>
			</el-form-item>
			<el-form-item label="忽略特典">
				<el-switch v-model="body.ignoreSeason0" class="ml-2" />
				<tips message="season 0/特典通常命名不规范，建议手动处理" />
			</el-form-item>
			<el-form-item label="删除小文件">
				<el-switch v-model="body.deleteSmallVideo" class="ml-2" />
				<tips message="删除小于2M的视频文件，此类文件通常为广告" />
			</el-form-item>
			<el-form-item label="规则" prop="rules">
				<RuleBlock :rules="body.rules" @ruleUpdate="ruleUpdate" />
			</el-form-item>
			<el-form-item label="忽略现有">
				<el-switch v-model="body.ignoreExist" class="ml-2" />
				<tips message="是否忽略现有文件.打开开关会忽略现有文件，关闭会重命名现有文件" />
			</el-form-item>
			<el-form-item label="开始任务">
				<el-switch v-model="body.start" class="ml-2" />
			</el-form-item>
		</el-form>
		<el-button type="primary" @click="submit"> 保存自动化配置 </el-button>
		<el-dialog title="选择目录" v-model="showFolderDialog" width="70%">
			<file-chose ref="fileChose" type="folder" @folderChose="folderChose" />
		</el-dialog>
	</div>
</template>

<script setup>
import FileChose from "@/components/FileChose.vue";
import RuleBlock from "@/components/rules/RuleBlock.vue";
import Tips from '@/components/Tips.vue';
import { ElMessage, ElMessageBox } from 'element-plus'
import { ref, reactive, onMounted } from "vue";
import http from "@/utils/HttpUtil";

//配置中心数据
let body = ref({
	paths: [],
	version: 1,
	ignoreSeason0: true,
	ignorePaths: [],
	deleteSmallVideo: true,
	rules: [],
	ignoreExist: false,
	start: false
});
let bodyRule = reactive({
	paths: { type: 'array', required: true, message: '目录不能为空', trigger: 'change' },
	rules: { type: 'array', required: true, message: '目录不能为空', trigger: 'change' },
})
const configRuleRef = ref();
let showFolderDialog = ref(false);
let ignoreInputVisible = ref(false);
let ignoreInput = ref("");


onMounted(async () => {
	let res = await http.post("/config/multCode", null, ['autoConfig', 'firstUse']);
	if (res.autoConfig == undefined && res.firstUse == undefined) {
		await http.post("/config/insertOrUpdate", null, { code: "firstUse", val: "1" });
		await ElMessageBox.alert("似乎是首次使用自动化，是否需要查看使用文档？", "提示", {
			confirmButtonText: "是",
			cancelButtonText: "否",
			showCancelButton: true
		});
		alert("跳转到自动化使用文档");
		return;
	}
	if (res.autoConfig != undefined) {
		body.value = JSON.parse(res.autoConfig);
	}
});

//新增文件夹
async function folderChose (data) {
	if (body.value.paths.indexOf(data) > -1) {
		ElMessage({ type: 'warning', message: "路径已存在" });
		return;
	}
	body.value.paths.push(data);
	showFolderDialog.value = false;
}
//新增忽略文件
async function addIngoreFile () {
	if (body.value.ignorePaths.indexOf(ignoreInput.value) > -1) {
		ElMessage({ type: 'warning', message: "名称已存在" });
		return;
	}
	if (ignoreInput.value.length > 0) {
		body.value.ignorePaths.push(ignoreInput.value);
	}
	ignoreInput.value = "";
	ignoreInputVisible.value = false;
	return false;
}

//删除路径
async function closePath (index, type) {
	(type === 'folder' ? body.value.paths : body.value.ignorePaths).splice(index, 1);
}
//更新规则
function ruleUpdate (rules) {
	body.value.rules = rules;
}
//提交
async function submit () {
	console.dir(configRuleRef.value);
	configRuleRef.value.validate(async valid => {
		if (!valid) {
			return;
		}
		await http.post("/config/insertOrUpdate", null, { code: "autoConfig", val: JSON.stringify(body.value), description: "自动化配置" });
		ElMessage({ type: 'success', message: "保存成功" });
	})
}
</script>

<style lang="less" scoped>
.item {
	display: flex;
	text-align: left;
	padding-bottom: 0.5em;

	.left {
		width: 6em;
		font-weight: 600;
	}

	.right {
		flex: 1;
	}
}
</style>
