import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

// Inicializar Firebase
const serviceAccountPath = './serviceAccountKey.json';
if (!fs.existsSync(serviceAccountPath)) {
    console.error(`Erro: Arquivo não encontrado - ${serviceAccountPath}`);
    process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

// Listar coleções principais mapeadas do print
const collections = [
    'agendamentos',
    'estoque',
    'financeiro',
    'pacientes',
    'prontuarios',
    'relatorios',
    'relatorios_vendas',
    'servicos',
    'servicos_produtos',
    'vacinas',
    'vendas'
];

async function dumpCollections() {
    console.log("Iniciando extração do Firebase...");
    const dir = './firebase_dump';

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }

    for (const colName of collections) {
        console.log(`Lendo coleção: ${colName}...`);
        try {
            const snapshot = await db.collection(colName).get();
            const data = [];
            snapshot.forEach(doc => {
                data.push({ id: doc.id, ...doc.data() });
            });

            fs.writeFileSync(`${dir}/${colName}.json`, JSON.stringify(data, null, 2));
            console.log(`  -> ${data.length} documentos salvos em ${dir}/${colName}.json`);
        } catch (error) {
            console.error(`  -> Erro ao ler a coleção ${colName}:`, error.message);
        }
    }

    console.log("Extração concluída!");
}

dumpCollections().catch(console.error);
