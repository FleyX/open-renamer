import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import ElementPlus, { ElMessage } from "element-plus";
import { createI18n } from "vue-i18n";
import "element-plus/dist/index.css";

import en from "./i18n/en";
import zh from "./i18n/zh";

const messages = {
  en,
  zh
};


const lang = (navigator.language || "en").toLocaleLowerCase();
const locale = localStorage.getItem("lang") || lang.split("-")[0] || "en";
console.log(messages, locale);
const i18n = createI18n({
  legacy: false,
  locale,
  fallbackLocale: "en",
  messages
});

const vueInstance = createApp(App);
vueInstance.use(router).use(ElementPlus).use(i18n).mount("#app");
vueInstance.config.globalProperties.$message = ElMessage;
window.vueInstance = vueInstance;
