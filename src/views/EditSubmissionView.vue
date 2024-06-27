<template>
  <div>
    <h1>Edit Submission</h1>
    <div v-if="submission">
      <form @submit.prevent="handleSubmit">
        <label for="locationName">Location Name:</label>
        <input type="text" v-model="submission.locationName" id="locationName" placeholder="Type location" /><br /><br />

        <label for="countryPreference">Country Preference:</label>
        <select v-model="submission.countryPreference" id="countryPreference">
          <option value="">Select a Country</option>
          <option v-for="country in countries" :key="country.code" :value="country.name">{{ country.name }}</option>
        </select><br /><br />

        <label for="travelingWithKids">Traveling with Kids:</label>
        <input type="checkbox" v-model="submission.travelingWithKids" id="travelingWithKids" /><br /><br />

        <label for="activityPreference">Activity Preference:</label>
        <select v-model="submission.activityPreference" id="activityPreference">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select><br /><br />

        <label for="interestFocus">Interest Focus:</label>
        <select v-model="submission.interestFocus" id="interestFocus">
          <option value="culture">Culture</option>
          <option value="nature">Nature</option>
          <option value="both">Both</option>
        </select><br /><br />

        <label for="budgetLevel">Budget Level:</label>
        <select v-model="submission.budgetLevel" id="budgetLevel">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select><br /><br />

        <label for="travelStyle">Travel Style:</label>
        <select v-model="submission.travelStyle" id="travelStyle">
          <option value="family-friendly">Family-friendly</option>
          <option value="luxury">Luxury</option>
          <option value="budget">Budget</option>
          <option value="moderate">Moderate</option>
        </select><br /><br />

        <label for="tripDuration">Trip Duration:</label>
        <select v-model="submission.tripDuration" id="tripDuration">
          <option value="short">Short</option>
          <option value="medium">Medium</option>
          <option value="long">Long</option>
        </select><br /><br />

        <label for="seasonPreference">Season Preference:</label>
        <select v-model="submission.seasonPreference" id="seasonPreference">
          <option value="spring">Spring</option>
          <option value="summer">Summer</option>
          <option value="autumn">Autumn</option>
          <option value="winter">Winter</option>
        </select><br /><br />

        <label for="specialConsiderations">Special Considerations:</label>
        <textarea v-model="submission.specialConsiderations" id="specialConsiderations"></textarea><br /><br />
        <br />
        <div class="rating-container">
                    <label for="raterRating">Rater Score:</label>
                    <input type="number" v-model.number="submission.rating.raterScore" min="1" max="5" 
                        :readonly="submission.submittedBy.uid !== this.user.uid" id="raterRating" />

                    <label for="submitterScore">Submitter Score:</label>
                    <input type="number" v-model.number="submission.rating.submitterScore" min="1" max="5" 
                        :readonly="submission.submittedBy.uid === this.user.uid" id="submitterScore" /> 
                    <br />
                </div>
        <div class="button-container">
          <input type="submit" value="Save" />
          <button @click="cancelEdit">Cancel</button>
        </div>
      </form>
    </div>
    <div v-else>
      <p>Loading...</p>
    </div>
  </div>
</template>

<script>
import countries from '../assets/countries.json'; // Make sure the path to countries.json is correct
import { mapState, mapActions } from 'vuex';

export default {
  data() {
    return {
      submission: null,
      countries: countries
    };
  },
  computed: {
    ...mapState(['submissions', 'user'])
  },
  methods: {
    ...mapActions(['fetchSubmissions', 'updateSubmission']),
    async handleSubmit() {
      await this.updateSubmission(this.submission);
      this.$router.push({ name: 'Submissions' });
    },
    loadSubmission() {
      const id = this.$route.params.id;
      this.submission = this.submissions.find(sub => sub.id === id) || null;
    },
    cancelEdit() {
      this.$router.push({ name: 'Submissions' });
    }
  },
  async created() {
    await this.fetchSubmissions();
    this.loadSubmission();
  },
  watch: {
    $route() {
      this.loadSubmission();
    }
  }
};
</script>

<style scoped>
form {
  display: flex;
  flex-direction: column;
}

input[type="text"],
textarea,
select {
  margin-bottom: 10px;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.button-container {
  display: flex;
  justify-content: space-between;
}

input[type="submit"],
button {
  padding: 10px;
  border: none;
  border-radius: 5px;
  background-color: #4285F4;
  color: white;
  cursor: pointer;
  width: 48%;
}

input[type="submit"]:hover,
button:hover {
  background-color: #357ae8;
}
</style>
