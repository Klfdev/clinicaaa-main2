const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('server/db.json');
const middlewares = jsonServer.defaults();

// Set default middlewares (logger, static, cors and no-cache)
server.use(middlewares);

// Add custom routes before JSON Server router
server.use(jsonServer.bodyParser);

// Mock Auth Login
server.post('/auth/login', (req, res) => {
    const { email, password } = req.body;
    const db = router.db; // Access lowdb instance
    const user = db.get('users').find({ email, password }).value();

    if (user) {
        res.jsonp({
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            },
            token: 'fake-jwt-token-' + Date.now()
        });
    } else {
        res.status(401).jsonp({ error: "E-mail ou senha inválidos" });
    }
});

// Mock Auth Register
server.post('/auth/register', (req, res) => {
    const { email, password, full_name, clinic_name } = req.body;
    const db = router.db;

    const existingUser = db.get('users').find({ email }).value();
    if (existingUser) {
        return res.status(400).jsonp({ error: "Email já cadastrado" });
    }

    const newUser = {
        id: Date.now().toString(),
        email,
        password,
        full_name,
        clinic_name,
        role: 'owner',
        created_at: new Date().toISOString()
    };

    db.get('users').push(newUser).write();

    res.jsonp({
        user: {
            id: newUser.id,
            email: newUser.email,
            full_name: newUser.full_name,
            role: newUser.role
        },
        token: 'fake-jwt-token-' + Date.now()
    });
});

// Custom RPC route mock for 'create_tenant'
server.post('/rpc/create_tenant', (req, res) => {
    // Just mock success
    res.jsonp({ success: true });
});

// Use default router
server.use(router);

server.listen(3001, () => {
    console.log('BarberPro Local Server is running on port 3001');
});
