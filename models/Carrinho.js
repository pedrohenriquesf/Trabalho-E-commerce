const { ObjectId, Decimal128 } = require('mongodb');
const { connectToDatabase } = require('../utils/connection');
const logger = require('../utils/Logger');

class Carrinho {
    constructor(usuario_id, itens) {
        if (!usuario_id) {
            const errorMsg = "usuario_id é obrigatório para associar o carrinho a um usuário.";
            logger.warn(errorMsg);
            throw new Error(errorMsg);
        }
        try {
            this.usuario_id = ObjectId.createFromHexString(usuario_id);
        } catch (e) {
            const errorMsg = `ID de usuário inválido para o carrinho: ${usuario_id}. Detalhes: ${e.message}`;
            logger.error(errorMsg, { usuario_id, error: e });
            throw new Error(errorMsg);
        }
        if (!Array.isArray(itens) || itens.length === 0) {
            const errorMsg = "O carrinho deve conter ao menos um item.";
            logger.warn(errorMsg, { itens });
            throw new Error(errorMsg);
        }

        let totalCarrinhoNumerico = 0;

        this.itens = itens.map(item => {
            if (!item.produto_id || item.preco == null || item.quantidade == null) {
                const errorMsg = "Cada item deve ter produto_id, preco e quantidade.";
                logger.warn(errorMsg, { item });
                throw new Error(errorMsg);
            }

            const precoDecimal = Decimal128.fromString(item.preco.toString());
            const quantidade = parseInt(item.quantidade);

            return {
                produto_id: new ObjectId(item.produto_id),
                preco: precoDecimal,
                quantidade,
                total: Decimal128.fromString((parseFloat(item.preco) * quantidade).toFixed(2))
            };
        });

        //Cálculo do total geral do carrinho
        const totalCarrinho = this.itens.reduce((acc, item) => {
            return acc + parseFloat(item.total.toString());
        }, 0);

        this.total = Decimal128.fromString(totalCarrinho.toFixed(2));
        this.usuario_id = new ObjectId(usuario_id);
        this.data_criacao = new Date();

        logger.info("Instância de Carrinho criada.", { itens: this.itens.length, usuario_id: this.usuario_id, total: this.total });
    }

    async inserir() {
        try {
            const { db } = await connectToDatabase();

            const carrinhoData = {
                itens: this.itens,
                total: this.total,
                usuario_id: this.usuario_id,
                data_criacao: this.data_criacao
            };

            const result = await db.collection('carrinhos').insertOne(carrinhoData);

            logger.info("Carrinho inserido com sucesso.", { id: result.insertedId });
            return result.insertedId;
        } catch (error) {
            logger.error(`Erro ao inserir carrinho: ${error.message}`, { error });
            throw new Error(`Falha ao inserir carrinho: ${error.message}`);
        }
    }

    static async buscarPorId(id) {
        if (!id) {
            logger.warn("ID é obrigatório para buscar carrinho.");
            throw new Error("ID é obrigatório para buscar carrinho.");
        }
        try {
            const { db } = await connectToDatabase();
            const objectId = new ObjectId(id);
            const carrinho = await db.collection('carrinhos').findOne({ _id: objectId });

            if (carrinho) {
                logger.info("Carrinho encontrado por ID.", { id });
            } else {
                logger.warn("Carrinho não encontrado por ID.", { id });
            }
            return carrinho;
        } catch (error) {
            logger.error(`Erro ao buscar carrinho por ID '${id}': ${error.message}`, { error, id });
            throw new Error(`Falha ao buscar carrinho por ID: ${error.message}`);
        }
    }

    static async buscarTodos() {
        try {
            const { db } = await connectToDatabase();
            const carrinhos = await db.collection('carrinhos').find({}).toArray();
            logger.info(`Buscou todos os ${carrinhos.length} carrinhos.`);
            return carrinhos;
        } catch (error) {
            logger.error(`Erro ao buscar todos os carrinhos: ${error.message}`, { error });
            throw new Error(`Falha ao buscar todos os carrinhos: ${error.message}`);
        }
    }

    static async atualizar(id, updateItens, usuario_id) {
        if (!id) {
            logger.warn("ID é obrigatório para atualizar carrinho.");
            throw new Error("ID é obrigatório para atualizar carrinho.");
        }
        if (!Array.isArray(updateItens) || updateItens.length === 0) {
            logger.warn("Atualização do carrinho requer ao menos um item.", { updateItens });
            throw new Error("Atualização do carrinho requer ao menos um item.");
        }
        if (!usuario_id) {
            logger.warn("usuario_id é obrigatório para atualizar o carrinho.");
            throw new Error("usuario_id é obrigatório para atualizar o carrinho.");
        }

        const itensAtualizados = updateItens.map(item => {
            if (!item.produto_id || item.preco == null || item.quantidade == null) {
                const errorMsg = "Cada item deve ter produto_id, preco e quantidade.";
                logger.warn(errorMsg, { item });
                throw new Error(errorMsg);
            }

            const precoDecimal = Decimal128.fromString(item.preco.toString());
            const quantidade = parseInt(item.quantidade);

            return {
                produto_id: new ObjectId(item.produto_id),
                preco: precoDecimal,
                quantidade,
                total: Decimal128.fromString((parseFloat(item.preco) * quantidade).toFixed(2))
            };
        });

        const totalCarrinho = itensAtualizados.reduce((acc, item) => {
            return acc + parseFloat(item.total.toString());
        }, 0);

        try {
            const { db } = await connectToDatabase();
            const objectId = new ObjectId(id);

            const updateFields = {
                itens: itensAtualizados,
                total: Decimal128.fromString(totalCarrinho.toFixed(2)),
                usuario_id: new ObjectId(usuario_id)
            };

            const result = await db.collection('carrinhos').updateOne(
                { _id: objectId },
                { $set: updateFields }
            );

            if (result.matchedCount === 0) {
                logger.warn("Carrinho não encontrado para atualização.", { id });
                return false;
            }
            logger.info("Carrinho atualizado com sucesso.", { id, modifiedCount: result.modifiedCount });
            return result.modifiedCount > 0;
        } catch (error) {
            logger.error(`Erro ao atualizar carrinho id=${id}: ${error.message}`, { error, id });
            throw new Error(`Falha ao atualizar carrinho: ${error.message}`);
        }
    }

    static async deletar(id) {
        if (!id) {
            logger.warn("ID é obrigatório para deletar carrinho.");
            throw new Error("ID é obrigatório para deletar carrinho.");
        }
        try {
            const { db } = await connectToDatabase();
            const objectId = new ObjectId(id);
            const result = await db.collection('carrinhos').deleteOne({ _id: objectId });

            if (result.deletedCount === 0) {
                logger.warn("Carrinho não encontrado.", { id });
                return false;
            }
            logger.info("Carrinho deletado com sucesso.", { id, deletedCount: result.deletedCount });
            return true;
        } catch (error) {
            logger.error(`Erro ao deletar carrinho id=${id}: ${error.message}`, { error, id });
            throw new Error(`Falha ao deletar carrinho: ${error.message}`);
        }
    }
}

module.exports = Carrinho;
