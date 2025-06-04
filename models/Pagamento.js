const { ObjectId, Decimal128 } = require('mongodb');
const { connectToDatabase } = require('../utils/connection');
const logger = require('../utils/Logger');

class Pagamento {
    constructor(pedido_id, valor, status, metodo_pagamento) {
        if (!pedido_id) {
            const errorMsg = "pedido_id é obrigatório para criar um pagamento.";
            logger.warn(errorMsg);
            throw new Error(errorMsg);
        }

        if (valor == null) {
            const errorMsg = "valor é obrigatório para criar um pagamento.";
            logger.warn(errorMsg);
            throw new Error(errorMsg);
        }

        if (!status) {
            const errorMsg = "status é obrigatório para criar um pagamento.";
            logger.warn(errorMsg);
            throw new Error(errorMsg);
        }

        if (!metodo_pagamento) {
            const errorMsg = "metodo_pagamento é obrigatório para criar um pagamento.";
            logger.warn(errorMsg);
            throw new Error(errorMsg);
        }

        this.pedido_id = new ObjectId(pedido_id);
        this.valor = Decimal128.fromString(valor.toString());
        this.status = status; 
        this.metodo_pagamento = metodo_pagamento;  
        this.data_pagamento = new Date();

        logger.info("Instância de Pagamento criada.", {
            pedido_id: this.pedido_id,
            valor: this.valor,
            status: this.status,
            metodo_pagamento: this.metodo_pagamento
        });
    }

    async inserir() {
        try {
            const { db } = await connectToDatabase();

            const pagamentoData = {
                pedido_id: this.pedido_id,
                valor: this.valor,
                status: this.status,
                metodo_pagamento: this.metodo_pagamento,
                data_pagamento: this.data_pagamento
            };

            const result = await db.collection('pagamentos').insertOne(pagamentoData);

            logger.info("Pagamento inserido com sucesso.", { id: result.insertedId });
            return result.insertedId;
        } catch (error) {
            logger.error(`Erro ao inserir pagamento: ${error.message}`, { error });
            throw new Error(`Falha ao inserir pagamento: ${error.message}`);
        }
    }

    static async buscarPorId(id) {
        if (!id) {
            logger.warn("ID é obrigatório para buscar pagamento.");
            throw new Error("ID é obrigatório para buscar pagamento.");
        }
        try {
            const { db } = await connectToDatabase();
            const objectId = new ObjectId(id);
            const pagamento = await db.collection('pagamentos').findOne({ _id: objectId });

            if (pagamento) {
                logger.info("Pagamento encontrado por ID.", { id });
            } else {
                logger.warn("Pagamento não encontrado por ID.", { id });
            }
            return pagamento;
        } catch (error) {
            logger.error(`Erro ao buscar pagamento por ID '${id}': ${error.message}`, { error, id });
            throw new Error(`Falha ao buscar pagamento por ID: ${error.message}`);
        }
    }

    static async buscarTodos() {
        try {
            const { db } = await connectToDatabase();
            const pagamentos = await db.collection('pagamentos').find({}).toArray();
            logger.info(`Buscou todos os ${pagamentos.length} pagamentos.`);
            return pagamentos;
        } catch (error) {
            logger.error(`Erro ao buscar todos os pagamentos: ${error.message}`, { error });
            throw new Error(`Falha ao buscar todos os pagamentos: ${error.message}`);
        }
    }

    static async atualizarStatus(id, novoStatus) {
        if (!id) {
            logger.warn("ID é obrigatório para atualizar status do pagamento.");
            throw new Error("ID é obrigatório para atualizar status do pagamento.");
        }
        if (!novoStatus) {
            logger.warn("Novo status é obrigatório.");
            throw new Error("Novo status é obrigatório.");
        }
        try {
            const { db } = await connectToDatabase();
            const objectId = new ObjectId(id);

            const result = await db.collection('pagamentos').updateOne(
                { _id: objectId },
                { $set: { status: novoStatus } }
            );

            if (result.matchedCount === 0) {
                logger.warn("Pagamento não encontrado para atualização de status.", { id });
                return false;
            }

            logger.info("Status do pagamento atualizado com sucesso.", { id, novoStatus });
            return true;
        } catch (error) {
            logger.error(`Erro ao atualizar status do pagamento id=${id}: ${error.message}`, { error, id });
            throw new Error(`Falha ao atualizar status do pagamento: ${error.message}`);
        }
    }

    static async deletar(id) {
        if (!id) {
            logger.warn("ID é obrigatório para deletar pagamento.");
            throw new Error("ID é obrigatório para deletar pagamento.");
        }
        try {
            const { db } = await connectToDatabase();
            const objectId = new ObjectId(id);
            const result = await db.collection('pagamentos').deleteOne({ _id: objectId });

            if (result.deletedCount === 0) {
                logger.warn("Pagamento não encontrado.", { id });
                return false;
            }
            logger.info("Pagamento deletado com sucesso.", { id, deletedCount: result.deletedCount });
            return true;
        } catch (error) {
            logger.error(`Erro ao deletar pagamento id=${id}: ${error.message}`, { error, id });
            throw new Error(`Falha ao deletar pagamento: ${error.message}`);
        }
    }
}

module.exports = Pagamento;
