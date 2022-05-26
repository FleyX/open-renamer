import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/home/Home.vue";
import Login from "../views/public/login";

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
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
