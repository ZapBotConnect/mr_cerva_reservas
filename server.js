const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const qrCode = require('qrcode'); // Gera QR Code PIX
const app = express();
const PORT = 5000;

// Configuração do Express
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Banco de Dados SQLite
const db = new sqlite3.Database('./reservas.db', (err) => {
    if (err) console.error('Erro ao conectar banco:', err.message);
    console.log('Banco de dados conectado com sucesso.');
});

// Cria a tabela se não existir
db.run(`CREATE TABLE IF NOT EXISTS reservas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    convidados INTEGER NOT NULL,
    data TEXT NOT NULL,
    hora TEXT NOT NULL,
    status TEXT DEFAULT 'PENDENTE'
)`);

// Rota para fazer reserva
app.post('/reserva', async (req, res) => {
    const { nome, convidados, data, hora } = req.body;

    // Verificar o número total de reservas para o dia
    db.get(`SELECT COUNT(*) AS total FROM reservas WHERE data = ?`, [data], async (err, row) => {
        if (err) return res.status(500).json({ error: 'Erro no banco de dados' });
        
        if (row.total >= 70) {
            return res.status(400).json({ error: 'Limite de reservas atingido para esta data' });
        }
        
        // Insere a reserva com status PENDENTE
        db.run(
            `INSERT INTO reservas (nome, convidados, data, hora) VALUES (?, ?, ?, ?)`,
            [nome, convidados, data, hora],
            async function (err) {
                if (err) return res.status(500).json({ error: 'Erro ao criar reserva' });

                // Gerar QR Code PIX (simula um valor de R$ 100)
                const pixPayload = `00020101021126580014BR.GOV.BCB.PIX5204000053039865802BR5913Mr. Cerva Bar6009Sao Paulo62070503***6304D9F5`;
                const qrCodePix = await qrCode.toDataURL(pixPayload);
                
                res.json({
                    message: 'Reserva feita! Aguarde a confirmação do PIX.',
                    qrCode: qrCodePix
                });
            }
        );
    });
});

// Rota para verificar reservas
app.get('/reservas', (req, res) => {
    db.all(`SELECT * FROM reservas`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Erro ao consultar reservas' });
        res.json(rows);
    });
});

// Inicia o Servidor na Porta 5000
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

