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
// import { getFunctions, httpsCallable } from 'firebase/functions';

export default createStore({
  state: {
    user: null,
    submissions: [],
    // recommendations: [],
    // userRatings: [],
    linkedUsers: [],
  },
  mutations: {
    SET_USER(state, user) {
      state.user = user;
    },
    CLEAR_USER(state) {
      state.user = null;
    },
    SET_SUBMISSIONS(state, submissions) {
      state.submissions = submissions;
    },
    // setRecommendations(state, recommendations) {
    //   state.recommendations = recommendations.sort((a, b) => b.averageRating - a.averageRating);
    // },
    // setUserRatings(state, userRatings) {
    //   state.userRatings = userRatings;
    // },
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
    async login({ commit }) {
      try {
        const result = await signInWithPopup(auth, googleProvider); // Sign in with Google popup.
        const userRef = doc(db, "users", result.user.uid);  // Reference to the user document.
    
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
    
        await setDoc(userRef, userData, { merge: true });  // Merges data with existing or creates new if not present.
        commit("SET_USER", userData);
        router.push({ name: "Home" });
      } catch (error) {
        console.error("Error logging in:", error);
      }
    },    
    async logout({ commit }) {
      try {
        await auth.signOut();
        commit("CLEAR_USER");
        router.push({ name: "Login" });
      } catch (error) {
        console.error("Error logging out:", error);
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
    async fetchSubmissions({ state, }) {
      try {
        // Ensure there is a user object and it has the necessary properties
        // if (!state.user || !state.user.linkedUsers) {
        //   console.error("User data is not available or improperly structured");
        //   return;
        // }
    
        // Extract the current user's ID and linked user IDs from the user module's state
        const currentUserID = state.user.uid; // Adjust if your state structure is different
        console.log("Current User ID: ", currentUserID);
    
        const linkedUserIDs = state.linkedUsers.map(user => user.uid); // Assumes linkedUsers is an array of user objects
        console.log("Linked User IDs: ", linkedUserIDs);
    
        // Now you can use these IDs to fetch submissions or any other related data
        // Example logic to fetch data could be added here
      } catch (error) {
        console.error("Error fetching submissions with user details:", error);
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
    async addSubmission({ commit }, submissionData) {
      if (!submissionData.submittedBy || !submissionData.rating.submitterScore) {
          throw new Error("No authenticated user found or fields are incomplete.");
      }
  
      const newSubmission = {
          ...submissionData,
          createdAt: Timestamp.now(),
          lastupdated: Timestamp.now(),
      };
  
      try {
        const docRef = await addDoc(collection(db, "submissions"), newSubmission);
          commit("ADD_SUBMISSION", { id: docRef.id, ...newSubmission });
          return docRef.id;
      } catch (error) {
          console.error("Error adding submission:", error);
          throw error;
      }
  },
    async updateSubmission({ commit }, updatedSubmission) {
      try {
        if (auth.currentUser) {
          const submissionDocRef = doc(db, "submissions", updatedSubmission.id);
          await updateDoc(submissionDocRef, updatedSubmission);
          commit("updateSubmission", updatedSubmission);
        }
      } catch (error) {
        console.error("Error updating submission:", error);
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
  },
});
