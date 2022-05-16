import * as http from 'axios';
import router from '../router/index';

/**
 * 请求
 * @param {*} url url
 * @param {*} method 方法
 * @param {*} params url参数
 * @param {*} body 请求体
 * @param {*} isForm 是否form
 * @param {*} redirect 接口返回未认证是否跳转到登陆
 * @returns 数据
 */
async function request (url, method, params, body, isForm) {
  let options = {
    url,
    baseURL: '/openRenamer/api',
    method,
    params,
    headers: { token: window.token }
  };
  if (isForm) {
    options.headers['Content-Type'] = 'multipart/form-data';
  }
  if (body) {
    options.data = body;
  }
  let res;
  try {
    res = await http.default.request(options);
  } catch (err) {
    console.log(Object.keys(err));
    console.log(err.response);
    if (err.response.status == 401) {
      window.vueInstance.config.globalProperties.$message.error('密钥验证错误');
      router.push("/public/login");
    } else {
      window.vueInstance.config.globalProperties.$message.error('发生了某些异常问题');
    }
    throw err;
  }
  return res.data;
}

/**
 * get方法
 * @param {*} url url
 * @param {*} params url参数
 * @param {*} redirect 未登陆是否跳转到登陆页
 */
async function get (url, params = null) {
  return request(url, 'get', params, null, false);
}

/**
 * post方法
 * @param {*} url url
 * @param {*} params url参数
 * @param {*} body body参数
 * @param {*} isForm 是否表单数据
 * @param {*} redirect 是否重定向
 */
async function post (url, params, body, isForm = false) {
  return request(url, 'post', params, body, isForm);
}

/**
 * put方法
 * @param {*} url url
 * @param {*} params url参数
 * @param {*} body body参数
 * @param {*} isForm 是否表单数据
 * @param {*} redirect 是否重定向
 */
async function put (url, params, body, isForm = false) {
  return request(url, 'put', params, body, isForm);
}

/**
 * delete方法
 * @param {*} url url
 * @param {*} params url参数
 * @param {*} redirect 是否重定向
 */
async function deletes (url, params = null) {
  return request(url, 'delete', params, null);
}

export default {
  get,
  post,
  put,
  delete: deletes,
};
