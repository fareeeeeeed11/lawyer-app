import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { db } from './db';

const seedDatabase = async () => {
  const lawyerCount = await db.users.where('role').equals('lawyer').count();
  if (lawyerCount === 0) {
    await db.users.add({
      name: 'المحامي محمد أحمد الكامل',
      email: 'mohammed@lawyer.com',
      password: 'password', // In a real app, hash this
      role: 'lawyer',
      phone: '0500000000'
    } as any);
    console.log('Local database seeded with primary lawyer.');
  }
};

seedDatabase();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
