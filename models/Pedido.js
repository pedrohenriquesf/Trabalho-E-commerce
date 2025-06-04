const { ObjectId, Decimal128 } = require('mongodb');
const { connectToDatabase } = require('../utils/connection');
const logger = require('../utils/Logger');

class Pedido {
    constructor(usuario_id, itens, status, endereco_entrega, forma_pagamento) {
        if (!usuario_id) {
            const errorMsg = "usuario_id é obrigatório para criar um pedido.";
            logger.warn(errorMsg);
            throw new Error(errorMsg);
        }

        if (!Array.isArray(itens) || itens.length === 0) {
            const errorMsg = "O pedido deve conter ao menos um item.";
            logger.warn(errorMsg, { itens });
            throw new Error(errorMsg);
        }

        if (!status) {
            const errorMsg = "Status é obrigatório para criar um pedido.";
            logger.warn(errorMsg);
            throw new Error(errorMsg);
        }

        if (!endereco_entrega) {
            const errorMsg = "endereco_entrega é obrigatório para criar um pedido.";
            logger.warn(errorMsg);
            throw new Error(errorMsg);
        }

        this.usuario_id = new ObjectId(usuario_id);
        this.endereco_entrega = new ObjectId(endereco_entrega);  

        // Processar os itens para snapshot e cálculo de totais
        this.itens = itens.map(item => {
            const { produto_id, nome_produto, preco_unitario, quantidade } = item;

            if (!produto_id || !nome_produto || preco_unitario == null || quantidade == null) {
                const errorMsg = "Cada item deve ter produto_id, nome_produto, preco_unitario e quantidade.";
                logger.warn(errorMsg, { item });
                throw new Error(errorMsg);
            }

            const precoDecimal = Decimal128.fromString(preco_unitario.toString());
            const qtd = parseInt(quantidade);

            return {
                produto_id: new ObjectId(produto_id),
                nome_produto,
                preco_unitario: precoDecimal,
                quantidade: qtd,
                total_item: Decimal128.fromString((parseFloat(preco_unitario) * qtd).toFixed(2))
            };
        });

        // Cálculo do total_pedido
        const total = this.itens.reduce((acc, item) => {
            return acc + parseFloat(item.total_item.toString());
        }, 0);

        this.total_pedido = Decimal128.fromString(total.toFixed(2));
        this.status = status;
        this.forma_pagamento = forma_pagamento || null;
        this.data_pedido = new Date();

        logger.info("Instância de Pedido criada.", { 
            usuario_id: this.usuario_id, 
            total_pedido: this.total_pedido, 
            endereco_entrega: this.endereco_entrega 
        });
    }

    async inserir() {
        try {
            const { db } = await connectToDatabase();

            const pedidoData = {
                usuario_id: this.usuario_id,
                endereco_entrega: this.endereco_entrega, 
                itens: this.itens,
                total_pedido: this.total_pedido,
                status: this.status,
                forma_pagamento: this.forma_pagamento,
                data_pedido: this.data_pedido
            };

            const result = await db.collection('pedidos').insertOne(pedidoData);

            logger.info("Pedido inserido com sucesso.", { id: result.insertedId });
            return result.insertedId;
        } catch (error) {
            logger.error(`Erro ao inserir pedido: ${error.message}`, { error });
            throw new Error(`Falha ao inserir pedido: ${error.message}`);
        }
    }

    static async buscarPorId(id) {
        if (!id) {
            logger.warn("ID é obrigatório para buscar pedido.");
            throw new Error("ID é obrigatório para buscar pedido.");
        }
        try {
            const { db } = await connectToDatabase();
            const objectId = new ObjectId(id);
            const pedido = await db.collection('pedidos').findOne({ _id: objectId });

            if (pedido) {
                logger.info("Pedido encontrado por ID.", { id });
            } else {
                logger.warn("Pedido não encontrado por ID.", { id });
            }
            return pedido;
        } catch (error) {
            logger.error(`Erro ao buscar pedido por ID '${id}': ${error.message}`, { error, id });
            throw new Error(`Falha ao buscar pedido por ID: ${error.message}`);
        }
    }

    static async buscarTodos() {
        try {
            const { db } = await connectToDatabase();
            const pedidos = await db.collection('pedidos').find({}).toArray();
            logger.info(`Buscou todos os ${pedidos.length} pedidos.`);
            return pedidos;
        } catch (error) {
            logger.error(`Erro ao buscar todos os pedidos: ${error.message}`, { error });
            throw new Error(`Falha ao buscar todos os pedidos: ${error.message}`);
        }
    }

    static async atualizarStatus(id, novoStatus) {
        if (!id) {
            logger.warn("ID é obrigatório para atualizar status do pedido.");
            throw new Error("ID é obrigatório para atualizar status do pedido.");
        }
        if (!novoStatus) {
            logger.warn("Novo status é obrigatório.");
            throw new Error("Novo status é obrigatório.");
        }
        try {
            const { db } = await connectToDatabase();
            const objectId = new ObjectId(id);

            const result = await db.collection('pedidos').updateOne(
                { _id: objectId },
                { $set: { status: novoStatus } }
            );

            if (result.matchedCount === 0) {
                logger.warn("Pedido não encontrado para atualização de status.", { id });
                return false;
            }

            logger.info("Status do pedido atualizado com sucesso.", { id, novoStatus });
            return true;
        } catch (error) {
            logger.error(`Erro ao atualizar status do pedido id=${id}: ${error.message}`, { error, id });
            throw new Error(`Falha ao atualizar status do pedido: ${error.message}`);
        }
    }

    static async deletar(id) {
        if (!id) {
            logger.warn("ID é obrigatório para deletar pedido.");
            throw new Error("ID é obrigatório para deletar pedido.");
        }
        try {
            const { db } = await connectToDatabase();
            const objectId = new ObjectId(id);
            const result = await db.collection('pedidos').deleteOne({ _id: objectId });

            if (result.deletedCount === 0) {
                logger.warn("Pedido não encontrado.", { id });
                return false;
            }
            logger.info("Pedido deletado com sucesso.", { id, deletedCount: result.deletedCount });
            return true;
        } catch (error) {
            logger.error(`Erro ao deletar pedido id=${id}: ${error.message}`, { error, id });
            throw new Error(`Falha ao deletar pedido: ${error.message}`);
        }
    }
}

module.exports = Pedido;
