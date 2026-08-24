import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login or dashboard based on auth status
    router.push('/login');
  }, [router]);

  return (
    <div>
      <p>Redirecting...</p>
    </div>
  );
}
