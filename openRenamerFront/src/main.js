import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import ElementPlus, { ElMessage } from 'element-plus';
import 'element-plus/lib/theme-chalk/index.css';

const vueInstance = createApp(App);
vueInstance.use(router).use(ElementPlus).mount('#app');
vueInstance.config.globalProperties.$message = ElMessage;
window.vueInstance = vueInstance;
