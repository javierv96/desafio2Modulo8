const express = require('express');
const { results: agentes } = require('./data/agentes.js');
const app = express();
const jwt = require('jsonwebtoken');
const path = require('path');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = 3000;
const secretKey = 'your-256-bit-secret';

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/SignIn', (req, res) => {
    const { email, password } = req.query;

    const agente = agentes.find((a) => a.email === email && a.password === password);

    if (agente) {
        const token = jwt.sign({
            exp: Math.floor(Date.now() / 1000) + 120, // 2 minutos (120 segundos)
            data: agente
        }, secretKey);

        res.send(`
            <p>Bienvenido, ${email}.</p>
            <a href="/restricted?token=${token}">Ir al Dashboard</a>
            <script>
                sessionStorage.setItem('token', '${token}');
            </script>
        `);
    } else {
        res.status(401).send("Usuario o contraseña incorrecta");
    }
});

const verifyToken = (req, res, next) => {
    const token = req.query.token || req.headers['x-access-token'];

    if (!token) {
        return res.status(401).send("Acceso no autorizado, token es requerido");
    }

    jwt.verify(token, secretKey, (err, user) => {
        if (err) {
            return res.status(403).send("Token inválido o expirado");
        }
        req.user = user;
        next();
    });
};

app.get('/restricted', verifyToken, (req, res) => {
    res.status(200).send(`Bienvenido a la ruta restringida, ${req.user.data.email}`);
});

app.use((req, res) => {
    res.status(404).send('Esta página no existe...');
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});