<template>
	<el-tooltip effect="dark" :content="message" :placement="placement ? placement : 'top'">
		<el-icon>
			<InfoFilled />
		</el-icon>
	</el-tooltip>
</template>

<script setup>
import { InfoFilled } from "@element-plus/icons-vue";
import { ref, reactive, onMounted, computed, defineProps } from "vue";

defineProps({
	message: String,
	placement: String
})

</script>

<style lang="less" scoped>

</style>
