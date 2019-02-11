import Content from '@/admin/components/Program/Content';
import Enrollments from '@/admin/components/Program/Enrollments';
import get from 'lodash/get';
import Home from '@/admin/components';
import NotFound from '@/admin/components/common/NotFound';
import Program from '@/admin/components/Program';
import role from '@/../common/config/role';
import Router from 'vue-router';
import Settings from '@/admin/components/Program/Settings';
import store from './store';
import Users from '@/admin/components/users';
import Vue from 'vue';

Vue.use(Router);

const parseProgramId = ({ params }) => ({
  programId: parseInt(params.programId, 10)
});

// Handle 404
const fallbackRoute = { path: '*', component: NotFound };

const router = new Router({
  routes: [{
    path: '/',
    component: Home,
    meta: { auth: true },
    children: [{
      path: 'users',
      alias: '',
      name: 'users',
      component: Users
    }, {
      path: 'programs/:programId',
      component: Program,
      props: parseProgramId,
      children: [{
        path: '',
        name: 'enrollments',
        component: Enrollments,
        props: parseProgramId
      }, {
        path: 'content',
        name: 'importedContent',
        component: Content,
        props: parseProgramId
      }, {
        path: 'settings',
        name: 'programSettings',
        component: Settings,
        props: parseProgramId
      }]
    }]
  }, fallbackRoute]
});

const isAdmin = user => user && user.role === role.ADMIN;

router.beforeEach((to, from, next) => {
  const user = get(store.state, 'auth.user');
  if (!isAdmin(user)) return window.location.replace(window.location.origin);
  return next();
});

export default router;
