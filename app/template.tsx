'use client'

import { motion } from 'framer-motion'
import { UserProvider } from './components/context/userContext'

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ease: 'easeInOut', duration: 0.75 }}
      >
        {children}
      </motion.div>
    </UserProvider>
  )
}