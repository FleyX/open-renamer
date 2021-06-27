<template>
  <div class="hello">hello World!</div>
</template>

<script>
import HttpUtil from "../utils/HttpUtil";
export default {
  name: "HelloWorld",
  props: {
    msg: String,
  },
  mounted() {
    HttpUtil.get("");
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
