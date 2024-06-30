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
  },
  mutations: {
    SET_USER(state, user) {
      if (!user.linkedUsers) {
        user.linkedUsers = []; // Ensure linkedUsers is initialized as an array
      }
      state.user = user; // Set or update the user in the state
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
    SET_LINKED_USERS(state, linkedUsers) {
      state.user.linkedUsers = linkedUsers;
    },
    ADD_LINKED_USER(state, user) {
      // Check if the user already exists in the linkedUsers array
      const index = state.user.linkedUsers.findIndex((u) => u.uid === user.uid);

      if (index !== -1) {
        // If the user already exists, replace the old user data with the new one
        state.user.linkedUsers.splice(index, 1, user);
      } else {
        // If the user does not exist, add them to the array
        state.user.linkedUsers.push(user);
      }
    },
    ADD_LINKED_USER_REQUEST(state, request) {
      state.user.linkedUsers.push(request);
    },
    // UPDATE_LINK_REQUEST_STATUS(state, { requestId, newStatus }) {
    //   const index = state.user.linkedUsers.findIndex(
    //     (req) => req.id === requestId
    //   );
    //   if (index !== -1) {
    //     state.user.linkedUsers[index].status = newStatus;
    //   }
    // },
    UPDATE_LINK_REQUEST_STATUS(state, { index, status }) {
      if (index >= 0 && state.user.linkedUsers[index]) {
        state.user.linkedUsers[index].status = status;
      }
    },
    UPDATE_LINKED_USER(state, { index, user }) {
      state.user.linkedUsers.splice(index, 1, user);
    },
    REMOVE_LINKED_USER(state, index) {
      state.user.linkedUsers.splice(index, 1);
    },
    SET_SUBMISSIONS(state, submissions) {
      state.submissions = submissions;
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
    async findUserByEmail({ dispatch }, email) {
      const usersRef = collection(db, "users");
      const querySnapshot = await getDocs(
        query(usersRef, where("email", "==", email))
      );
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0]; // Assume there is one match for the email
        console.log("User found sending to sendLinkRequest ->:", userDoc.data());
        dispatch("sendLinkRequest", {
          uid: userDoc.id,
          displayName: userDoc.data().displayName,
          email: userDoc.data().email,
          lastLogin: userDoc.data().lastLogin,
        });
      } else {
        dispatch("showError", "No user found with the provided email");
        throw new Error("No user found with the provided email");
      }
    },
    async sendLinkRequest(
      { commit, state, dispatch },
      { uid, displayName, email, lastLogin, }
    ) {
      console.log("Sending link request email-uid-displayName" + email + uid + displayName + lastLogin );
      if (!state.user) throw new Error("No authenticated user found.");

      const newRequest = {
        uid,
        email,
        displayName,
        status: "pending", // Status can be 'pending', 'approved', or 'denied'
        lastLogin,
      };

      // Update Firestore to include this new link request in both the sender and receiver's documents
      const senderRef = doc(db, "users", state.user.uid);
      const receiverRef = doc(db, "users", uid);

      console.log("SenderRef:", senderRef);
      console.log("ReceiverRef:", receiverRef);

      console.log("New Request:", newRequest);
      console.log("linkedUsers:", state.user.linkedUsers);
      try {
        await updateDoc(senderRef, {
          linkedUsers: arrayUnion(newRequest),
        });
        await updateDoc(receiverRef, {
          linkedUsers: arrayUnion({
            ...newRequest,
            uid: state.user.uid,
            email: state.user.email,
            displayName: state.user.displayName,
            lastLogin: state.user.lastLogin,
          }),
        });
        commit("ADD_LINKED_USER_REQUEST", newRequest);
      } catch (error) {
        console.error("Error sending link request:", error);
        dispatch("showError", "An error occurred: " + error.message);
        throw error;
      }
    },
    async approveLinkRequest({ commit, state }, linkedUserId) {
      try {
        if (!state.user || !state.user.uid) {
          throw new Error("No authenticated user found.");
        }
        
        const userDocRef = doc(db, "users", state.user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          throw new Error("User document does not exist.");
        }
    
        const userData = userDoc.data();
        if (!userData.linkedUsers) {
          throw new Error("No linked users array in user document.");
        }
    
        const linkedUserIndex = userData.linkedUsers.findIndex(u => u.uid === linkedUserId);
        if (linkedUserIndex === -1) {
          throw new Error("Linked user not found.");
        }
        
        const linkedUser = userData.linkedUsers[linkedUserIndex];
        // Ensure all required data is present
        if (!linkedUser || !linkedUser.uid || !linkedUser.displayName || !linkedUser.email) {
          throw new Error("Linked user data is incomplete.");
        }
    
        // Proceed with updating the linked user's status
        userData.linkedUsers[linkedUserIndex].status = 'approved';
    
        // Update the document in Firestore
        await updateDoc(userDocRef, {
          linkedUsers: userData.linkedUsers  // Directly setting the whole array since Firestore doesn't support nested array item updates
        });
    
        // Update Vuex state
        commit('UPDATE_LINK_REQUEST_STATUS', { index: linkedUserIndex, status: "approved" });
    
      } catch (error) {
        console.error("Error approving linked user:", error);
        this.$store.dispatch("showError", error.message);
      }
    },    
    // async approveLinkRequest({ commit, state }, {linkedUserId}) {
    //   try {
    //     // Query the users collection to find a user by linkedUserId
    //     const usersQuery = query(collection(db, "users"), where((linkedUserId) => linkedUserId === linkedUser.uid));
    //     const querySnapshot = await getDocs(usersQuery);

    //     if (querySnapshot.empty) {
    //       throw new Error("User with the provided email does not exist.");
    //     }

    //     const userToLinkDoc = querySnapshot.docs[0];
    //     const linkedUser = {
    //       uid: userToLinkDoc.id,
    //       email: userToLinkDoc.data().email,
    //       displayName: userToLinkDoc.data().displayName || "Unknown",
    //       photoURL: userToLinkDoc.data().photoURL || "photo-url",
    //     };

    //     // Check if the user is already linked
    //     if (state.user.linkedUsers.some((user) => user.uid === linkedUser.uid)) {
    //       throw new Error("User is already linked.");
    //     }

    //     // Update Firestore to add the linked user to the current user's document
    //     await updateDoc(doc(db, "users", state.user.uid), {
    //       linkedUsers: arrayUnion(linkedUser),
    //     });

    //     // Update Vuex state
    //     commit("ADD_LINKED_USER", linkedUser);

    //     // Optionally update the status of the request in Firestore and Vuex
    //     await updateDoc(doc(db, "users", state.user.uid, "linkedUsers", requestId), {
    //       status: 'approved'
    //     });
    //     commit('UPDATE_LINK_REQUEST_STATUS', { requestId, newStatus: 'approved' });

    //   } catch (error) {
    //     console.error("Error approving link request:", error);
    //     this.$store.dispatch(
    //       "showError",
    //       "An error occurred while approving link request: " + error.message
    //     );
    //   }
    // },
    // async approveLinkRequest({ commit, state }, { linkedUserId }) {
    //   if (!state.user) throw new Error("No authenticated user found.");

    //   try {
    //     const userRef = doc(db, "users", state.user.uid);
    //     const userDoc = await getDoc(userRef);

    //     if (!userDoc.exists()) {
    //       throw new Error("Current user data not found.");
    //     }

    //     const userData = userDoc.data();
    //     let linkedUsers = userData.linkedUsers || [];
    //     let updated = false;

    //     // Map through linked users to find and update the status of the specific linked user
    //     linkedUsers = linkedUsers.map(linkedUser => {
    //       if (linkedUser.uid === linkedUserId) {
    //         updated = true;
    //         return { ...linkedUser, status: 'approved' };
    //       }
    //       return linkedUser;
    //     });

    //     // Only update if we found and changed a user
    //     if (updated) {
    //       await updateDoc(userRef, {
    //         linkedUsers: linkedUsers
    //       });

    //       // Update Vuex store
    //       commit('SET_LINKED_USERS', linkedUsers);
    //     } else {
    //       throw new Error("Linked user not found.");
    //     }

    //   } catch (error) {
    //     console.error("Error approving linked user:", error);
    //     this.$store.dispatch("showError", "An error occurred while approving linked user: " + error.message);
    //     throw error;
    //   }
    // },
    // async approveLinkRequest({ commit, state }, linkedUserId) {
    //   console.log("Approving link request for user:", linkedUserId);
    //   try {
    //     const userDocRef = doc(db, "users", state.user.uid); // Direct reference to the current user's document
    //     const userDoc = await getDoc(userDocRef);
    //     if (!userDoc.exists()) {
    //       throw new Error("Current user document does not exist.");
    //     }
    //     const userData = userDoc.data();
    //     const linkedUsers = userData.linkedUsers || [];
    //     console.log("Linked users:", linkedUsers);
    //     // const linkedUserIndex = linkedUsers.findIndex(u => u.uid === linkedUserId);
    //     console.log("Linked user ID:", linkedUserId);
    //     const linkedUserIndex = linkedUsers.findIndex((u) => {
    //       console.log(`Comparing ${u.uid} with ${linkedUserId}`);
    //       return u.uid === linkedUserId;
    //     });

    //     if (linkedUserIndex === -1) {
    //       throw new Error("Linked user not found.");
    //     }

    //     // Update the linked user status within the array
    //     linkedUsers[linkedUserIndex] = {
    //       ...linkedUsers[linkedUserIndex],
    //       status: "approved",
    //     };
    //     console.log("Linked users after update:", linkedUsers[linkedUserIndex]);
    //     // Update the document with the new linkedUsers array
    //     console.log(
    //       "Updating Firestore with new linked users array",
    //       linkedUsers
    //     );
    //     await updateDoc(userDocRef, { linkedUsers });
    //     console.log("Linked users updated in Firestore");
    //     commit("UPDATE_LINK_REQUEST_STATUS", {
    //       uid: linkedUserId,
    //       status: "approved",
    //     });
    //   } catch (error) {
    //     console.error("Error approving linked user:", error);
    //     this.$store.dispatch(
    //       "showError",
    //       "An error occurred while approving linked user: " + error.message
    //     );
    //     throw error; // Propagate the error for further handling
    //   }
    // },

    async disapproveLinkRequest({ commit, state }, email) {
      try {
        // Query the users collection to find a user by email
        const usersQuery = query(
          collection(db, "users"),
          where("email", "==", email)
        );
        const querySnapshot = await getDocs(usersQuery);

        if (querySnapshot.empty) {
          throw new Error("User with the provided email does not exist.");
        }

        const userToUnlinkDoc = querySnapshot.docs[0];
        const linkedUser = {
          uid: userToUnlinkDoc.id,
          email: userToUnlinkDoc.data().email,
          displayName: userToUnlinkDoc.data().displayName || "Unknown",
          photoURL: userToUnlinkDoc.data().photoURL || "photo-url",
          lastLogin: userToUnlinkDoc.data().lastLogin,
        };

        // Check if the user is already linked
        if (
          !state.user.linkedUsers.some((user) => user.uid === linkedUser.uid)
        ) {
          throw new Error("User is not currently linked.");
        }

        // Update Firestore to remove the linked user from the current user's document
        await updateDoc(doc(db, "users", state.user.uid), {
          linkedUsers: arrayRemove(linkedUser),
        });

        // Remove from Vuex state
        commit("REMOVE_LINKED_USER", linkedUser.uid);

        // Update the status of the request in Firestore and Vuex
      //   await updateDoc(
      //     doc(db, "users", state.user.uid, "linkedUsers", requestId),
      //     {
      //       status: "denied",
      //     }
      //   );
      //   commit("UPDATE_LINK_REQUEST_STATUS", {
      //     requestId,
      //     newStatus: "denied",
      //   });
      } catch (error) {
        console.error("Error disapproving link request:", error);
        this.$store.dispatch(
          "showError",
          "An error occurred while disapproving link request: " + error.message
        );
      }
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
            resolve(user);
          } else {
            console.log("No user logged in");
            commit("CLEAR_USER");
            resolve(null);
          }
        }, reject);
      });
    },
    async fetchLinkedUsers({ state, commit }) {
      if (!state.user) return []; // Return an empty array if no user is found

      try {
        const docSnap = await getDoc(doc(db, "users", state.user.uid));
        if (docSnap.exists()) {
          const userData = docSnap.data();
          const linkedUsers = userData.linkedUsers || [];
          // Filter linked users where status is 'approved'
          const approvedLinkedUsers = linkedUsers.filter(
            (u) => u.status === "approved"
          );
          // Committing the filtered list to Vuex state or returning it
          commit("SET_LINKED_USERS", approvedLinkedUsers);
          return approvedLinkedUsers; // Optionally return it if you need to use this array in your component
        } else {
          commit("SET_LINKED_USERS", []);
          return []; // Return an empty array if no user data is found
        }
      } catch (error) {
        console.error("Failed to fetch linked users:", error);
        this.$store.dispatch(
          "showError",
          "An error occurred fetching linked Users: " + error.message
        );
        throw error; // Continue to propagate the error
      }
    },
    async fetchUserDetails({ commit, dispatch }, userId) {
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        commit("SET_USER", userDoc.data());
      } else {
        console.error("User not found");
        dispatch("showError", "User not found");
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

        if (
          state.user.linkedUsers.some((user) => user.uid === linkedUser.uid)
        ) {
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
          commit("UPDATE_LINKED_USER", { index, newEmail });
        }
      } catch (error) {
        console.error("Error editing linked user:", error);
      }
    },
    async fetchSubmissions({ commit }) {
      const collectionRef = collection(db, "submissions");
      try {
        const querySnapshot = await getDocs(collectionRef);
        const documents = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log("Submissions:", documents);
        commit("SET_SUBMISSIONS", documents);
      } catch (error) {
        console.error("Error getting documents:", error.message);
        this.$store.dispatch(
          "showError",
          "An error occurred fetching submissions: " + error.message
        );
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
      const linkedUsers = this.state.user.linkedUsers;
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
          console.log(
            "submitterScore: ",
            updatedSubmission.rating.submitterScore
          );
          await updateDoc(submissionDocRef, {
            ...updatedSubmission,
            "rating.submitterScore": updatedSubmission.rating.submitterScore,
            lastModified: Timestamp.now(),
          });
        } else {
          // Current user is not the submitter, assign as ratedBy and update raterScore
          console.log("raterScore: ", updatedSubmission.rating.raterScore);
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
    linkedUsers(state) {
      return state.user.linkedUsers || [];
    },
    userDisplayName(state) {
      return state.user ? state.user.displayName : "";
    },
    submissions(state) {
      return state.submissions || [];
    },
    myPendingLinkedUsers(state) {
      // Filter for incoming requests that are pending and directed to the logged-in user
      return (
        state.user.linkedUsers.filter((req) => req.status === "pending") || []
      );
    },
  },
});
