const { ObjectId, Decimal128 } = require('mongodb');
const { connectToDatabase } = require('../utils/connection');
const logger = require('../utils/Logger');

class Produto {
    constructor(nome, preco, categoria_id, marca, descricao) {
        if (!nome || preco == null || !categoria_id || !marca || !descricao) {
            const errorMsg = "Todos os campos são obrigatórios!";
            logger.warn(errorMsg, { nome, preco, categoria_id, marca, descricao });
            throw new Error(errorMsg);
        }

        this.nome = nome;
        this.preco = Decimal128.fromString(preco.toString());
        this.categoria_id = new ObjectId(categoria_id);
        this.marca = marca;
        this.descricao = descricao;
        //this.data_cadastro = new Date();

        logger.info("Instância de Produto criada.", { nome: this.nome });
    }

    async inserir() {
        try {
            const { db } = await connectToDatabase();

            const result = await db.collection('produtos').insertOne({
                nome: this.nome,
                preco: this.preco,
                categoria_id: this.categoria_id,
                marca: this.marca,
                descricao: this.descricao
                //data_cadastro: this.data_cadastro
            });

            logger.info("Produto inserido com sucesso.", { id: result.insertedId, nome: this.nome });
            return result.insertedId;
        } catch (error) {
            logger.error(`Erro ao inserir produto: ${error.message}`, { error, nome: this.nome });
            throw new Error(`Falha ao inserir produto: ${error.message}`);
        }
    }

    static async buscarPorId(id) {
        if (!id) {
            logger.warn("ID é obrigatório para buscar produto.");
            throw new Error("ID é obrigatório para buscar produto.");
        }
        try {
            const { db } = await connectToDatabase();
            const objectId = new ObjectId(id);
            const produto = await db.collection('produtos').findOne({ _id: objectId });

            if (produto) {
                logger.info("Produto encontrado por ID.", { id });
            } else {
                logger.warn("Produto não encontrado por ID.", { id });
            }
            return produto;
        } catch (error) {
            logger.error(`Erro ao buscar produto por ID '${id}': ${error.message}`, { error, id });
            throw new Error(`Falha ao buscar produto por ID: ${error.message}`);
        }
    }

    static async buscarTodos() {
        try {
            const { db } = await connectToDatabase();
            const produtos = await db.collection('produtos').find({}).toArray();
            logger.info(`Buscou todos os ${produtos.length} produtos.`);
            return produtos;
        } catch (error) {
            logger.error(`Erro ao buscar todos os produtos: ${error.message}`, { error });
            throw new Error(`Falha ao buscar todos os produtos: ${error.message}`);
        }
    }

    static async atualizar(id, updateData) {
        if (!id) {
            logger.warn("ID é obrigatório para atualizar produto.");
            throw new Error("ID é obrigatório para atualizar produto.");
        }

        const requiredFields = ['nome', 'preco', 'categoria_id', 'marca', 'descricao'];
        for (const field of requiredFields) {
            if (!(field in updateData)) {
                logger.warn(`Campo obrigatório '${field}' ausente na atualização.`, { updateData });
                throw new Error(`Campo obrigatório '${field}' ausente na atualização.`);
            }
        }

        try {
            const { db } = await connectToDatabase();
            const objectId = new ObjectId(id);

            updateData.preco = Decimal128.fromString(updateData.preco.toString());
            updateData.categoria_id = new ObjectId(updateData.categoria_id);

            const result = await db.collection('produtos').updateOne(
                { _id: objectId },
                { $set: updateData }
            );

            if (result.matchedCount === 0) {
                logger.warn("Produto não encontrado para atualização.", { id, updateData });
                return false;
            }
            logger.info("Produto atualizado com sucesso.", { id, modifiedCount: result.modifiedCount });
            return result.modifiedCount > 0;
        } catch (error) {
            logger.error(`Erro ao atualizar produto id=${id}: ${error.message}`, { error, id, updateData });
            throw new Error(`Falha ao atualizar produto: ${error.message}`);
        }
    }

    static async deletar(id) {
        if (!id) {
            logger.warn("ID é obrigatório para deletar produto.");
            throw new Error("ID é obrigatório para deletar produto.");
        }
        try {
            const { db } = await connectToDatabase();
            const objectId = new ObjectId(id);
            const result = await db.collection('produtos').deleteOne({ _id: objectId });

            if (result.deletedCount === 0) {
                logger.warn("Produto não encontrado.", { id });
                return false;
            }
            logger.info("Produto deletado com sucesso.", { id, deletedCount: result.deletedCount });
            return true;
        } catch (error) {
            logger.error(`Erro ao deletar produto id=${id}: ${error.message}`, { error, id });
            throw new Error(`Falha ao deletar produto: ${error.message}`);
        }
    }
}

module.exports = Produto;
