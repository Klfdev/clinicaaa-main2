
import { mockDb } from './mockDb';

class MockQueryBuilder {
    constructor(table, client) {
        this.table = table;
        this.client = client;
        this.filters = [];
        this.orders = [];
        this.limitCount = null;
        this.isSingle = false;
        this.selectColumns = '*';

        // Ensure mockDb has the table
        if (!mockDb[table]) {
            mockDb[table] = [];
        }
    }

    select(columns = '*', options = {}) {
        this.selectColumns = columns;
        this.countOption = options.count;
        return this;
    }

    // Filters
    eq(column, value) {
        this.filters.push(item => item[column] == value);
        return this;
    }

    gt(column, value) {
        this.filters.push(item => item[column] > value);
        return this;
    }

    gte(column, value) {
        this.filters.push(item => item[column] >= value);
        return this;
    }

    lt(column, value) {
        this.filters.push(item => item[column] < value);
        return this;
    }

    lte(column, value) {
        this.filters.push(item => item[column] <= value);
        return this;
    }

    // Modifiers
    order(column, { ascending = true } = {}) {
        this.orders.push({ column, ascending });
        return this;
    }

    limit(count) {
        this.limitCount = count;
        return this;
    }

    single() {
        this.isSingle = true;
        return this;
    }

    maybeSingle() {
        this.isSingle = true;
        return this;
    }

    // Execution
    async then(resolve, reject) {
        // Wait a tiny bit to simulate async
        await new Promise(r => setTimeout(r, 50));

        try {
            let data = [...(mockDb[this.table] || [])];

            // 1. Filter
            for (const filter of this.filters) {
                data = data.filter(filter);
            }

            // 2. Sort
            for (const { column, ascending } of this.orders) {
                data.sort((a, b) => {
                    const valA = a[column];
                    const valB = b[column];
                    if (valA < valB) return ascending ? -1 : 1;
                    if (valA > valB) return ascending ? 1 : -1;
                    return 0;
                });
            }

            // Capture count before limit
            const count = data.length;

            // 3. Limit
            if (this.limitCount !== null) {
                data = data.slice(0, this.limitCount);
            }

            // 4. Single
            if (this.isSingle) {
                if (data.length === 0) {
                    // Supabase returns error for .single() if not found, but null for .maybeSingle()
                    // We'll return null to be safe for now
                    resolve({ data: null, error: null });
                } else {
                    resolve({ data: data[0], error: null });
                }
                return;
            }

            resolve({ data: data, error: null, count: this.countOption ? count : null });

        } catch (e) {
            console.error("Mock DB Error", e);
            reject({ data: null, error: e });
        }
    }

    // Writes
    async insert(payload) {
        await new Promise(r => setTimeout(r, 100));
        const items = Array.isArray(payload) ? payload : [payload];
        const newItems = items.map(item => ({
            id: Math.random().toString(36).substr(2, 9),
            created_at: new Date().toISOString(),
            ...item
        }));

        mockDb[this.table].push(...newItems);
        return { data: newItems, error: null };
    }

    async update(payload) {
        // This is complex because we need to know WHICH items to update based on filters
        // For simple ID updates:
        // .eq('id', 1).update({...})

        await new Promise(r => setTimeout(r, 100));

        // Find items matching filters
        let updated = [];
        mockDb[this.table] = mockDb[this.table].map(item => {
            let match = true;
            for (const filter of this.filters) {
                if (!filter(item)) match = false;
            }

            if (match) {
                const newItem = { ...item, ...payload };
                updated.push(newItem);
                return newItem;
            }
            return item;
        });

        return { data: updated, error: null };
    }

    async delete() {
        await new Promise(r => setTimeout(r, 100));

        const initialLen = mockDb[this.table].length;
        mockDb[this.table] = mockDb[this.table].filter(item => {
            let match = true;
            for (const filter of this.filters) {
                if (!filter(item)) match = false;
            }
            return !match; // Keep if it DOESN'T match filter
        });

        return { data: null, error: null, count: initialLen - mockDb[this.table].length };
    }
}

export const mockSupabase = {
    from: (table) => new MockQueryBuilder(table),
    rpc: async (func, params) => {
        console.log(`[MockRPC] ${func}`, params);
        return { data: { success: true }, error: null };
    },
    auth: {
        getUser: async () => {
            const user = localStorage.getItem('mock_user');
            return { data: { user: user ? JSON.parse(user) : null }, error: null };
        },
        signInWithPassword: async ({ email }) => {
            const user = { id: 'mock-user', email, role: 'admin' };
            localStorage.setItem('mock_user', JSON.stringify(user));
            return { data: { user, session: { access_token: 'mock' } }, error: null };
        },
        signOut: async () => {
            localStorage.removeItem('mock_user');
            return { error: null };
        },
        onAuthStateChange: (cb) => {
            const user = localStorage.getItem('mock_user');
            if (user) cb('SIGNED_IN', { user: JSON.parse(user) });
            return { data: { subscription: { unsubscribe: () => { } } } };
        }
    }
};
