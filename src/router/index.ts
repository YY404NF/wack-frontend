import { createRouter, createWebHistory } from 'vue-router'

import { adminRoutes } from './admin-routes'

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
    ...adminRoutes,
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
