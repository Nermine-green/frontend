"use client";
import { useEffect, useState } from "react";

type User = {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  date_joined: string;
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token"); // Adjust if your token is stored elsewhere
    fetch("http://127.0.0.1:8000/api/accounts/users/", {
      credentials: "include",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        // Defensive check: ensure data is an array
        if (Array.isArray(data)) {
          setUsers(data);
        } else {
          setUsers([]);
        }
        setLoading(false);
      });
  }, []);

  // Block (deactivate) user handler
  const handleBlock = async (userId: number) => {
    const token = localStorage.getItem("token");
    await fetch("http://127.0.0.1:8000/api/accounts/users/", {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId, action: "block" }),
    });
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_active: false } : u))
    );
  };
  const handleUnBlock = async (userId: number) => {
    const token = localStorage.getItem("token");
    await fetch("http://127.0.0.1:8000/api/accounts/users/", {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId, action: "unblock" }),
    });
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_active: true } : u))
    );
  };

  // Delete user handler
  const handleDelete = async (userId: number) => {
    const token = localStorage.getItem("token");
    await fetch("http://127.0.0.1:8000/api/accounts/users/", {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId, action: "delete" }),
    });
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border">ID</th>
              <th className="py-2 px-4 border">Username</th>
              <th className="py-2 px-4 border">Email</th>
              <th className="py-2 px-4 border">Active</th>
              <th className="py-2 px-4 border">Date Joined</th>
              <th className="py-2 px-4 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr
                key={
                  typeof user.id === "number" || typeof user.id === "string"
                    ? user.id
                    : idx
                }
                className="border-b"
              >
                <td className="py-2 px-4 border">{user.id}</td>
                <td className="py-2 px-4 border">{user.username}</td>
                <td className="py-2 px-4 border">{user.email}</td>
                <td className="py-2 px-4 border">{user.is_active ? "Yes" : "No"}</td>
                <td className="py-2 px-4 border">{user.date_joined}</td>
                <td className="py-2 px-4 border">
                  <button
                    className="bg-green-500 text-white px-2 py-1 rounded mr-2"
                    disabled={user.is_active}
                    onClick={() => handleUnBlock(user.id)}
                  >
                    Unblock
                  </button>
                  <button
                    className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                    disabled={!user.is_active}
                    onClick={() => handleBlock(user.id)}
                  >
                    Block
                  </button>
                  <button
                    className="bg-red-600 text-white px-2 py-1 rounded"
                    onClick={() => handleDelete(user.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}