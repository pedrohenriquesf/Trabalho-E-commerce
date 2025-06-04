require('dotenv').config();

const { MongoClient, ServerApiVersion } = require('mongodb');
const logger = require('./Logger');

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGO_DB_NAME;

let cachedClient = null;

async function connectToDatabase() {
    if (cachedClient) {
        logger.info("Reutilizando conexão MongoDB.");
        const db = cachedClient.db(dbName);
        return { db, client: cachedClient };
    }
    try {
        const client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            }
        });

        await client.connect();
        cachedClient = client;

        logger.info("Conectado ao MongoDB.");
        const db = client.db(dbName);
        return { db, client };
    } catch (error) {
        logger.error("Erro ao conectar ao MongoDB:", error);
        throw error;
    }
}

async function closeDatabaseConnection() {
    if (cachedClient) {
        try {
            await cachedClient.close();
            logger.info("Conexão MongoDB fechada.");
            cachedClient = null;
        } catch (error) {
            logger.error("Erro ao fechar conexão MongoDB:", error);
        }
    }
}

process.on('SIGINT', async () => {
    logger.warn("SIGINT recebido. Fechando conexão MongoDB...");
    await closeDatabaseConnection();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    logger.warn("SIGTERM recebido. Fechando conexão MongoDB...");
    await closeDatabaseConnection();
    process.exit(0);
});
process.on('beforeExit', async () => {
    await closeDatabaseConnection();
});

module.exports = { connectToDatabase, closeDatabaseConnection };
