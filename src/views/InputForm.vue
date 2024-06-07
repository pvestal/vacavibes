<template>
  <div>
    <h1>User Preferences</h1>
    <form @submit.prevent="handleSubmitPreferences">
      <label for="locationName">Location Name:</label>
      <input type="text" v-model="preferences.locationName" id="locationName" placeholder="Type location" /><br /><br />

      <label for="countryPreference">Country Preference:</label>
      <select v-model="preferences.countryPreference" id="countryPreference">
        <option value="">Select a Country</option>
        <option value="mexico">Mexico</option>
        <option value="usa">USA</option>
        <option value="europe">Europe</option>
        <option value="carribean">Carribean</option>
        <option value="costaRica">Costa Rica</option>
      </select><br /><br />

      <label for="travelingWithKids">Traveling with Kids:</label>
      <input type="checkbox" v-model="preferences.travelingWithKids" id="travelingWithKids" /><br /><br />

      <label for="activityPreference">Activity Preference:</label>
      <select v-model="preferences.activityPreference" id="activityPreference">
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select><br /><br />

      <label for="interestFocus">Interest Focus:</label>
      <select v-model="preferences.interestFocus" id="interestFocus">
        <option value="culture">Culture</option>
        <option value="nature">Nature</option>
        <option value="both">Both</option>
      </select><br /><br />

      <label for="budgetLevel">Budget Level:</label>
      <select v-model="preferences.budgetLevel" id="budgetLevel">
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select><br /><br />

      <label for="travelStyle">Travel Style:</label>
      <select v-model="preferences.travelStyle" id="travelStyle">
        <option value="family-friendly">Family-friendly</option>
        <option value="luxury">Luxury</option>
        <option value="budget">Budget</option>
        <option value="moderate">Moderate</option>
      </select><br /><br />

      <label for="tripDuration">Trip Duration:</label>
      <select v-model="preferences.tripDuration" id="tripDuration">
        <option value="short">Short</option>
        <option value="medium">Medium</option>
        <option value="long">Long</option>
      </select><br /><br />

      <label for="seasonPreference">Season Preference:</label>
      <select v-model="preferences.seasonPreference" id="seasonPreference">
        <option value="spring">Spring</option>
        <option value="summer">Summer</option>
        <option value="autumn">Autumn</option>
        <option value="winter">Winter</option>
      </select><br /><br />

      <label for="specialConsiderations">Special Considerations:</label>
      <textarea v-model="preferences.specialConsiderations" id="specialConsiderations"></textarea><br /><br />

      <input type="submit" value="Submit Preferences" />
      <button @click="clearPreferences">Clear Preferences</button>
    </form>
  </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';

export default {
  data() {
    return {
      preferences: {
        locationName: '',
        countryPreference: '',
        travelingWithKids: false,
        activityPreference: '',
        interestFocus: '',
        budgetLevel: '',
        travelStyle: '',
        tripDuration: '',
        seasonPreference: '',
        specialConsiderations: ''
      }
    };
  },
  computed: {
    ...mapState(['user'])
  },
  methods: {
    ...mapActions(['submitPreferences', 'clearPreferences']),
    async handleSubmitPreferences() {  // Renamed local method to avoid conflict
      await this.submitPreferences(this.preferences);
    },
    clearPreferences() {
      this.clearPreferences();  // Ensure the correct method is called here
    }
  }
};
</script>

<style scoped>
button {
  margin-top: 10px;
}
</style>


  