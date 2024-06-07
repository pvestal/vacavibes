<template>
  <div>
    <h1>Pending Ratings</h1>
    <div v-if="pendingRatings.length === 0">
      <p>No pending ratings from other users.</p>
    </div>
    <div v-else>
      <div class="rating-list">
        <div v-for="rating in pendingRatings" :key="rating.id" class="rating-card">
          <h2>{{ rating.locationName }}</h2>
          <p><strong>Submitted by:</strong> {{ rating.submittedBy }}</p>
          <p><strong>Status:</strong> {{ rating.status }}</p>
          <button @click="handleRating(rating)">Rate Now</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';

export default {
  computed: {
    ...mapState(['userRatings']),
    pendingRatings() {
      return this.userRatings.filter(rating => rating.status === 'pending');
    }
  },
  methods: {
    ...mapActions(['fetchUserRatings']),
    handleRating(rating) {
      console.log('Rating:', rating);
      // Handle rating logic here
    }
  },
  created() {
    this.fetchUserRatings();
  }
};
</script>

<style scoped>
.rating-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  padding: 20px;
}

.rating-card {
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.rating-card h2 {
  margin-top: 0;
}

.rating-card p {
  margin: 10px 0;
}

button {
  background-color: #4285F4;
  color: white;
  border: none;
  padding: 10px 20px;
  cursor: pointer;
  font-size: 16px;
  border-radius: 5px;
}

button:hover {
  background-color: #357ae8;
}
</style>
  