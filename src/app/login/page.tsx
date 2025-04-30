'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  // TODO: Implement actual authentication logic
  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    // In a real app, you would handle authentication here
    console.log('Login attempt');
    // Redirect to the main page or dashboard after successful login
     window.location.href = '/'; // Simple redirect for now
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary">
      <Card className="w-full max-w-sm mx-auto shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">EcoTest Insight Login</CardTitle>
          <CardDescription>Enter your credentials to access the calculator.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="user@actia.tn" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required />
            </div>
             {/* <div className="flex items-center justify-between">
                 <Link href="/forgot-password" passHref>
                    <Button variant="link" className="px-0 text-sm">Forgot password?</Button>
                </Link>
             </div> */}
             {/* Replace button with Link for now until auth is set up */}
             <Link href="/" passHref>
                <Button className="w-full" >
                    Login (Placeholder)
                </Button>
            </Link>
             {/* <Button type="submit" className="w-full">Login</Button> */}
          </form>
           <div className="mt-4 text-center text-sm">
             {/* Don't have an account?{' '}
             <Link href="/register" className="underline text-primary">
               Register (Requires Admin Approval)
             </Link> */}
             <p className="text-muted-foreground">(User registration managed by administrator)</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
