<template>
  <div>
    <h1>Recommendations</h1>
    <div v-if="recommendations.length === 0">
      <p>No recommendations available.</p>
    </div>
    <div v-else>
      <div class="recommendation-list">
        <div v-for="recommendation in recommendations" :key="recommendation.id" class="recommendation-card">
          <h2>{{ recommendation.locationName }}</h2>
          <p><strong>Country:</strong> {{ recommendation.country }}</p>
          <p><strong>Submitted by:</strong> {{ recommendation.submittedBy }}</p>
          <p><strong>Status:</strong> {{ recommendation.status }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';

export default {
  computed: {
    ...mapState(['recommendations'])
  },
  methods: {
    ...mapActions(['fetchRecommendations'])
  },
  created() {
    this.fetchRecommendations();
  }
};
</script>

<style scoped>
.recommendation-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  padding: 20px;
}

.recommendation-card {
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.recommendation-card h2 {
  margin-top: 0;
}

.recommendation-card p {
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