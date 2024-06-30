<template>
  <div class="login-container">
    <h1>Login</h1>
    <button @click="handleLogin" class="login-button">Login with Google</button>
  </div>
</template>

<script>
import { mapActions } from 'vuex';


export default {
  methods: {
    ...mapActions(['login']),
    handleLogin() {
      this.login().catch(error => {
        console.error('Login failed:', error);
        this.dispatch('showError', 'Login failed. Please try again.');
      });
    }
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f5f5f5;
}

.login-button {
  background-color: #4285f4;
  color: white;
  border: none;
  padding: 10px 20px;
  cursor: pointer;
  font-size: 16px;
  border-radius: 5px;
  transition: background-color 0.3s;
}

.login-button:hover {
  background-color: #357ae8;
}
</style>


