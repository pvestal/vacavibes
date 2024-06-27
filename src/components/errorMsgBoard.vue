<template>
    <div v-if="message" class="error-message-board">
      {{ message }}
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        message: '',
        displayDuration: 2500, // Display error message for 2.5 seconds
      };
    },
    methods: {
      showError(message) {
        this.message = message;
        setTimeout(() => {
          this.message = '';
        }, this.displayDuration);
      },
    },
  };
  </script>
  
  <style scoped>
  .error-message-board {
    background-color: #ffcccc;
    color: #cc0000;
    padding: 10px;
    margin: 10px 0;
    border-radius: 5px;
    text-align: center;
  }
  </style>