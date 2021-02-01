import auth from '@/common/store/modules/auth';
import { auth as authPlugin } from '@/common/store/plugins';
import contentRepo from '@/admin/store/modules/content-repo';
import programs from '@/admin/store/modules/programs';
import request from '@/common/api/request';
import userGroups from '@/admin/store/modules/userGroups';
import Vue from 'vue';
import Vuex from 'vuex';

const isProduction = process.env.NODE_ENV === 'production';

Vue.use(Vuex);

const store = new Vuex.Store({
  modules: {
    auth,
    contentRepo,
    programs,
    userGroups
  },
  plugins: [authPlugin({ storageKey: 'LMS_USER' })],
  strict: !isProduction
});

request.auth.storageKey = 'LMS_TOKEN';
request.auth.on('error', () => store.dispatch('auth/logout'));

export default store;
