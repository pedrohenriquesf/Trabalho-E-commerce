const { ObjectId } = require('mongodb');
const { connectToDatabase } = require('../utils/connection');
const logger = require('../utils/Logger');

class Categoria {
    constructor(nome, descricao) {
        if (!nome || !descricao) {
            const errorMsg = "Todos os campos são obrigatórios.";
            logger.warn(errorMsg, { nome, descricao });
            throw new Error(errorMsg);
        }

        this.nome = nome;
        this.descricao = descricao;
        //this.data_cadastro = new Date();

        logger.info("Instância de Categoria criada.", { nome: this.nome });
    }

    async inserir() {
        try {
            const { db } = await connectToDatabase();

            const result = await db.collection('categorias').insertOne({
                nome: this.nome,
                descricao: this.descricao
                //data_cadastro: this.data_cadastro
            });

            logger.info("Categoria inserida com sucesso.", { id: result.insertedId, nome: this.nome });
            return result.insertedId;
        } catch (error) {
            logger.error(`Erro ao inserir categoria: ${error.message}`, { error, nome: this.nome });
            throw new Error(`Falha ao inserir categoria: ${error.message}`);
        }
    }

    static async buscarPorId(id) {
        if (!id) {
            logger.warn("ID é obrigatório para buscar categoria.");
            throw new Error("ID é obrigatório para buscar categoria.");
        }
        try {
            const { db } = await connectToDatabase();
            const objectId = new ObjectId(id);
            const categoria = await db.collection('categorias').findOne({ _id: objectId });

            if (categoria) {
                logger.info("Categoria encontrada por ID.", { id });
            } else {
                logger.warn("Categoria não encontrada por ID.", { id });
            }
            return categoria;
        } catch (error) {
            logger.error(`Erro ao buscar categoria por ID '${id}': ${error.message}`, { error, id });
            throw new Error(`Falha ao buscar categoria por ID: ${error.message}`);
        }
    }

    static async buscarTodos() {
        try {
            const { db } = await connectToDatabase();
            const categorias = await db.collection('categorias').find({}).toArray();
            logger.info(`Buscou todas as ${categorias.length} categorias.`);
            return categorias;
        } catch (error) {
            logger.error(`Erro ao buscar todas as categorias: ${error.message}`, { error });
            throw new Error(`Falha ao buscar todas as categorias: ${error.message}`);
        }
    }

    static async atualizar(id, updateData) {
        if (!id) {
            logger.warn("ID é obrigatório para atualizar categoria.");
            throw new Error("ID é obrigatório para atualizar categoria.");
        }
        if (!updateData.nome || !updateData.descricao) {
            logger.warn("Todos os campos são obrigatórios na atualização: nome e descricao.", { updateData });
            throw new Error("Todos os campos são obrigatórios na atualização: nome e descricao.");
        }

        try {
            const { db } = await connectToDatabase();
            const objectId = new ObjectId(id);

            const result = await db.collection('categorias').updateOne(
                { _id: objectId },
                { $set: updateData }
            );

            if (result.matchedCount === 0) {
                logger.warn("Categoria não encontrada para atualização.", { id, updateData });
                return false;
            }
            logger.info("Categoria atualizada com sucesso.", { id, modifiedCount: result.modifiedCount });
            return result.modifiedCount > 0;
        } catch (error) {
            logger.error(`Erro ao atualizar categoria id=${id}: ${error.message}`, { error, id, updateData });
            throw new Error(`Falha ao atualizar categoria: ${error.message}`);
        }
    }

    static async deletar(id) {
        if (!id) {
            logger.warn("ID é obrigatório para deletar categoria.");
            throw new Error("ID é obrigatório para deletar categoria.");
        }
        try {
            const { db } = await connectToDatabase();
            const objectId = new ObjectId(id);
            const result = await db.collection('categorias').deleteOne({ _id: objectId });

            if (result.deletedCount === 0) {
                logger.warn("Categoria não encontrada.", { id });
                return false;
            }
            logger.info("Categoria deletada com sucesso.", { id, deletedCount: result.deletedCount });
            return true;
        } catch (error) {
            logger.error(`Erro ao deletar categoria id=${id}: ${error.message}`, { error, id });
            throw new Error(`Falha ao deletar categoria: ${error.message}`);
        }
    }
}

module.exports = Categoria;
