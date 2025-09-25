import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Home from './pages/Home.tsx'
import Creators from './pages/Creators.tsx'
import PostInsight from './pages/PostInsight.tsx'
import AppLayout from './layouts/AppLayout.tsx'
import { Toaster } from 'sonner';

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AppLayout>
        <Home />
      </AppLayout>
    ),
  },
  {
    path: '/creators',
    element: (
      <AppLayout>
        <Creators />
      </AppLayout>
    ),
  },
  {
    path: '/post-insight',
    element: (
      <AppLayout>
        <PostInsight />
      </AppLayout>
    ),
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
    <Toaster />
  </StrictMode>,
)
