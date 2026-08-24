import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // In a real app, you would fetch user data from an API
    // For now, we'll just show a basic dashboard
    setUser({
      id: 'user_1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'ambassador',
    });
    setIsLoading(false);
  }, [router]);

  function handleLogout() {
    localStorage.removeItem('token');
    router.push('/login');
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Redirecting to login...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Ambassador Dashboard</h1>
        <button onClick={handleLogout} style={{ padding: '10px 20px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>Welcome, {user.firstName}!</h2>
        <p>Email: {user.email}</p>
        <p>Role: {user.role}</p>
      </div>

      <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        <MetricCard title="Recruits This Month" value="0" target="10" />
        <MetricCard title="Events Hosted" value="0" target="5" />
        <MetricCard title="Member Satisfaction" value="N/A" target="4.5/5" />
        <MetricCard title="Bonus Earned" value="$0" target="$500" />
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3>Quick Actions</h3>
        <ul>
          <li><a href="#create-event">Create New Event</a></li>
          <li><a href="#view-recruits">View My Recruits</a></li>
          <li><a href="#training">Complete Training</a></li>
          <li><a href="#settings">Account Settings</a></li>
        </ul>
      </div>
    </div>
  );
}

function MetricCard({ title, value, target }: { title: string; value: string; target: string }) {
  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
      border: '1px solid #ddd',
    }}>
      <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>{title}</p>
      <h3 style={{ margin: '10px 0 5px 0' }}>{value}</h3>
      <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>Target: {target}</p>
    </div>
  );
}
