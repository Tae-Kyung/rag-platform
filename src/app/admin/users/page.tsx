'use client';

import { useEffect, useState, useCallback } from 'react';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  plan_id: string;
  subscription_status: string;
  bot_count: number;
  messages_used: number;
}

interface UserDetail {
  profile: { id: string; email: string; full_name: string | null; role: string; created_at: string };
  subscription: { plan_id: string; status: string } | null;
  bots: { id: string; name: string; is_active: boolean; created_at: string }[];
  usage_records: { messages_used: number; documents_used: number; storage_used_mb: number; period_start: string }[];
  invoices: { id: string; amount: number; currency: string; status: string; created_at: string }[];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const limit = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      if (search) params.set('search', search);
      if (planFilter) params.set('plan', planFilter);

      const res = await fetch(`/api/sys/users?${params}`);
      const json = await res.json();
      if (json.success) {
        setUsers(json.data.users);
        setTotal(json.data.total);
      }
    } catch {
      console.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [page, search, planFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function viewUser(userId: string) {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/sys/users/${userId}`);
      const json = await res.json();
      if (json.success) setSelectedUser(json.data);
    } catch {
      console.error('Failed to fetch user detail');
    } finally {
      setDetailLoading(false);
    }
  }

  async function updateUser(userId: string, updates: Record<string, string>) {
    try {
      const res = await fetch(`/api/sys/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const json = await res.json();
      if (json.success) {
        fetchUsers();
        if (selectedUser) viewUser(userId);
      }
    } catch {
      alert('Failed to update user');
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{total} total users</p>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search email or name..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        <select
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          <option value="">All Plans</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      {/* Layout: table + detail panel */}
      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Users table */}
        <div className="lg:col-span-3 rounded-xl border border-gray-200 bg-white overflow-hidden dark:border-gray-700 dark:bg-gray-900">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">User</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Plan</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Bots</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Messages</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => viewUser(u.id)}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{u.full_name || 'No name'}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <PlanBadge plan={u.plan_id} status={u.subscription_status} />
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{u.bot_count}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{u.messages_used}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs dark:text-gray-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700">Previous</button>
              <span className="text-sm text-gray-500 dark:text-gray-400">{page} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700">Next</button>
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white overflow-hidden dark:border-gray-700 dark:bg-gray-900">
          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : selectedUser ? (
            <div className="p-4 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {selectedUser.profile.full_name || selectedUser.profile.email}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedUser.profile.email}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Joined {new Date(selectedUser.profile.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Plan management */}
              <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <div className="text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Subscription</div>
                <div className="mt-1 flex items-center gap-2">
                  <PlanBadge
                    plan={selectedUser.subscription?.plan_id ?? 'free'}
                    status={selectedUser.subscription?.status ?? 'none'}
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <select
                    defaultValue={selectedUser.subscription?.plan_id ?? 'free'}
                    onChange={(e) => updateUser(selectedUser.profile.id, { plan_id: e.target.value })}
                    className="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="free">Free</option>
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                  {selectedUser.subscription?.status === 'active' ? (
                    <button
                      onClick={() => updateUser(selectedUser.profile.id, { status: 'canceled' })}
                      className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                    >
                      Suspend
                    </button>
                  ) : (
                    <button
                      onClick={() => updateUser(selectedUser.profile.id, { status: 'active' })}
                      className="rounded bg-green-100 px-2 py-1 text-xs text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                    >
                      Activate
                    </button>
                  )}
                </div>
              </div>

              {/* Bots */}
              <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <div className="text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                  Bots ({selectedUser.bots.length})
                </div>
                {selectedUser.bots.length === 0 ? (
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">No bots</p>
                ) : (
                  <div className="mt-1 space-y-1">
                    {selectedUser.bots.map((bot) => (
                      <div key={bot.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-700 dark:text-gray-300">{bot.name}</span>
                        <span className={bot.is_active ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}>
                          {bot.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Usage */}
              {selectedUser.usage_records.length > 0 && (
                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <div className="text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Current Usage</div>
                  <div className="mt-1 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <div>Messages: {selectedUser.usage_records[0].messages_used}</div>
                    <div>Documents: {selectedUser.usage_records[0].documents_used}</div>
                    <div>Storage: {selectedUser.usage_records[0].storage_used_mb} MB</div>
                  </div>
                </div>
              )}

              {/* Recent Invoices */}
              {selectedUser.invoices.length > 0 && (
                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <div className="text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Recent Invoices</div>
                  <div className="mt-1 space-y-1">
                    {selectedUser.invoices.slice(0, 5).map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">
                          {new Date(inv.created_at).toLocaleDateString()}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${inv.amount} {inv.currency.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-gray-400 dark:text-gray-500">
              Select a user to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PlanBadge({ plan, status }: { plan: string; status: string }) {
  const colors: Record<string, string> = {
    free: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    starter: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    pro: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    enterprise: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };

  return (
    <span className="flex items-center gap-1">
      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${colors[plan] || colors.free}`}>
        {plan}
      </span>
      {status === 'canceled' && (
        <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-600 dark:bg-red-900/30 dark:text-red-400">canceled</span>
      )}
    </span>
  );
}
