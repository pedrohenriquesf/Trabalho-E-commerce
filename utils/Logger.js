const fs = require('fs');
const path = require('path');

// Caminho para o diretório de logs
const logDir = path.join(__dirname, '..', 'logs');
// Caminho para o arquivo de log principal
const logFilePath = path.join(logDir, 'app.log');

//Garante que o diretório de logs exista
//O uso de 'existsSync' e 'mkdirSync' aqui é aceitável, pois só acontece uma vez na inicialização
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true }); //recursive: true cria pastas aninhadas se necessário
}

/**
 * Função interna para gravar mensagens de log.
 * @param {string} level -O nível do log (e.g., 'info', 'warn', 'error', 'debug').
 * @param {string} message -A mensagem principal do log.
 * @param {any} [details] - Detalhes adicionais a serem logados
 */
function writeLog(level, message, details) {
    const timestamp = new Date().toISOString();
    let logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    //Adiciona detalhes se existirem e forem um objeto ou erro
    if (details) {
        try {
            if (details instanceof Error) {
                logEntry += ` - Error: ${details.message} - Stack: ${details.stack}`;
            } else if (typeof details === 'object') {
                logEntry += ` - Details: ${JSON.stringify(details)}`;
            } else {
                logEntry += ` - ${String(details)}`; //Converte para string para outros tipos
            }
        } catch (e) {
            logEntry += ` - Details (parsing error): ${e.message}`;
        }
    }
    logEntry += '\n'; 

    //Imprime no console (para feedback imediato durante o desenvolvimento)
    if (level === 'error' || level === 'warn') {
        console.error(logEntry.trim());
    } else {
        console.log(logEntry.trim());
    }

    //Escreve no arquivo de log de forma assíncrona
    fs.appendFile(logFilePath, logEntry, (err) => {
        if (err) {
            console.error(`Falha ao escrever no arquivo de log '${logFilePath}':`, err);
        }
    });
}

const logger = {
    info: (message, details) => writeLog('info', message, details),
    warn: (message, details) => writeLog('warn', message, details),
    error: (message, details) => writeLog('error', message, details),
    debug: (message, details) => writeLog('debug', message, details),
};

module.exports = logger;