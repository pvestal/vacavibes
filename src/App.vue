<template>
  <div id="app">
    <ErrorMessage />
    <NavBar />
    <router-view></router-view>
  </div>
</template>

<script>
import NavBar from './components/NavBar.vue';
import ErrorMessage from './components/errorMessage.vue'

export default {
  name: 'App',
  components: {
    NavBar,
    ErrorMessage
  }
};
</script>


