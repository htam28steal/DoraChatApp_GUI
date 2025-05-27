import { configureStore } from '@reduxjs/toolkit';
import friendReducer from './reducers/friendReducer';

const store = configureStore({
  reducer: {
    friend: friendReducer,
    // thêm reducer khác nếu có
  },
});

export default store;
