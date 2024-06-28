<template>
    <div>
        <h3 v-if="user">{{ user.displayName }} - Submissions</h3>
        <div v-if="linkedUsers.length">
            <h4>Linked Users</h4>
            <ul>
                <li v-for="(linkedUser, index) in linkedUsers" :key="index">
                    <p><strong>Name: </strong>{{ linkedUser.displayName }} | <strong>Email: </strong>{{ linkedUser.email }} | Last Login: {{ formattedDate(linkedUser.lastLogin) }}</p>
                </li>
            </ul>
        </div>
        <p v-for="(vis, index) in submissions" :key="index">Linked User(s): {{ index }}-{{ vis.visibleTo.email }}</p>
        <p v-for="(sub) in submissions" :key="sub.id">{{ sub.id }}-{{ sub.locationName }}-{{ sub.status }}-{{
            formattedDate(sub.lastModified) }}-{{ sub.submittedBy }}-{{ sub.rating }}</p>
        <!-- Collapsible Filter Section -->
        <div class="filter-section">
            <button @click="toggleFilters" class="toggle-button" :aria-expanded="filtersVisible.toString()"
                aria-controls="filterOptions">
                Filters <span v-if="activeFiltersCount">{{ activeFiltersCount }}</span>
            </button>
            <div v-show="filtersVisible" id="filterOptions" class="filter-options">
                <!-- Filter options can be similar to the form inputs, adapted for filtering rather than submitting -->
                <h3>Filter By:</h3>
                <!-- Status Filter -->
                <select v-model="filters.filterStatus" id="filterStatus">
                    <option v-for="status in statusOptions" :key="status" :value="status">{{ status }}</option>
                </select>
                <!-- Country Preference Filter -->
                <label for="filterCountryPreference">Country:</label>
                <select v-model="filters.filterCountryPreference" id="filterCountryPreference">
                    <option v-for="country in countryOptions" :key="country" :value="country">{{ country }}</option>
                </select>
                <!-- Travel Style Filter -->
                <label for="filterTravelStyle">Travel Style:</label>
                <select v-model="filters.filterTravelStyle" id="filterTravelStyle">
                    <option v-for="style in travelStyleOptions" :key="style" :value="style">{{ style }}</option>
                </select>
                <!-- Trip Duration Filter -->
                <label for="filterTripDuration">Trip Duration:</label>
                <select v-model="filters.filterTripDuration" id="filterTripDuration">
                    <option v-for="duration in tripDurationOptions" :key="duration" :value="duration">{{ duration }}
                    </option>
                </select>
                <!-- Season Preference Filter -->
                <label for="filterSeasonPreference">Season Preference:</label>
                <select v-model="filters.filterSeasonPreference" id="filterSeasonPreference">
                    <option v-for="season in seasonOptions" :key="season" :value="season">{{ season }}</option>
                </select>

                <!-- Sorting Section -->
                <div class="filter-section">
                    <label for="sortOrder">Sort By:</label>
                    <select v-model="sortKey" @change="sortSubmissions" id="sortOrder">
                        <option value="locationName">Location Name</option>
                        <option value="status">Status</option>
                        <option value="countryPreference">Country</option>
                        <!-- <option value="rating.score">Rating</option>
                        <option value="lastModified">Last Modified</option> -->
                    </select>
                </div>
                <button @click="toggleSortOrder" class="toggle-button">Toggle Sort Order</button>
            </div>

        </div>

        <button @click="toggleForm" class="toggle-button">{{ showForm ? 'Hide Form' : 'Create Submission' }}</button>
        <div v-if="showForm" class="submission-grid">
            <h2>Create a New Submission</h2>
            <form @submit.prevent="handleSubmission">
                <label for="locationName">Location Name:</label>
                <input type="text" v-model="newSubmission.locationName" id="locationName"
                    placeholder="Type location" /><br />

                <label for="countryPreference">Country Preference:</label>
                <select v-model="newSubmission.countryPreference" id="countryPreference">
                    <option value="">Select a Country</option>
                    <option v-for="country in countries" :key="country.code" :value="country.name">{{ country.name }}
                    </option>
                </select><br />

                <label for="travelingWithKids">Traveling with Kids:</label>
                <input type="checkbox" v-model="newSubmission.travelingWithKids" id="travelingWithKids" /><br />

                <label for="activityPreference">Activity Preference:</label>
                <select v-model="newSubmission.activityPreference" id="activityPreference">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </select><br />

                <label for="interestFocus">Interest Focus:</label>
                <select v-model="newSubmission.interestFocus" id="interestFocus">
                    <option value="culture">Culture</option>
                    <option value="nature">Nature</option>
                    <option value="both">Both</option>
                </select><br />

                <label for="budgetLevel">Budget Level:</label>
                <select v-model="newSubmission.budgetLevel" id="budgetLevel">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </select><br />

                <label for="travelStyle">Travel Style:</label>
                <select v-model="newSubmission.travelStyle" id="travelStyle">
                    <option value="family-friendly">Family-friendly</option>
                    <option value="luxury">Luxury</option>
                    <option value="budget">Budget</option>
                    <option value="moderate">Moderate</option>
                </select><br />

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
                <textarea v-model="newSubmission.specialConsiderations" id="specialConsiderations"></textarea><br />

                <div class="rating-container">
                    <label for="raterRating">Rater Score:</label>
                    <input type="number" v-model.number="newSubmission.rating.raterScore" min="1" max="5"
                        :readonly="newSubmission.submittedBy.uid !== this.user.uid" id="raterRating" />

                    <label for="submitterScore">Submitter Score:</label>
                    <input type="number" v-model.number="newSubmission.rating.submitterScore" min="1" max="5"
                        :readonly="newSubmission.submittedBy.uid === this.user.uid" id="submitterScore" />
                    <br />
                </div>

                <input type="submit" value="Submit" />
            </form>
        </div>
        <div v-for="submission in filteredAndSortedSubmissions" :key="submission.id" class="submission-card">
            <p><strong>Id: </strong> {{ submission.id }}</p>
            <p><strong>Location Name: </strong> {{ submission.locationName }} <strong>Country Preference: </strong> {{
                submission.countryPreference }}</p>
            <p><strong>Status: </strong> {{ submission.status }}</p>
            <p><strong>Rater Scored: </strong>{{ submission.rating.raterScore }} |
                <strong>Submitter Scored: </strong>{{ submission.rating.submitterScore }}
            </p>
            <div class="score-badge" :style="scoreStyle(submission)">
                Score: {{ submission.rating.score }}
            </div>
            <p><strong>Submitted By:</strong> {{ submission.submittedBy.displayName }} - <strong>Last Modified:</strong> {{
                formattedDate(submission.lastModified) }}</p>
            <router-link :to="{ name: 'EditSubmission', params: { id: submission.id } }"
                class="edit-link">Edit</router-link>
            <button v-if="submission.submittedBy.uid !== null && submission.submittedBy.uid === user.uid"
                @click="confirmDelete(submission.id, user.uid)" class="delete-button">Delete</button>
        </div>
    </div>
</template>
  
<script>
import { mapState, mapActions, mapGetters } from 'vuex';
import countries from '../assets/countries.json'
import { format } from 'date-fns';

export default {
    data() {
        return {
            showForm: false,
            newSubmission: {
                activityPreference: '',
                budgetLevel: '',
                countryPreference: '',
                interestFocus: '',
                locationName: '',
                ratedBy: { uid: null, displayName: "dummy" },
                rating: { submitterScore: 0, raterScore: 0, score: 0 },
                seasonPreference: '',
                specialConsiderations: '',
                status: 'pending',
                submittedBy: { uid: null, displayName: "dummy" },
                travelStyle: '',
                travelingWithKids: false,
                tripDuration: '',
            },
            countries: countries,
            filtersVisible: false,
            filters: {
                filterStatus: '',
                filterTripDuration: '',
                filterSeasonPreference: '',
                filterTravelStyle: '',
                filterCountryPreference: '',
            },
            sortKey: 'status', // default sort key
            sortOrder: 'ascending', // default sort order

        };
    },
    computed: {
        ...mapState(['user', 'submissions', 'linkedUsers']),
        ...mapGetters(['userDisplayName', 'linkedUserIds']),
        filteredAndSortedSubmissions() {
            //console.log("Current Filters: ", this.filters);  // Debugging filter values
            let result = this.submissions.filter(submission => {
                return Object.keys(this.filters).every(filterKey => {
                    const filterValue = this.filters[filterKey];
                    if (!filterValue || filterValue === 'All') return true;
                    return submission[filterKey] === filterValue;
                });
            });
            result.sort((a, b) => {
                const propA = a[this.sortKey];
                const propB = b[this.sortKey];
                if (this.sortOrder === 'ascending') {
                    return propA < propB ? -1 : (propA > propB ? 1 : 0);
                } else {
                    return propA < propB ? 1 : (propA > propB ? -1 : 0);
                }
            });
            return result;
        },
        statusOptions() {
            return ['All', ...new Set(this.submissions.map(sub => sub.status))];
        },
        countryOptions() {
            return ['All', ...new Set(this.submissions.map(sub => sub.countryPreference))];
        },
        travelStyleOptions() {
            return ['All', ...new Set(this.submissions.map(sub => sub.travelStyle))];
        },
        tripDurationOptions() {
            return ['All', ...new Set(this.submissions.map(sub => sub.tripDuration))];
        },
        seasonOptions() {
            return ['All', ...new Set(this.submissions.map(sub => sub.seasonPreference))];
        },
        activeFiltersCount() {
            return Object.keys(this.filters).reduce((count, key) => {
                return this.filters[key] && this.filters[key] !== 'All' ? count + 1 : count;
            }, 0);
        },
    },
    methods: {
        ...mapActions(['submissions', 'fetchSubmissions', 'addSubmission', 'deleteSubmission', 'fetchLinkedUsers']),
        getNestedProperty(object, path) {
            return path.split('.').reduce((obj, key) => obj && obj[key], object);
        },
        toggleSortOrder() {
            this.sortOrder = this.sortOrder === 'ascending' ? 'descending' : 'ascending';
        },
        scoreStyle(submission) {
            let color = '#4285F4'; // default blue
            if (submission.rating.score >= 3.5) color = 'green';
            else if (submission.rating.score <= 3) color = 'red';
            return { backgroundColor: color, color: 'white', padding: '5px 10px', borderRadius: '5px' };
        },
        formattedDate(timestamp) {
            if (!timestamp || !timestamp.seconds) {
                return 'N/A';
            }
            // Use format function directly here
            return format(new Date(timestamp.seconds * 1000), "PPpp");
        },
        toggleFilters() {
            this.filtersVisible = !this.filtersVisible;
        },
        validateSubmission() {
            // Check each part of the path to ensure it exists before accessing deeper properties
            console.log("location: ", this.newSubmission.locationName)
            if (!this.newSubmission.locationName) {
                alert("Please fill out the location name.");
                return false;
            }
            console.log("submitter rating: ", this.newSubmission.rating.submitterScore)
            if (!this.newSubmission.rating.submitterScore) {
                alert("Please fill out your the rating.");
                return false;
            }
            console.log("checking for linkedUsers before submitting", this.linkedUserIds)
            if (!this.linkedUserIds) {
                console.log("didn't find linkedUserIds available")
                return false;
            }
            console.log("checking for active user before submitting", this.linkedUserIds)
            if (!this.user) {
                console.log("didn't find user available")
                return false;
            }
            // Add additional checks if there are more fields
            return true;
        },
        async handleSubmission() {
            if (!this.validateSubmission()) return;
            try {
                this.newSubmission.submittedBy = { uid: this.user.uid, displayName: this.user.displayName };
                const submissionId = await this.$store.dispatch('addSubmission', this.newSubmission);
                if (submissionId) {
                    const userIds = await this.$store.dispatch('fetchLinkedUsers');
                    console.log("userIds: ", userIds)
                    this.resetForms();
                    this.fetchSubmissions(); // Assuming fetchSubmissions requires userIds
                } else {
                    throw new Error('Failed to retrieve submission ID');
                }
            } catch (error) {
                console.error("Failed to submit:", error);
                this.$store.dispatch('showError', 'An error occurred: ' + error.message);
            }
        },
        resetForms() {
            this.showForm = false;
            this.newSubmission = { ...this.newSubmission.constructor() };
        },
        toggleForm() {
            this.showForm = !this.showForm;
        },
        getUserDisplayName(userId) {
            console.log("Fetching display name for user ID:", userId); // Debugging
            const displayName = this.userDisplayName(userId);
            console.log("Obtained display name:", displayName); // Debugging
            return displayName;
        },
        async confirmDelete(submissionId, uid) {
            const submission = this.submissions.find(sub => sub.id === submissionId);
            if (!submission) {
                alert("Submission not found.");
                return;
            }
            if (this.user.uid !== submission.submittedBy.uid) {
                alert("Sorry, you can only delete your own submissions.");
                return;
            }
            if (confirm("Are you sure you want to delete this submission?")) {
                await this.$store.dispatch('deleteSubmission', { id: submissionId, userId: uid });
                const userIds = await this.$store.dispatch('fetchLinkedUsers');
                this.fetchSubmissions(userIds); // Assuming fetchSubmissions requires userIds
                this.resetForms();
            }
            else {
                throw new Error('Failed to delete');
            }
        }
    },
    created() {
        this.fetchLinkedUsers()
            .then(() => {
                this.fetchSubmissions()
            })
            .catch(error => {
                // Handle errors, such as displaying a notification or logging to the console
                console.error("Error fetching linked users:", error);
                this.$store.dispatch('showError', 'An error occurred: ' + error.message);
            });
    },

};

</script>
<style scoped>
.submission-card {
    position: relative;
    background-color: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
    /* Add space between cards */
}

.score-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    background-color: var(--score-color, #4285F4);
    color: white;
    padding: 5px 10px;
    border-radius: 15px;
    font-size: 0.9em;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.score-badge:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.4);
}

@keyframes fadeIn {
    to {
        opacity: 1;
    }
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
    width: auto;
}

.toggle-button:hover {
    background-color: #357ae8;
}

.submission-form {
    padding: 20px;
    background-color: #fff;
    border: 1px solid #ccc;
    border-radius: 8px;
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
    width: 100%;
    /* Make inputs full width */
}

input[type="submit"] {
    padding: 10px;
    border: none;
    border-radius: 5px;
    background-color: #4285F4;
    color: white;
    cursor: pointer;
    width: 100%;
}

input[type="submit"]:hover {
    background-color: #357ae8;
}

.filter-section {
    display: flex;
    flex-direction: column;
    padding: 20px;
    background-color: #f4f4f4;
    border-radius: 8px;
}

.filter-section label {
    font-weight: bold;
    margin-bottom: 5px;
    color: #333;
}

.filter-section select {
    padding: 10px;
    margin-bottom: 20px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: white;
    width: 100%;
    /* Full width for better mobile usability */
}

/* Media query for mobile screens */
@media (max-width: 768px) {

    .submission-form,
    .submission-card,
    .filter-section {
        padding: 10px;
    }

    .toggle-button,
    .edit-link,
    .delete-button,
    input[type="submit"] {
        width: 100%;
        /* Full width buttons */
    }

    .button-container {
        flex-direction: column;
    }
}</style>