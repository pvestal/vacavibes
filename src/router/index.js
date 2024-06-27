import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import LoginView from '../views/LoginView.vue';
import SubmissionsView from '../views/SubmissionsView.vue';
import EditSubmissionView from '../views/EditSubmissionView.vue';
import store from '@/store';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView
  },
  {
    path: '/submissions',
    name: 'Submissions',
    component: SubmissionsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/edit-submission/:id',
    name: 'EditSubmission',
    component: EditSubmissionView,
    meta: { requiresAuth: true }
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

router.beforeEach((to, from, next) => {
  const user = store.state.user;
  if (to.matched.some(record => record.meta.requiresAuth) && !user) {
    next({ name: 'Login' });
  } else {
    next();
  }
});

export default router;








