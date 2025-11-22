import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist'
import storage from 'redux-persist/lib/storage' // defaults to localStorage for web
import { messagesReducer, chatUIReducer } from './slices'

/**
 * Redux Persist Configuration
 * Persists both messages and chat UI state to localStorage
 */
const persistConfig = {
  key: 'grupo29-chat-root',
  version: 1,
  storage,
  // Persist both slices
  whitelist: ['messages', 'chatUI'],
}

// Combine reducers
const rootReducer = combineReducers({
  messages: messagesReducer,
  chatUI: chatUIReducer,
})

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer)

/**
 * Configure Redux Store with persistence middleware
 */
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types from redux-persist
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
})

export const persistor = persistStore(store)

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
