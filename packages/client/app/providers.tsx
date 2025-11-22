"use client"

import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from '@/store'

/**
 * Redux Provider Component
 *
 * Wraps the app with Redux Provider and PersistGate
 * - Provider: Makes Redux store available to all components
 * - PersistGate: Delays rendering until persisted state is retrieved from storage
 */
export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  )
}
