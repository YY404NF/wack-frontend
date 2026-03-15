import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'login',
      component: { template: '<div />' },
    },
    {
      path: '/setup',
      name: 'setup',
      component: { template: '<div />' },
    },
    {
      path: '/admin/:tab?',
      name: 'admin',
      component: { template: '<div />' },
    },
    {
      path: '/student/:tab?',
      name: 'student',
      component: { template: '<div />' },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/login',
    },
  ],
})
