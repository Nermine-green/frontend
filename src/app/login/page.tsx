'use client';

import Link from 'next/link';
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            const response = await axios.post('http://127.0.0.1:8000/api/accounts/login/', {
                username: formData.username,
                password: formData.password,
            });

            // Debug: log the response to see what the backend returns
            console.log('Login response:', response.data);

            // Try to find the token in common places
            const token =
                response.data.token ||
                response.data.access ||
                response.data.access_token ||
                response.data.key;

            if (token) {
                localStorage.setItem('authToken', token);

                // Fetch user profile:
                try {
                    const userRes = await axios.get('http://127.0.0.1:8000/api/accounts/profile/', {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    console.log('User profile:', userRes.data);
                    localStorage.setItem('userRole', userRes.data.role === 'admin' ? 'admin' : 'user');
                    localStorage.setItem('username', userRes.data.username || '');
                    localStorage.setItem('email', userRes.data.email || '');
                } catch (profileErr) {
                    localStorage.setItem('userRole', 'user');
                    localStorage.removeItem('username');
                    localStorage.removeItem('email');
                    console.error('Failed to fetch user profile:', profileErr);
                }
                if (localStorage.getItem('userRole') === 'admin') {
                    router.push('/admin/dashboard');
                } else {
                    router.push('/maintenance');
                }

            } else {
                // Show the full response for debugging
                alert('Login failed. No token received.\nResponse: ' + JSON.stringify(response.data));
            }
        } catch (error: any) {
            // Show backend error message if available
            if (error.response && error.response.data) {
                const data = error.response.data;
                const firstKey = Object.keys(data)[0];
                alert(Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey]);
            } else {
                alert('Login failed. Please check your credentials.');
            }
            console.error('Login failed:', error);
        }
    };

    return (
        <div
            className="flex items-center justify-center min-h-screen bg-secondary login-background"
        >
            <Card className="w-full max-w-sm mx-auto shadow-lg">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-primary">EnerLab Login</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input id="username" type="text" placeholder="Your username" required onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" required onChange={handleChange} />
                        </div>
                        <Button type="submit" className="w-full btn-black-white">Login</Button>
</form>
<div className="mt-4 text-center text-sm">
    Don't have an account?{' '}
    <Link href="/register" className="underline text-primary">
        Register now
    </Link>
</div>
                </CardContent>
            </Card>
        </div>
    );
}