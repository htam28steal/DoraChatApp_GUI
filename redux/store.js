// redux/store.js
import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import friendReducer from './reducers/friendReducer'; // chỉnh path nếu cần

const rootReducer = combineReducers({
  friend: friendReducer,
  // thêm reducer khác nếu có
});

const store = createStore(rootReducer, applyMiddleware(thunk));

export default store;
