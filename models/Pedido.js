const { ObjectId, Decimal128 } = require('mongodb');
const { connectToDatabase, closeDatabaseConnection } = require('../utils/connection');
const logger = require('../utils/Logger');

class Pedido {
    constructor(usuario_id, itens, status, forma_pagamento, endereco_entrega) {
        if (!usuario_id) {
            const errorMsg = "usuario_id é obrigatório para criar um pedido.";
            logger.warn(errorMsg);
            throw new Error(errorMsg);
        }

        try {
            this.usuario_id = ObjectId.createFromHexString(usuario_id);
        } catch (e) {
            const errorMsg = `ID de usuário inválido para o pedido.`;
            logger.error(errorMsg, { usuario_id, error: e });
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

        if (!forma_pagamento) { 
            const errorMsg = "Forma de pagamento é obrigatória para criar um pedido.";
            logger.warn(errorMsg);
            throw new Error(errorMsg);
        }

        if (!endereco_entrega  || typeof endereco_entrega !== 'object' || Object.keys(endereco_entrega).length === 0) {
            const errorMsg = "endereco_entrega é obrigatório para criar um pedido.";
            logger.warn(errorMsg);
            throw new Error(errorMsg);
        }

        this.endereco_entrega = endereco_entrega; 
        this.status = status;
        this.forma_pagamento = forma_pagamento;

        //processa os itens para snapshot e cálculo de totais
        let totalPedidoNumerico = 0; //calcula o total geral do pedido
        
        this.itens = itens.map(item => {
            const { produto_id, nome_produto, preco_unitario, quantidade } = item;

            if (!produto_id || !nome_produto || preco_unitario == null || quantidade == null) {
                const errorMsg = "Cada item deve ter produto_id, nome_produto, preco e quantidade.";
                logger.warn(errorMsg, { item });
                throw new Error(errorMsg);
            }

            let produtoObjectId;
            try {
                produtoObjectId = ObjectId.createFromHexString(produto_id);
            } catch (e) {
                const errorMsg = `ID de produto inválido: ${produto_id}`;
                logger.error(errorMsg, { item, error: e });
                throw new Error(errorMsg);
            }

            const precoDecimal = Decimal128.fromString(preco_unitario.toString());
            const qtd = parseInt(quantidade);
            const itemTotalNumerico = parseFloat(preco_unitario) * qtd; //calcula o total para este item
            const itemTotalDecimal = Decimal128.fromString(itemTotalNumerico.toFixed(2));

            totalPedidoNumerico += itemTotalNumerico; //soma do total geral do pedido

            return {
                produto_id: produtoObjectId,
                nome_produto,
                preco_unitario: precoDecimal,
                quantidade: qtd,
                total_item: itemTotalDecimal
            };
        });

        // Cálculo do total_pedido
        this.total_pedido = Decimal128.fromString(totalPedidoNumerico.toFixed(2));
        this.data_pedido = new Date();

        logger.info("Instância de Pedido criada.", { 
            usuario_id: this.usuario_id.toHexString(),
            total_pedido: this.total_pedido.toString(), 
            status: this.status,
            forma_pagamento: this.forma_pagamento,
            endereco_entrega: this.endereco_entrega 
        });
    }

    async inserir() {
        let client;
        try {
            const { db, client: connectedClient } = await connectToDatabase();
            client = connectedClient;

            const pedidoData = {
                usuario_id: this.usuario_id,
                itens: this.itens,
                total_pedido: this.total_pedido,
                status: this.status,
                forma_pagamento: this.forma_pagamento,
                endereco_entrega: this.endereco_entrega, 
                data_pedido: this.data_pedido
            };

            const result = await db.collection('pedidos').insertOne(pedidoData);

            logger.info("Pedido inserido com sucesso.", { id: result.insertedId });
            return result.insertedId;
        } catch (error) {
            logger.error(`Erro ao inserir pedido: ${error.message}`, { error });
            throw new Error(`Falha ao inserir pedido: ${error.message}`);
        } finally {
            if (client) {
                await closeDatabaseConnection();
            }
        }
    }

    static async buscarPorId(id) {
        let client;
        if (!id) {
            logger.warn("ID é obrigatório para buscar pedido.");
            throw new Error("ID é obrigatório para buscar pedido.");
        }
        try {
            const { db, client: connectedClient } = await connectToDatabase();
            client = connectedClient;

            const objectId = ObjectId.createFromHexString(id);
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
        } finally {
            if (client) {
                await closeDatabaseConnection();
            }
        }
    }

    static async buscarTodos() {
        let client;
        try {
            const { db, client: connectedClient } = await connectToDatabase();
            client = connectedClient;

            const pedidos = await db.collection('pedidos').find({}).toArray();
            logger.info(`Buscou todos os ${pedidos.length} pedidos.`);
            return pedidos;
        } catch (error) {
            logger.error(`Erro ao buscar todos os pedidos: ${error.message}`, { error });
            throw new Error(`Falha ao buscar todos os pedidos: ${error.message}`);
        } finally {
            if (client) {
                await closeDatabaseConnection();
            }
        }
    }

    static async atualizar(id, updateData) {
        let client;
        if (!id) {
            logger.warn("ID é obrigatório para atualizar  pedido.");
            throw new Error("ID é obrigatório para atualizar pedido.");
        }
        if (!updateData || Object.keys(updateData).length === 0) {
            logger.warn("Dados de atualização são obrigatórios.");
            throw new Error("Dados de atualização são obrigatórios.");
        }
        try {
            const { db, client: connectedClient } = await connectToDatabase();
            client = connectedClient;
            
            const objectId = ObjectId.createFromHexString(id);
            const fieldsToSet = {};

            if (updateData.status) {
                fieldsToSet.status = updateData.status;
            }
            if (updateData.forma_pagamento) {
                fieldsToSet.forma_pagamento = updateData.forma_pagamento;
            }

            if (updateData.endereco_entrega) {
                if (typeof updateData.endereco_entrega !== 'object' || Object.keys(updateData.endereco_entrega).length === 0) {
                    throw new Error("Endereço de entrega deve ser um objeto válido.");
                }
                fieldsToSet.endereco_entrega = updateData.endereco_entrega;
            }

            if (updateData.itens && Array.isArray(updateData.itens) && updateData.itens.length > 0) {
                let updatedTotalNumerico = 0;
                fieldsToSet.itens = updateData.itens.map(item => {
                    if (!item.produto_id || !item.nome_produto || item.preco_unitario == null || item.quantidade == null) {
                        throw new Error("Cada item na atualização deve ter produto_id, nome_produto, preco_unitario e quantidade.");
                    }

                    let produtoObjectId; 
                    try {
                        produtoObjectId = ObjectId.createFromHexString(item.produto_id); 
                    } catch (e) {
                        throw new Error(`ID de produto inválido em item de atualização do pedido: ${item.produto_id}`);
                    }

                    const precoDecimal = Decimal128.fromString(item.preco_unitario.toString());
                    const qtd = parseInt(item.quantidade);
                    const itemTotalNumerico = parseFloat(item.preco_unitario) * qtd;
                    const itemTotalDecimal = Decimal128.fromString(itemTotalNumerico.toFixed(2));

                    updatedTotalNumerico += itemTotalNumerico;

                    return {
                        produto_id: produtoObjectId,
                        nome_produto: item.nome_produto,
                        preco_unitario: precoDecimal,
                        quantidade: qtd,
                        total_item: itemTotalDecimal
                    };
                });
                fieldsToSet.total_pedido = Decimal128.fromString(updatedTotalNumerico.toFixed(2));
            }

            const result = await db.collection('pedidos').updateOne(
                { _id: objectId },
                { $set: fieldsToSet }
            );

            if (result.matchedCount === 0) {
                logger.warn("Pedido não encontrado para atualização.", { id, updateData });
                return false;
            }

            logger.info("Pedido atualizado com sucesso.", { id, modifiedCount: result.modifiedCount});
            return result.modifiedCount > 0;
        } catch (error) {
            logger.error(`Erro ao atualizar pedido id=${id}: ${error.message}`, { error, id, updateData });
            throw new Error(`Falha ao atualizar pedido: ${error.message}`);
        } finally {
            if (client) {
                await closeDatabaseConnection();
            }
        }
    }

    static async deletar(id) {
        let client;
        if (!id) {
            logger.warn("ID é obrigatório para deletar pedido.");
            throw new Error("ID é obrigatório para deletar pedido.");
        }
        try {
            const { db, client: connectedClient } = await connectToDatabase();
            client = connectedClient;

            const objectId = ObjectId.createFromHexString(id);
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
        } finally {
            if (client) {
                await closeDatabaseConnection();
            }
        }
    }
}

module.exports = Pedido;
