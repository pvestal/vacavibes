<template>
  <nav>
    <ul>
      <li><router-link to="/">Home</router-link></li>
      <li v-if="!user"><router-link to="/login">Login</router-link></li>
      <li v-if="user"><router-link to="/submissions">Submissions</router-link></li>
      <li v-if="user"><router-link to="/recommendations">Recommendations</router-link></li>
      <li v-if="user"><router-link to="/pending-ratings">Pending Ratings</router-link></li>
      <li v-if="user"><button @click="logout">Logout</button></li>
    </ul>
  </nav>
</template>

<script>
import { mapState, mapActions } from 'vuex';

export default {
  computed: {
    ...mapState(['user'])
  },
  methods: {
    ...mapActions(['logout'])
  }
};
</script>

<style scoped>
nav {
  background-color: #333;
  padding: 10px;
}

ul {
  list-style-type: none;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

li {
  float: left;
}

li a, li button {
  display: block;
  color: white;
  text-align: center;
  padding: 14px 16px;
  text-decoration: none;
  border: none;
  background: none;
  cursor: pointer;
}

li a:hover, li button:hover {
  background-color: #111;
}
</style>
