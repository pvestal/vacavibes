import { createStore } from 'vuex';
import { auth, googleProvider, signInWithPopup, db } from '../firebaseConfig';
import { collection, getDocs, setDoc, doc, updateDoc, deleteDoc, query, where, getDoc, or, Timestamp } from 'firebase/firestore';
import router from '../router';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default createStore({
  state: {
    user: null,
    submissions: [],
    // recommendations: [],
    // userRatings: [],
    linkedUsers: []
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
    ADD_LINKED_USER(state, email) {
      state.linkedUsers.push(email);
    },
    UPDATE_LINKED_USER(state, { index, newEmail }) {
      state.linkedUsers.splice(index, 1, newEmail);
    },
    REMOVE_LINKED_USER(state, index) {
      state.linkedUsers.splice(index, 1);
    },
    ADD_SUBMISSION(state, submission) {
      state.submissions.push(submission);
    },
    UPDATE_SUBMISSION(state, updatedSubmission) {
      const index = state.submissions.findIndex(submission => submission.id === updatedSubmission.id);
      if (index !== -1) {
        state.submissions.splice(index, 1, updatedSubmission);
      }
    },
    REMOVE_SUBMISSION(state, id) {
      state.submissions = state.submissions.filter(submission => submission.id !== id);
    }
  },
  actions: {
    async login({ commit, dispatch }) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        commit('SET_USER', result.user);

        const userDocRef = doc(db, 'users', result.user.uid);
        await setDoc(userDocRef, {
          uid: result.user.uid,
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL,
          lastLogin: Timestamp.now(),
        }, { merge: true });

        await dispatch('fetchSubmissions');
        // await dispatch('fetchRecommendations');
        // await dispatch('fetchUserRatings');
        await dispatch('fetchLinkedUsers');

        router.push({ name: 'Home' });

      } catch (error) {
        console.error('Error logging in:', error);
      }
    },
    async logout({ commit }) {
      try {
        await auth.signOut();
        commit('CLEAR_USER');
        router.push({ name: 'Login' });
      } catch (error) {
        console.error('Error logging out:', error);
      }
    },
    fetchUser({ commit, dispatch }) {
      return new Promise((resolve, reject) => {
        auth.onAuthStateChanged(async (user) => {
          if (user) {
            console.log('User logged in:', user);
            commit('SET_USER', user);
            await dispatch('fetchSubmissions');
            // await dispatch('fetchRecommendations');
            // await dispatch('fetchUserRatings');
            await dispatch('fetchLinkedUsers');
            resolve(user);
          } else {
            console.log('No user logged in');
            commit('CLEAR_USER');
            resolve(null);
          }
        }, reject);
      });
    },
    async fetchSubmissions({ commit, state }) {
      try {
        if (auth.currentUser) {
          const linkedEmails = state.linkedUsers.map(email => email);
          let q;
          if (linkedEmails.length > 0) {
            q = query(collection(db, 'submissions'), or(where('userId', '==', auth.currentUser.uid), where('userId', 'in', linkedEmails)));
          } else {
            q = query(collection(db, 'submissions'), where('userId', '==', auth.currentUser.uid));
          }
          const querySnapshot = await getDocs(q);
          const submissions = [];
          querySnapshot.forEach(doc => {
            submissions.push({ id: doc.id, ...doc.data() });
          });
          commit('SET_SUBMISSIONS', submissions);
        }
      } catch (error) {
        console.error('Error fetching submissions:', error);
      }
    },
    // async fetchRecommendations({ commit }) {
    //   try {
    //     if (auth.currentUser) {
    //       const q = query(collection(db, 'recommendations'), where('userId', '==', auth.currentUser.uid));
    //       const querySnapshot = await getDocs(q);
    //       const recommendations = [];
    //       querySnapshot.forEach(doc => {
    //         const data = doc.data();
    //         const averageRating = (data.submitterRating + data.raterRating) / 2;
    //         recommendations.push({ id: doc.id, ...data, averageRating });
    //       });
    //       commit('setRecommendations', recommendations);
    //     }
    //   } catch (error) {
    //     console.error('Error fetching recommendations:', error);
    //   }
    // },
    // async fetchUserRatings({ commit }) {
    //   try {
    //     if (auth.currentUser) {
    //       const q = query(collection(db, 'ratings'), where('ratedBy', '==', auth.currentUser.uid));
    //       const querySnapshot = await getDocs(q);
    //       const userRatings = [];
    //       querySnapshot.forEach(doc => {
    //         userRatings.push({ id: doc.id, ...doc.data() });
    //       });
    //       commit('setUserRatings', userRatings);
    //     }
    //   } catch (error) {
    //     console.error('Error fetching user ratings:', error);
    //   }
    // },
    async fetchLinkedUsers({ commit }) {
      try {
        if (auth.currentUser) {
          const userDocRef = doc(db, 'users', auth.currentUser.uid);
          const userSnapshot = await getDoc(userDocRef);
          const userData = userSnapshot.exists() ? userSnapshot.data() : {};
          commit('SET', userData.linkedUsers || []);
        }
      } catch (error) {
        console.error('Error fetching linked users:', error);
      }
    },
    async linkUser({ commit }, email) {
      try {
        if (auth.currentUser) {
          const userDocRef = doc(db, 'users', auth.currentUser.uid);
          const userSnapshot = await getDoc(userDocRef);
          const userData = userSnapshot.exists() ? userSnapshot.data() : {};
          const linkedUsers = userData.linkedUsers || [];
          linkedUsers.push(email);

          await updateDoc(userDocRef, { linkedUsers });
          commit('addLinkedUser', email);

          const functions = getFunctions();
          const sendRatingEmail = httpsCallable(functions, 'sendRatingEmail');
          await sendRatingEmail({ email: email, submissionId: 'your-submission-id' });
          console.log('Email sent successfully!');
        }
      } catch (error) {
        console.error('Error linking user:', error);
      }
    },
    async editLinkedUser({ commit }, { index, newEmail }) {
      try {
        if (auth.currentUser) {
          const userDocRef = doc(db, 'users', auth.currentUser.uid);
          const userSnapshot = await getDoc(userDocRef);
          const userData = userSnapshot.exists() ? userSnapshot.data() : {};
          const linkedUsers = [...userData.linkedUsers];
          linkedUsers[index] = newEmail;

          await updateDoc(userDocRef, { linkedUsers });
          commit('updateLinkedUser', { index, newEmail });
        }
      } catch (error) {
        console.error('Error editing linked user:', error);
      }
    },
    async deleteLinkedUser({ commit }, index) {
      try {
        if (auth.currentUser) {
          const userDocRef = doc(db, 'users', auth.currentUser.uid);
          const userSnapshot = await getDoc(userDocRef);
          const userData = userSnapshot.exists() ? userSnapshot.data() : {};
          const linkedUsers = userData.linkedUsers.filter((_, i) => i !== index);

          await updateDoc(userDocRef, { linkedUsers });
          commit('removeLinkedUser', index);
        }
      } catch (error) {
        console.error('Error deleting linked user:', error);
      }
    },
    async submitSubmission({ commit }, submission) {
      try {
        if (auth.currentUser) {
          const submissionDocRef = doc(collection(db, 'submissions'));
          await setDoc(submissionDocRef, {
            ...submission,
            userId: auth.currentUser.uid,
            createdAt: new Date()
          });
          commit('addSubmission', { ...submission, id: submissionDocRef.id });
        }
      } catch (error) {
        console.error('Error submitting submission:', error);
      }
    },
    async updateSubmission({ commit }, updatedSubmission) {
      try {
        if (auth.currentUser) {
          const submissionDocRef = doc(db, 'submissions', updatedSubmission.id);
          await updateDoc(submissionDocRef, updatedSubmission);
          commit('updateSubmission', updatedSubmission);
        }
      } catch (error) {
        console.error('Error updating submission:', error);
      }
    },
    async deleteSubmission({ commit }, id) {
      try {
        if (auth.currentUser) {
          const submissionDocRef = doc(db, 'submissions', id);
          await deleteDoc(submissionDocRef);
          commit('removeSubmission', id);
        }
      } catch (error) {
        console.error('Error deleting submission:', error);
      }
    },
    async saveRating({ commit }, { id, submitterRating, raterRating }) {
      try {
        if (auth.currentUser) {
          const submissionDocRef = doc(db, 'submissions', id);
          await updateDoc(submissionDocRef, { submitterRating, raterRating });
          const updatedSubmission = await getDoc(submissionDocRef);
          commit('updateSubmission', { id, ...updatedSubmission.data() });
        }
      } catch (error) {
        console.error('Error saving rating:', error);
      }
    }
  }
});
