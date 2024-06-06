import React, { useMemo, useState, useEffect } from 'react';
import { useReactTable, getCoreRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table';
import 'tailwindcss/tailwind.css';
import { API_URL } from '../utils/constants';
import defaultProfilePic from '../utils/dp.jpeg'; 

const DataTable = ({ initialData = [], onAdd, onUpdate, onDelete }) => {
  
  const columns = useMemo(() => [
    {
      accessorKey: 'avatar',
      header: 'Avatar',
      cell: ({ row }) => (
        <img
          src={row.original.avatar || defaultProfilePic}
          alt="Profile"
          className="w-10 h-10 rounded-full"
          onError={(e) => {
            if (e.target.src !== defaultProfilePic) {
              e.target.src = defaultProfilePic;
            }
          }}
        />
      ),
    },
    {
      accessorKey: 'id',
      header: 'ID',
    },
    {
      accessorKey: 'username',
      header: 'Username',
    },
    {
      accessorKey: 'fullName',
      header: 'Full Name',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <button onClick={() => handleEdit(row.original)} className="text-blue-500 hover:text-blue-700">Edit</button>
          <button onClick={() => handleDelete(row.original.id)} className="text-red-500 hover:text-red-700">Delete</button>
        </div>
      ),
    },
  ], []);

  // State management
  const [data, setData] = useState(initialData);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [editingUser, setEditingUser] = useState(null);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');

  // Fetch data from the API
  const fetchData = async (pageIndex, pageSize, globalFilter) => {
    try {
      const res = await fetch(`${API_URL}?page=${pageIndex + 1}&limit=${pageSize}&search=${globalFilter}`);
      const fetchedData = await res.json();
      setData(fetchedData);

      const totalRes = await fetch(`${API_URL}?search=${globalFilter}`);
      const totalData = await totalRes.json();
      setTotalItems(totalData.length);
    } catch (error) {
      console.error('Error fetching data:', error);
      setData([]);
      setTotalItems(0);
    }
  };

  // Fetch data whenever pageIndex, pageSize, or globalFilter changes
  useEffect(() => {
    fetchData(pageIndex, pageSize, globalFilter);
  }, [pageIndex, pageSize, globalFilter]);

  // Calculate the total number of pages
  const pageCount = useMemo(() => Math.ceil(totalItems / pageSize), [totalItems, pageSize]);

  // Initialize the table with the specified configuration
  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      pagination: { pageIndex, pageSize },
    },
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newPaginationState = updater({ pageIndex, pageSize });
        setPageIndex(newPaginationState.pageIndex);
        setPageSize(newPaginationState.pageSize);
      } else {
        setPageIndex(updater.pageIndex);
        setPageSize(updater.pageSize);
      }
    },
    pageCount,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
    manualPagination: true,
  });

  // Handle saving a user (add or update)
  const handleSave = () => {
    const newUser = {
      username,
      fullName,
    };

    if (editingUser) {
      onUpdate(editingUser.id, newUser);
    } else {
      onAdd(newUser);
    }

    setUsername('');
    setFullName('');
    setEditingUser(null);
  };

  // Handle editing a user
  const handleEdit = (user) => {
    setEditingUser(user);
    setUsername(user.username);
    setFullName(user.fullName);
  };

  // Handle deleting a user
  const handleDelete = async (userId) => {
    try {
      await onDelete(userId);
      setData(prevData => prevData.filter(user => user.id !== userId));
      alert('User has been deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      <div className="mb-4 flex flex-col md:flex-row md:space-x-4">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="border p-2 rounded mb-2 md:mb-0"
        />
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full Name"
          className="border p-2 rounded mb-2 md:mb-0"
        />
        <button onClick={handleSave} className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
          {editingUser ? 'Update' : 'Add'}
        </button>
      </div>
      <div className="mb-4">
        <input
          type="text"
          value={globalFilter || ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search by username or full name"
          className="border p-2 w-full rounded"
        />
      </div>
      <table className="min-w-full divide-y divide-gray-200 border rounded-lg">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {table.getRowModel().rows.map(row => (
            <tr key={row.id} className="hover:bg-gray-100">
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
          {table.getRowModel().rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                No results found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="pagination mt-4 flex items-center justify-between">
        <div>
          <button onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} className="px-2 py-1 border rounded mr-2">
            {'<<'}
          </button>
          <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="px-2 py-1 border rounded mr-2">
            {'<'}
          </button>
          <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="px-2 py-1 border rounded mr-2">
            {'>'}
          </button>
          <button onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()} className="px-2 py-1 border rounded">
            {'>>'}
          </button>
        </div>
        <span>
          Page{' '}
          <strong>
            {table.getState().pagination.pageIndex + 1} of {pageCount}
          </strong>
        </span>
        <select
          value={pageSize}
          onChange={(e) => {
            const size = Number(e.target.value);
            setPageSize(size);
            table.setPageSize(size);
          }}
          className="border rounded p-1"
        >
          {[10, 20, 30, 40, 50].map(size => (
            <option key={size} value={size}>
              Show {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default DataTable;
