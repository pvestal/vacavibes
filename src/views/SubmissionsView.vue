<template>
  <div>
    <h1>User Submissions</h1>
    <div v-if="submissions.length === 0">
      <p>No submissions found.</p>
    </div>
    <div v-else>
      <div class="submission-grid">
        <div v-for="submission in submissions" :key="submission.id" class="submission-card">
          <h2>{{ submission.locationName }}</h2>
          <p><strong>Country Preference:</strong> {{ submission.countryPreference }}</p>
          <p><strong>Traveling with Kids:</strong> {{ submission.travelingWithKids ? 'Yes' : 'No' }}</p>
          <p><strong>Activity Preference:</strong> {{ submission.activityPreference }}</p>
          <p><strong>Interest Focus:</strong> {{ submission.interestFocus }}</p>
          <p><strong>Budget Level:</strong> {{ submission.budgetLevel }}</p>
          <p><strong>Travel Style:</strong> {{ submission.travelStyle }}</p>
          <p><strong>Trip Duration:</strong> {{ submission.tripDuration }}</p>
          <p><strong>Season Preference:</strong> {{ submission.seasonPreference }}</p>
          <p><strong>Special Considerations:</strong> {{ submission.specialConsiderations }}</p>
          <label>
            <input type="checkbox" v-model="submission.selectedForRating" /> Select for other user(s)
          </label>
          <div class="rating-container" v-if="submission.selectedForRating">
            <label for="submitterRating">Your Rating:</label>
            <input 
              type="number" 
              v-model.number="submission.submitterRating" 
              min="1" 
              max="5" 
              :disabled="submission.userId !== user.uid" 
            />
            <label for="raterRating">Rater's Rating:</label>
            <input 
              type="number" 
              v-model.number="submission.raterRating" 
              min="1" 
              max="5" 
              :disabled="submission.userId === user.uid" 
            />
            <button 
              @click="saveRating(submission.id)" 
              :disabled="submission.userId !== user.uid && submission.userId === user.uid"
            >
              Save Rating
            </button>
          </div>
          <div class="button-container">
            <router-link :to="{ name: 'EditSubmission', params: { id: submission.id } }" class="edit-link">Edit</router-link>
            <button @click="confirmDelete(submission.id)" class="delete-button">Delete</button>
          </div>
        </div>
      </div>
    </div>
    <button @click="toggleForm" class="toggle-button">{{ showForm ? 'Hide Form' : 'Create Submission' }}</button>
    <div v-if="showForm" class="submission-form">
      <h2>Create a New Submission</h2>
      <form @submit.prevent="handleSubmission">
        <label for="locationName">Location Name:</label>
        <input type="text" v-model="newSubmission.locationName" id="locationName" placeholder="Type location" /><br /><br />

        <label for="countryPreference">Country Preference:</label>
        <select v-model="newSubmission.countryPreference" id="countryPreference">
          <option value="">Select a Country</option>
          <option v-for="country in countries" :key="country.code" :value="country.name">{{ country.name }}</option>
        </select><br /><br />

        <label for="travelingWithKids">Traveling with Kids:</label>
        <input type="checkbox" v-model="newSubmission.travelingWithKids" id="travelingWithKids" /><br /><br />

        <label for="activityPreference">Activity Preference:</label>
        <select v-model="newSubmission.activityPreference" id="activityPreference">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select><br /><br />

        <label for="interestFocus">Interest Focus:</label>
        <select v-model="newSubmission.interestFocus" id="interestFocus">
          <option value="culture">Culture</option>
          <option value="nature">Nature</option>
          <option value="both">Both</option>
        </select><br /><br />

        <label for="budgetLevel">Budget Level:</label>
        <select v-model="newSubmission.budgetLevel" id="budgetLevel">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select><br /><br />

        <label for="travelStyle">Travel Style:</label>
        <select v-model="newSubmission.travelStyle" id="travelStyle">
          <option value="family-friendly">Family-friendly</option>
          <option value="luxury">Luxury</option>
          <option value="budget">Budget</option>
          <option value="moderate">Moderate</option>
        </select><br /><br />

        <label for="tripDuration">Trip Duration:</label>
        <select v-model="newSubmission.tripDuration" id="tripDuration">
          <option value="short">Short</option>
          <option value="medium">Medium</option>
          <option value="long">Long</option>
        </select><br /><br />

        <label for="seasonPreference">Season Preference:</label>
        <select v-model="newSubmission.seasonPreference" id="seasonPreference">
          <option value="spring">Spring</option>
          <option value="summer">Summer</option>
          <option value="autumn">Autumn</option>
          <option value="winter">Winter</option>
        </select><br /><br />

        <label for="specialConsiderations">Special Considerations:</label>
        <textarea v-model="newSubmission.specialConsiderations" id="specialConsiderations"></textarea><br /><br />

        <label for="submitterRating">Your Rating:</label>
        <input type="number" v-model.number="newSubmission.submitterRating" min="1" max="5" /><br /><br />

        <input type="submit" value="Submit" />
      </form>
    </div>
  </div>
</template>

<script>
import countries from '../assets/countries.json';
import { mapState, mapActions } from 'vuex';

export default {
  data() {
    return {
      showForm: false,
      newSubmission: {
        locationName: '',
        countryPreference: '',
        travelingWithKids: false,
        activityPreference: '',
        interestFocus: '',
        budgetLevel: '',
        travelStyle: '',
        tripDuration: '',
        seasonPreference: '',
        specialConsiderations: '',
        submitterRating: 0,
        raterRating: 0,
        selectedForRating: false
      },
      isDeleting: false,
      countries: countries
    };
  },
  computed: {
    ...mapState(['submissions', 'user'])
  },
  methods: {
    ...mapActions(['fetchSubmissions', 'submitSubmission', 'deleteSubmission', 'saveRating']),
    async handleSubmission() {
      await this.submitSubmission(this.newSubmission);
      this.showForm = false;
      this.newSubmission = {
        locationName: '',
        countryPreference: '',
        travelingWithKids: false,
        activityPreference: '',
        interestFocus: '',
        budgetLevel: '',
        travelStyle: '',
        tripDuration: '',
        seasonPreference: '',
        specialConsiderations: '',
        submitterRating: 0,
        raterRating: 0,
        selectedForRating: false
      };
      this.fetchSubmissions();
    },
    toggleForm() {
      this.showForm = !this.showForm;
    },
    confirmDelete(id) {
      if (!this.isDeleting && confirm('Are you sure you want to delete this submission?')) {
        this.isDeleting = true;
        this.deleteSubmission(id).then(() => {
          this.fetchSubmissions();
          this.isDeleting = false;
        }).catch(() => {
          this.isDeleting = false;
        });
      }
    },
    async saveRating(id) {
      const submission = this.submissions.find(sub => sub.id === id);
      if (submission.submitterRating >= 1 && submission.submitterRating <= 5 && submission.raterRating >= 1 && submission.raterRating <= 5) {
        await this.saveRating({ id, submitterRating: submission.submitterRating, raterRating: submission.raterRating });
        this.fetchSubmissions();
      } else {
        alert('Ratings must be between 1 and 5');
      }
    }
  },
  created() {
    this.fetchSubmissions();
  }
};
</script>

<style scoped>
.submission-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  padding: 20px;
}

.submission-card {
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.submission-card h2 {
  margin-top: 0;
}

.submission-card p {
  margin: 10px 0;
}

.button-container {
  display: flex;
  justify-content: space-between;
}

.edit-link,
.delete-button {
  display: inline-block;
  padding: 10px 0;
  background-color: #4285F4;
  color: white;
  text-decoration: none;
  border-radius: 5px;
  cursor: pointer;
  text-align: center;
  width: 48%;
}

.delete-button {
  background-color: #e74c3c;
  border: none;
}

.delete-button:hover {
  background-color: #c0392b;
}

.edit-link:hover {
  background-color: #357ae8;
}

.toggle-button {
  display: inline-block;
  padding: 10px 20px;
  background-color: #4285F4;
  color: white;
  text-decoration: none;
  border-radius: 5px;
  cursor: pointer;
  text-align: center;
  margin-bottom: 20px;
  width: auto;
}

.toggle-button:hover {
  background-color: #357ae8;
}

.rating-container {
  margin-top: 10px;
}

.rating-container label {
  display: block;
  margin-bottom: 5px;
}

.rating-container input {
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
}

.submission-form {
  margin-top: 20px;
}

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

input[type="submit"] {
  padding: 10px;
  border: none;
  border-radius: 5px;
  background-color: #4285F4;
  color: white;
  cursor: pointer;
}

input[type="submit"]:hover {
  background-color: #357ae8;
}
</style>
