import React, { useState } from 'react';
import DataTable from '../components/DataTable';
import Chat from '../components/Chat';
import { API_URL } from '../utils/constants';

const Home = ({ initialUsers }) => {
  const [users, setUsers] = useState(initialUsers);

  const handleAdd = async (newUser) => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newUser),
    });
    const user = await res.json();
    setUsers([...users, user]);
  };

  const handleUpdate = async (id, updatedUser) => {
    const res = await fetch(API_URL+"/"+id, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedUser),
    });
    const user = await res.json();
    setUsers(users.map((u) => (u.id === id ? user : u)));
  };

  const handleDelete = async (id) => {
    await fetch(API_URL+"/"+id, {
      method: 'DELETE',
    });
    setUsers(users.filter((u) => u.id !== id));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">User List</h1>
      <DataTable initialData={users} onAdd={handleAdd} onUpdate={handleUpdate} onDelete={handleDelete} />
      <h2 className="text-xl font-bold mt-8 mb-4">Chat</h2>
      <Chat users={users} />
    </div>
  );
};

export async function getServerSideProps() {
  const res = await fetch(API_URL+'?page=1&limit=10');
  const initialUsers = await res.json();
  return { props: { initialUsers } };
}

export default Home;
