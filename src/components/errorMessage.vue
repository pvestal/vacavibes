<!-- components/ErrorMessage.vue -->
<template>
    <transition name="fade">
      <div v-if="errorVisible" class="error-message">
        {{ errorMessage }}
      </div>
    </transition>
  </template>
  
  <script>
  import { mapState } from 'vuex';
  
  export default {
    computed: mapState(['errorMessage', 'errorVisible'])
  };
  </script>
  
  <style>
  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.5s;
  }
  .fade-enter, .fade-leave-to /* .fade-leave-active in <2.1.8 */ {
    opacity: 0;
  }
  .error-message {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: red;
    color: white;
    padding: 10px;
    border-radius: 5px;
  }
  </style>
  