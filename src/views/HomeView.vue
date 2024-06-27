<template>
  <div>
    <h1>Home</h1>
    <div v-if="user">
      <p>Welcome, {{ user.displayName }}!</p>
      <img :src="user.photoURL" alt="Profile Photo" v-if="user.photoURL" />
      <div v-else>
        <p>No profile photo available</p>
      </div>
      <br>
      <p>Your email is: {{ user.email }}</p>
      <p>Your user ID is: {{ user.uid }}</p>
      <p>Last Login: {{ formattedDate(user.lastLogin) }}</p>
      <br/>
      <button @click="logout">Logout</button>

      <div>
        <p>There are {{ submissionsCount }} <router-link to="/submissions">submissions</router-link>.</p>
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
import { mapState, mapActions, mapGetters } from 'vuex';
import { format } from 'date-fns';

export default {
  data() {
    return {
      email: ''
    };
  },
  computed: {
    ...mapState(['user', 'submissions', 'linkedUsers']),
    ...mapGetters(['submissionsCount'])
  },
  methods: {
    ...mapActions(['logout', 'linkUser', 'fetchSubmissions', 'editLinkedUser', 'deleteLinkedUser']),
    formattedDate(timestamp) {
      if (!timestamp || !timestamp.seconds) {
        return 'N/A';
      }
      // Use format function directly here
      return format(new Date(timestamp.seconds * 1000), "PPpp");
    },
    async submitLinkUser() {
      if (this.email) {
        try {
          await this.linkUser(this.email);
        } catch (error) {
          console.error('Error linking user:', error);
          this.$refs.errorMessageBoard.showError('An error occurred: ' + error.message);
        }
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
    // if (this.user) {
    //   this.fetchSubmissions();
    // }
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
