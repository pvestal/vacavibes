import { createStore } from "vuex";
import { auth, googleProvider, signInWithPopup, db } from "../firebaseConfig";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDoc,
  Timestamp,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import router from "../router";

export default createStore({
  state: {
    user: null,
    errorMessage: "",
    errorVisible: false,
    submissions: [],
    linkedUsers: [],
  },
  mutations: {
    SET_USER(state, user) {
      state.user = user;
    },
    CLEAR_USER(state) {
      state.user = null;
    },
    SET_ERROR(state, message) {
      state.errorMessage = message;
      state.errorVisible = true;
    },
    CLEAR_ERROR(state) {
      state.errorMessage = "";
      state.errorVisible = false;
    },
    SET_SUBMISSIONS(state, submissions) {
      state.submissions = submissions;
    },
    ADD_LINK_REQUEST(state, request) {
      state.user.linkRequests.push(request);
    },
    REMOVE_LINK_REQUEST(state, uid) {
      state.user.linkRequests = state.user.linkRequests.filter(
        (req) => req.uid !== uid
      );
    },
    ADD_SENT_LINK_REQUEST(state, request) {
      state.user.sentLinkRequests.push(request);
    },
    UPDATE_LINK_REQUEST_STATUS(state, { uid, status }) {
      let request = state.user.linkRequests.find((req) => req.uid === uid);
      if (request) request.status = status;
    },
    SET_LINKED_USERS(state, linkedUsers) {
      state.linkedUsers = linkedUsers;
    },
    ADD_LINKED_USER(state, user) {
      state.linkedUsers.push(user);
    },
    UPDATE_LINKED_USER(state, { index, user }) {
      state.linkedUsers.splice(index, 1, user);
    },
    REMOVE_LINKED_USER(state, index) {
      state.linkedUsers.splice(index, 1);
    },
    ADD_SUBMISSION(state, submission) {
      state.submissions.push(submission);
    },
    UPDATE_SUBMISSION(state, updatedSubmission) {
      const index = state.submissions.findIndex(
        (submission) => submission.id === updatedSubmission.id
      );
      if (index !== -1) {
        state.submissions.splice(index, 1, updatedSubmission);
      }
    },
    REMOVE_SUBMISSION(state, id) {
      state.submissions = state.submissions.filter(
        (submission) => submission.id !== id
      );
    },
  },
  actions: {
    showError({ commit }, message) {
      console.error("Error:", message);
      commit("SET_ERROR", message);
      setTimeout(() => {
        commit("CLEAR_ERROR");
      }, 3000); // Hide the error message after 3 seconds
    },
    clearError({ commit }) {
      commit("CLEAR_ERROR");
    },
    calculateAverage(submitterScore, raterScore) {
      submitterScore = submitterScore || 0;
      raterScore = raterScore || 0;
      // Only average the scores if both are provided
      if (submitterScore > 0 && raterScore > 0) {
        return (submitterScore + raterScore) / 2;
      }
      return submitterScore > 0 ? submitterScore : raterScore;
    },
    async sendLinkRequest({ commit, state }, { uid, displayName }) {
      if (!state.user) throw new Error("No authenticated user found.");

      const newRequest = {
        uid,
        displayName,
        status: "pending",
      };

      // Update Firestore to include this new link request in both the sender and receiver's documents
      const senderRef = doc(db, "users", state.user.uid);
      const receiverRef = doc(db, "users", uid);

      try {
        await updateDoc(senderRef, {
          sentLinkRequests: arrayUnion(newRequest),
        });
        await updateDoc(receiverRef, {
          linkRequests: arrayUnion({
            ...newRequest,
            uid: state.user.uid,
            displayName: state.user.displayName,
          }),
        });
        commit("ADD_SENT_LINK_REQUEST", newRequest);
      } catch (error) {
        console.error("Error sending link request:", error);
        throw error;
      }
    },
    async findUserByEmail(email) {
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0]; // Assuming one match for the email
          return {
            uid: userDoc.id,
            displayName: userDoc.data().displayName,
          };
        } else {
          throw new Error("No user found with the provided email");
        }
      } catch (error) {
        console.error("Error finding user by email:", error);
        throw new Error("Failed to find user by email: " + error.message);
      }
    },
    async approveLinkRequest({ commit, state }, { uid, displayName }) {
      // Update the status in Firestore and local state
      const userDocRef = doc(db, "users", state.user.uid);
      await updateDoc(userDocRef, {
        linkedUsers: arrayUnion({ uid, displayName }),
        linkRequests: arrayRemove({ uid, displayName, status: "pending" }),
      });
      commit("UPDATE_LINK_REQUEST_STATUS", { uid, status: "approved" });
      commit("ADD_LINKED_USER", { uid, displayName });
      commit("REMOVE_LINK_REQUEST", uid);
    },

    async denyLinkRequest({ commit, state }, { uid }) {
      // Remove the request from Firestore and local state
      const userDocRef = doc(db, "users", state.user.uid);
      await updateDoc(userDocRef, {
        linkRequests: arrayRemove({ uid }),
      });
      commit("REMOVE_LINK_REQUEST", uid);
    },
    async login({ commit }) {
      try {
        const result = await signInWithPopup(auth, googleProvider); // Sign in with Google popup.
        const userRef = doc(db, "users", result.user.uid); // Reference to the user document.

        // Check if user exists and perform necessary actions
        const userDoc = await getDoc(userRef);
        const userData = {
          uid: result.user.uid,
          displayName: result.user.displayName || "No Name",
          email: result.user.email || "No Email",
          photoURL: result.user.photoURL || "default-url",
          lastLogin: Timestamp.now(),
        };

        if (!userDoc.exists()) {
          // User does not exist, set additional creation data
          userData.createdAt = Timestamp.now();
        }

        await setDoc(userRef, userData, { merge: true }); // Merges data with existing or creates new if not present.
        commit("SET_USER", userData);
        router.push({ name: "Home" });
      } catch (error) {
        console.error("Error logging in:", error);
        this.$store.dispatch(
          "showError",
          "An error occurred from login: " + error.message
        );
      }
    },
    async logout({ commit }) {
      try {
        await auth.signOut();
        commit("CLEAR_USER");
        router.push({ name: "Login" });
      } catch (error) {
        console.error("Error logging out:", error);
        this.$store.dispatch(
          "showError",
          "An error occurred fro, logout: " + error.message
        );
      }
    },
    fetchUser({ commit }) {
      return new Promise((resolve, reject) => {
        auth.onAuthStateChanged(async (user) => {
          if (user) {
            console.log("User logged in:", user.displayName);
            commit("SET_USER", user);
            // await dispatch('fetchSubmissions');
            // await dispatch('fetchRecommendations');
            // await dispatch('fetchUserRatings');
            // await dispatch('fetchLinkedUsers');
            resolve(user);
          } else {
            console.log("No user logged in");
            commit("CLEAR_USER");
            resolve(null);
          }
        }, reject);
      });
    },
    // async fetchSubmissions({ state, commit }) {
    //   try {
    //     // Extract the current user's ID and linked user IDs from the state
    //     const currentUserID = state.user.uid; // assuming the user object is stored under user.user
    //     const linkedUserIDs = state.linkedUsers.map((user) => user.uid); // assuming linkedUsers stores an array of user objects

    //     // Combine both arrays: the current user and linked users
    //     let userIds = [currentUserID, ...linkedUserIDs];

    //     console.log("userIds: ", userIds);

    //     // Limiting the array to a manageable number for Firestore queries
    //     if (userIds.length > 10) {
    //       console.error(
    //         "Too many user IDs for a single 'in' query. Consider splitting the query."
    //       );
    //       return; // Optionally split the query or handle this case differently
    //     }

    //     const submissionsQuery = query(
    //       collection(db, "submissions"),
    //       where("submittedBy", "in", userIds)
    //     );

    //     // Execute the query
    //     const querySnapshot = await getDocs(submissionsQuery);
    //     const submissions = querySnapshot.docs.map((doc) => ({
    //       id: doc.id,
    //       ...doc.data(),
    //     }));

    //     // Committing the fetched data to the Vuex store
    //     commit("SET_SUBMISSIONS", submissions);
    //   } catch (error) {
    //     console.error("Error fetching submissions:", error);
    //   }
    // },
    // async fetchSubmissions({ state, commit }) {
    //   console.log("Fetching submissions with user details");
    //   try {
    //     //Ensure there is a user object and it has the necessary properties
    //     // if (!state.user || !state.user.linkedUsers) {
    //     //   console.error("User data is not available or improperly structured");
    //     //   return;
    //     // }

    //     // Extract the current user's ID and linked user IDs from the user module's state
    //     const currentUserID = state.user.uid; // Adjust if your state structure is different
    //     console.log("Current User ID: ", currentUserID);

    //     const linkedUserIDs = state.linkedUsers.map((user) => user.uid); // Assumes linkedUsers is an array of user objects
    //     console.log("Linked User IDs: ", linkedUserIDs);

    //     // Combine both current user ID and linked user IDs for querying
    //     let userIds = [currentUserID, ...linkedUserIDs];

    //     console.log("userIds: ", userIds);
    //     // Limiting the array to a manageable number for Firestore queries
    //     if (userIds.length > 10) {
    //       console.error(
    //         "Too many user IDs for a single 'in' query. Consider splitting the query."
    //       );
    //       return; // Optionally split the query or handle this case differently
    //     }

    //     const submissionsQuery = query(
    //       collection(db, "submissions"),
    //       where("submittedBy", "in", userIds)
    //     );
    //     console.log("submissionsQuery: ", submissionsQuery);
    //     // Execute the query
    //     const querySnapshot = await getDocs(submissionsQuery);
    //     const submissions = querySnapshot.docs.map((doc) => ({
    //       id: doc.id,
    //       ...doc.data(),
    //     }));
    //     console.log("submissions: ", submissions);
    //     // Committing the fetched data to the Vuex store
    //     commit("SET_SUBMISSIONS", submissions);
    //   } catch (error) {
    //     console.error("Error fetching submissions with user details:", error);
    //     this.$store.dispatch(
    //       "showError",
    //       "An error occurred: " + error.message
    //     );
    //   }
    // },

    async fetchSubmissions({ commit }) {
      const collectionRef = collection(db, "submissions");
      try {
        const querySnapshot = await getDocs(collectionRef);
        const documents = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log(documents);
        commit("SET_SUBMISSIONS", documents);
      } catch (error) {
        console.error("Error getting documents:", error.message);
        this.$store.dispatch(
          "showError",
          "An error occurred fetching submissions: " + error.message
        );
      }
    },
    async fetchLinkedUsers({ state, commit }) {
      if (!state.user) return Promise.resolve([]); // Return an empty array if there is no user logged in
      try {
        const docSnap = await getDoc(doc(db, "users", state.user.uid));
        if (docSnap.exists()) {
          const userData = docSnap.data();
          commit("SET_LINKED_USERS", userData.linkedUsers || []);
          return userData.linkedUsers.map((user) => user.uid); // Return an array of user IDs
        } else {
          throw new Error("No user data found.");
        }
      } catch (error) {
        console.error("Failed to fetch linked users:", error);
        this.$store.dispatch(
          "showError",
          "An error occurred fetching linked Users: " + error.message
        );
        throw error; // Ensure errors are propagated
      }
    },
    async fetchUserDetails({ commit }, userId) {
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userDetails = userDoc.data();
        commit("UPDATE_USER_DETAILS", userDetails);
        return userDetails;
      } else {
        console.error("User not found");
        return null;
      }
    },
    async linkUser({ state, commit }, email) {
      if (!state.user) throw new Error("No authenticated user found.");
      try {
        const usersQuery = query(
          collection(db, "users"),
          where("email", "==", email)
        );
        const querySnapshot = await getDocs(usersQuery);
        if (querySnapshot.empty)
          throw new Error("User with the provided email does not exist.");

        const userToLinkDoc = querySnapshot.docs[0];
        const linkedUser = {
          uid: userToLinkDoc.id,
          email: userToLinkDoc.data().email,
          displayName: userToLinkDoc.data().displayName || "Unknown",
          photoURL: userToLinkDoc.data().photoURL || "photo-url",
        };

        if (state.linkedUsers.some((user) => user.uid === linkedUser.uid)) {
          throw new Error("User is already linked");
        }

        await updateDoc(doc(db, "users", state.user.uid), {
          linkedUsers: arrayUnion(linkedUser),
        });
        commit("ADD_LINKED_USER", linkedUser);
      } catch (error) {
        console.error("Error linking user:", error);
        this.$store.dispatch(
          "showError",
          "An error occurred for linkUser: " + error.message
        );
      }
    },
    async deleteLinkedUser({ commit }, { userId, linkedUserId }) {
      try {
        // Correct Firestore path assumes linkedUsers are in a sub-collection or need proper array handling if in a field
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, {
          linkedUsers: arrayRemove({ uid: linkedUserId }), // Correctly removing from an array field
        });
        commit("REMOVE_LINKED_USER", linkedUserId);
      } catch (error) {
        console.error("Error deleting linked user:", error);
        this.$store.dispatch(
          "showError",
          "An error occurred: " + error.message
        );
      }
    },
    async editLinkedUser({ commit }, { index, newEmail }) {
      try {
        if (auth.currentUser) {
          const userDocRef = doc(db, "users", auth.currentUser.uid);
          const userSnapshot = await getDoc(userDocRef);
          const userData = userSnapshot.exists() ? userSnapshot.data() : {};
          const linkedUsers = [...userData.linkedUsers];
          linkedUsers[index] = newEmail;

          await updateDoc(userDocRef, { linkedUsers });
          commit("updateLinkedUser", { index, newEmail });
        }
      } catch (error) {
        console.error("Error editing linked user:", error);
      }
    },
    async addSubmission({ commit, dispatch }, submissionData) {
      // First, fetch linked users to ensure the 'visibleTo' field is populated correctly
      await dispatch("fetchLinkedUsers");
      if (
        !submissionData.submittedBy.uid ||
        !submissionData.rating.submitterScore
      ) {
        throw new Error(
          "No authenticated user found or fields are incomplete."
        );
      }

      // Now, access the state to get the linked users
      const linkedUsers = this.state.linkedUsers;
      const visibleTo = linkedUsers.map((user) => user);

      const newSubmission = {
        ...submissionData,
        visibleTo: visibleTo,
        createdAt: Timestamp.now(),
        lastupdated: Timestamp.now(),
      };

      try {
        const docRef = await addDoc(
          collection(db, "submissions"),
          newSubmission
        );
        commit("ADD_SUBMISSION", { id: docRef.id, ...newSubmission });
        return docRef.id;
      } catch (error) {
        console.error("Error adding submission:", error);
        this.$store.dispatch(
          "showError",
          "An error occurred: " + error.message
        );
        throw error;
      }
    },
    async updateSubmission({ commit, dispatch }, updatedSubmission) {
      try {
        if (!auth.currentUser) {
          throw new Error("No authenticated user available");
        }

        const submissionDocRef = doc(db, "submissions", updatedSubmission.id);

        // Determine if the currentUser is the one who submitted the submission
        if (auth.currentUser.uid === updatedSubmission.submittedBy.uid) {
          // Current user is the submitter, update submitterScore
          await updateDoc(submissionDocRef, {
            ...updatedSubmission,
            "rating.submitterScore": updatedSubmission.rating.submitterScore,
            lastModified: Timestamp.now(),
          });
        } else {
          // Current user is not the submitter, assign as ratedBy and update raterScore
          await updateDoc(submissionDocRef, {
            ratedBy: updatedSubmission.ratedBy,
            "rating.raterScore": updatedSubmission.rating.raterScore,
            lastModified: Timestamp.now(),
            status: "reviewed",
          });
        }

        // Fetch the updated document to calculate the average
        const updatedDoc = await getDoc(submissionDocRef);
        const data = updatedDoc.data();
        const averageScore = await dispatch(
          "calculateAverage",
          data.rating.submitterScore,
          data.rating.raterScore
        );
        //async tasks calculateAverage(data.rating.submitterScore, data.rating.raterScore);

        // Optionally update the document with the average score
        await updateDoc(submissionDocRef, {
          "rating.averageScore": averageScore,
        });

        // Commit the updated data to the Vuex store
        commit("UPDATE_SUBMISSION", { ...data, id: updatedDoc.id });
      } catch (error) {
        console.error("Error editing submission:", error);
      }
    },
    async deleteSubmission({ commit }, id) {
      try {
        if (auth.currentUser) {
          const submissionDocRef = doc(db, "submissions", id);
          await deleteDoc(submissionDocRef);
          commit("removeSubmission", id);
        }
      } catch (error) {
        console.error("Error deleting submission:", error);
        this.$store.dispatch(
          "showError",
          "An error occurred: " + error.message
        );
      }
    },
  },
  getters: {
    isAuthenticated(state) {
      return !!state.user;
    },
    user(state) {
      return state.user;
    },
    linkedUserIds(state) {
      return state.linkedUsers.map((user) => user.uid);
    },
    userDisplayName(state) {
      return state.user ? state.user.displayName : "";
    },
    submissionsCount(state) {
      return state.submissions.length;
    },
  },
});
