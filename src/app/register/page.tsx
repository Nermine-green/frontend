'use client';

import Link from 'next/link';
import { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handlePhoneChange = (phone: string) => {
        setFormData({ ...formData, phone });
    };

    const handleRegister = async (event: React.FormEvent) => {
        event.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        try {
            const response = await axios.post('http://127.0.0.1:8000/api/accounts/register/', {
                username: formData.name,
                email: formData.email,
                password: formData.password,
                password2: formData.confirmPassword,
            });
            console.log('Registration successful:', response.data);
            window.location.href = '/login';
        } catch (error) {
            console.error('Registration failed:', error);
            alert('Registration failed. Please try again.');
        }
    };

    return (
        <div
            className="flex items-center justify-center min-h-screen bg-secondary login-background register-bg"
        >
            <Card className="w-full max-w-sm mx-auto shadow-lg">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-primary">EnerLab Register</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" type="text" placeholder="Your Name" required onChange={handleChange}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="user@actia.tn" required
                                   onChange={handleChange}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" required onChange={handleChange}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input id="confirmPassword" type="password" required onChange={handleChange}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <PhoneInput
                                country={'tn'}
                                inputProps={{
                                    name: 'phone',
                                    required: true,
                                    autoFocus: false,
                                }}
                                containerClass="react-tel-input"
                                inputClass="w-full border rounded-md p-2"
                                onChange={handlePhoneChange}
                            />
                        </div>
                        <Button type="submit" className="w-full btn-black-white">Register</Button>
</form>
<div className="mt-4 text-center text-sm">
    Already have an account?{' '}
    <Link href="/login" className="underline text-primary">
        Login
    </Link>
</div>
                </CardContent>
            </Card>
        </div>
    );
}