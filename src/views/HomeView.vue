<template>
  <div>
    <h1>Home</h1>
    <div v-if="user">
      <p>LinkedUsers: {{ linkedUsers }}</p>
      <p>Welcome, {{ (user.displayName) }}!</p>
      <img :src="user.photoURL" alt="Profile Photo" v-if="user.photoURL" />
      <div v-else>
        <p>No profile photo available</p>
      </div>
      <br>
      <p>Your email is: {{ user.email }}</p>
      <p>Your user ID is: {{ user.uid }}</p>
      <p>Last Login: {{ formattedDate(user.lastLogin) }}</p>
      <br />
      <button @click="logout">Logout</button>

      <div>
        <p>There are {{ submissions.length }} <router-link to="/submissions">submissions</router-link>.</p>
      </div>
      <button @click="toggleForm" class="toggle-button">{{ showForm ? 'Hide Form' : 'Link User' }}</button>
      <div v-if="showForm">
        <h2>Link a User for Ratings</h2>
        <form @submit.prevent="sendLinkRequest">
          <label for="email">User Email:</label>
          <input type="email" v-model="email" id="email" placeholder="Enter email" />
          <button type="submit">Link User</button>
        </form>
      </div>

      <!-- Display Pending Link Requests -->
      <section>
        <h3 v-if="myPendingLinkedUsers">Incoming Requests</h3>
        <div v-if="Array.isArray(linkedUsers) && myPendingLinkedUsers">
          <div v-for="(request, index) in linkedUsers" :key="index">
            <ol>
              <li><button @click="approveRequest(request.uid)">Approve</button>
                <!-- Check if request has displayName and email before rendering them -->
                Name: {{ safeDisplayName(request) }} - Email: ({{ safeEmail(request) }} - Status: {{ request.status }})
                <button @click="denyRequest(request.uid)" class="delete-button">Deny</button>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <div v-if="myApprovedLinkedUsers">
        <h2>Linked Users</h2>
        <ul class="linked-users-list">
          <li v-for="(linkedUser, index) in linkedUsers" :key="index" class="linked-user-item">
            <button @click="editUser(linkedUser.uid, linkedUser.email)" class="edit-button">Edit</button>
            <p><strong>Name: </strong>{{ safeDisplayName(linkedUser) }} | <strong>Email: </strong>{{ safeEmail(linkedUser)
            }}</p>
            <p>Status: {{ linkedUser.status }}</p>
            <p>Last Login: {{ formattedDate(linkedUser.lastLogin) }}</p>
            <img :src="linkedUser.photoURL" alt="Profile Photo" v-if="linkedUser.photoURL" />
            <button @click="deleteUser(linkedUser.uid)" class="delete-button">Delete</button>
          </li>
        </ul>
      </div>
      <div v-else>
        <p>No linked users</p>
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
      email: '',
      showForm: false,
    };
  },
  computed: {
    ...mapState(['user', 'submissions']),
    ...mapGetters(['linkedUsers', 'myPendingLinkedUsers', 'myApprovedLinkedUsers', 'myDeniedLinkedUsers']),

    myPendingLinkedUsers() {
      // Find the first linkedUser with a status of "pending"
      return this.linkedUsers.find(user => user.status === 'pending');
    },
    myApprovedLinkedUsers() {
      // Find the first linkedUser with a status of "approved"
      return this.linkedUsers.find(user => user.status === 'approved');
    },
    myDeniedLinkedUsers() {
      // Find the first linkedUser with a status of "denied"
      return this.linkedUsers.find(user => user.status === 'denied');
    },
  },
  methods: {
    ...mapActions(['logout', 'linkUser', 'fetchSubmissions', 'editLinkedUser', 'deleteLinkedUser', 'sendLinkRequest', 'approveLinkRequest', 'denyLinkRequest']),
    approveRequest(uid) {
      console.log('Approving request for:', uid);
      this.$store.dispatch('approveLinkRequest', uid);
    },
    denyRequest(uid) {
      // Implementation to deny request
      this.$store.dispatch('disapproveLinkRequest', uid);
    },
    safeDisplayName(request) {
      // Safely return displayName or a default value if undefined
      return request ? request.displayName || 'Default Name' : 'No Request';
    },
    safeEmail(request) {
      return request?.email || 'email-request';
    },
    formattedDate(date) {
      if (!date) {
        return 'No date available'; // Return a default message or handle as needed
      }
      return format(new Date(date.seconds * 1000), 'PPpp');
    },
    toggleForm() {
      this.showForm = !this.showForm;
    },
    async sendLinkRequest() {
      try {
        if (!this.email) {
          this.$store.dispatch('showError', 'Email is required');
          throw new Error('Email is required');
        }
        if (this.email === this.user.email) {
          this.$store.dispatch('showError', 'You cannot link yourself');
          throw new Error('You cannot link yourself');
        }
        // This now only dispatches the action to find the user and lets Vuex handle the rest
        await this.$store.dispatch('findUserByEmail', this.email);
        this.email = '';  // Clear the email field
      } catch (error) {
        console.error("Failed to process request:", error);
        this.$store.dispatch('showError', 'Failed to process request: ' + error.message);
      }
    },
    editUser(uid, email) {
      console.log('Editing user:', uid);
      console.log('Linked Users email:', email);
      const newEmail = prompt("Edit user email:", email);
      if (newEmail && newEmail !== email) {
        try {
          // this.editLinkedUser(uid, newEmail);
          this.$store.dispatch('editLinkedUser', { uid, email: newEmail });
        } catch (error) {
          console.error("Failed to edit user:", error);
          this.$store.dispatch('showError', 'Failed to edit user: ' + error.message);
        }
      }
    },
    deleteUser(uid) {
      if (confirm("Are you sure you want to delete this user?")) {
        // this.deleteLinkedUser(uid);
        this.$store.dispatch('deleteLinkedUser', uid);
      }
    }
  },
  // created() {
  //   if (this.user) {
  //     this.fetchSubmissions();
  //     this.$store.dispatch('fetchLinkedUsers');
  //   }
  // },
  mounted() {
    this.$store.dispatch('fetchLinkedUsers');
  },
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
