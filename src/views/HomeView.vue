<template>
  <div>
    <h1>Home</h1>
    <div v-if="user">
      <p>Welcome, {{ user.displayName }}!</p>
      <button @click="logout">Logout</button>

      <div v-if="pendingRatings.length">
        <h2>Pending Ratings from Other Users</h2>
        <p>You have {{ pendingRatings.length }} <router-link to="/pending-ratings">pending ratings</router-link>.</p>
      </div>
      <div v-else>
        <p>No pending ratings from other users.</p>
      </div>

      <div>
        <p>You have {{ submissions.length }} <router-link to="/submissions">submissions</router-link>.</p>
      </div>

      <div v-if="recommendations.length">
        <p>You have {{ recommendations.length }} <router-link to="/recommendations">recommendations</router-link>.</p>
      </div>

      <div>
        <h2>Link a User for Ratings</h2>
        <form @submit.prevent="submitLinkUser">
          <label for="email">User Email:</label>
          <input type="email" v-model="email" id="email" placeholder="Enter email" />
          <button type="submit">Link User</button>
        </form>
      </div>

      <div v-if="linkedUsers.length">
        <h2>Linked Users</h2>
        <ul class="linked-users-list">
          <li v-for="(linkedUser, index) in linkedUsers" :key="index" class="linked-user-item">
            <button @click="editUser(index)" class="edit-button">Edit</button>
            <span class="linked-user-email">{{ linkedUser }}</span>
            <button @click="deleteUser(index)" class="delete-button">Delete</button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default {
  data() {
    return {
      email: ''
    };
  },
  computed: {
    ...mapState(['user', 'submissions', 'recommendations', 'userRatings', 'linkedUsers']),
    pendingRatings() {
      return this.userRatings.filter(rating => rating.status === 'pending');
    }
  },
  methods: {
    ...mapActions(['logout', 'linkUser', 'fetchSubmissions', 'fetchRecommendations', 'editLinkedUser', 'deleteLinkedUser']),
    
    async submitLinkUser() {
      if (this.email) {
        try {
          await this.linkUserAction(this.email);
          const functions = getFunctions();
          const sendRatingEmail = httpsCallable(functions, 'sendRatingEmail');
          const sendConfirmationEmail = httpsCallable(functions, 'sendConfirmationEmail');
          const result = await sendRatingEmail({ email: this.email, submissionId: 'your-submission-id' });
          
          if (result.data.success) {
            await sendConfirmationEmail({ linkedUserEmail: this.email, userEmail: this.user.email, displayName: this.user.displayName });
            this.email = '';
            alert('Emails sent successfully!');
          } else {
            console.error('Error sending email:', result.data.error);
            alert('Failed to send email.');
          }
        } catch (error) {
          console.error('Error sending email:', error);
          alert('Failed to send email.');
        }
      }
    },

    async linkUserAction(email) {
      try {
        await this.linkUser(email);
      } catch (error) {
        console.error('Error linking user:', error);
      }
    },

    editUser(index) {
      const newEmail = prompt("Edit user email:", this.linkedUsers[index]);
      if (newEmail) {
        this.editLinkedUser({ index, newEmail });
      }
    },

    deleteUser(index) {
      if (confirm("Are you sure you want to delete this user?")) {
        this.deleteLinkedUser(index);
      }
    }
  },
  created() {
    if (this.user) {
      this.fetchSubmissions();
      this.fetchRecommendations();
    }
  }
};
</script>

<style scoped>
button {
  background-color: #4285F4;
  color: white;
  border: none;
  padding: 10px 20px;
  cursor: pointer;
  font-size: 16px;
}

form {
  display: flex;
  flex-direction: column;
}

input[type="text"],
input[type="number"],
input[type="email"],
textarea,
select {
  margin-bottom: 10px;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

input[type="submit"],
button {
  padding: 10px;
  border: none;
  border-radius: 5px;
  background-color: #4285F4;
  color: white;
  cursor: pointer;
}

input[type="submit"]:hover,
button:hover {
  background-color: #357ae8;
}

.linked-users-list {
  list-style: none;
  padding: 0;
}

.linked-user-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.linked-user-email {
  flex-grow: 1;
  padding: 0 10px;
}

.edit-button,
.delete-button {
  padding: 10px;
  border: none;
  border-radius: 5px;
  background-color: #4285F4;
  color: white;
  cursor: pointer;
}

.delete-button {
  background-color: #e74c3c;
}

.edit-button:hover {
  background-color: #357ae8;
}

.delete-button:hover {
  background-color: #c0392b;
}
</style>
