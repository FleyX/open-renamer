import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/home/Home.vue";
import Login from "../views/public/login";

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  }, {
    path: "/auto",
    name: "Auto",
    component: () => import("@/views/auto/index"),
  }, {
    path: "/download/config",
    name: "downloadConfig",
    component: () => import("@/views/download/config/index"),
  }, {
    path: "/public/login",
    name: "login",
    component: Login,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
