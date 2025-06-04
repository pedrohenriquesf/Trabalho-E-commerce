const { ObjectId } = require('mongodb');
const { connectToDatabase } = require('../utils/connection');
const logger = require('../utils/Logger');

class Usuario {
    constructor(nome, email, senha, telefone, endereco) {
        if (!nome || !email || !senha) {
            const errorMsg = "Campos obrigatórios: nome, email, senha.";
            logger.warn(errorMsg, { nome, email });
            throw new Error(errorMsg);
        }

        this.nome = nome;
        this.email = email;
        this.telefone = telefone || null;
        this.endereco = endereco || null;
        this.senha = senha;

        logger.info("Instância de Usuário criada.", { email: this.email });
    }

    async inserir() {
        try {
            const { db } = await connectToDatabase();

            const result = await db.collection('usuarios').insertOne({
                nome: this.nome,
                email: this.email,
                telefone: this.telefone,
                endereco: this.endereco,
                senha: this.senha
            });

            logger.info("Usuário inserido com sucesso.", { id: result.insertedId, email: this.email });
            return result.insertedId;
        } catch (error) {
            logger.error(`Erro ao inserir usuário: ${error.message}`, { error, email: this.email });
            throw new Error(`Falha ao inserir usuário: ${error.message}`);
        }
    }

    static async buscarPorId(id) {
        if (!id) {
            logger.warn("ID é obrigatório para buscar usuário.");
            throw new Error("ID é obrigatório para buscar usuário.");
        }
        try {
            const { db } = await connectToDatabase();

            const objectId = new ObjectId(id);
            const usuario = await db.collection('usuarios').findOne({ _id: objectId });

            if (usuario) {
                logger.info("Usuário encontrado por ID.", { id });
            } else {
                logger.warn("Usuário não encontrado por ID.", { id });
            }
            return usuario;
        } catch (error) {
            logger.error(`Erro ao buscar usuário por ID '${id}': ${error.message}`, { error, id });
            if (error.name === 'BSONTypeError' || error.message.includes('Argument passed in must be a string of 12 bytes or a string of 24 hex characters or an integer')) {
                throw new Error(`ID de usuário inválido: ${id}`);
            }
            throw new Error(`Falha ao buscar usuário por ID: ${error.message}`);
        }
    }

    static async buscarTodos() {
        try {
            const { db } = await connectToDatabase();

            const usuarios = await db.collection('usuarios').find({}).toArray();
            logger.info(`Buscou todos os ${usuarios.length} usuários.`);
            return usuarios;
        } catch (error) {
            logger.error(`Erro ao buscar todos os usuários: ${error.message}`, { error });
            throw new Error(`Falha ao buscar todos os usuários: ${error.message}`);
        }
    }

    static async atualizar(id, updateData) {
        if (!id) {
            logger.warn("ID é obrigatório para atualizar usuário.");
            throw new Error("ID é obrigatório para atualizar usuário.");
        }
        if (!updateData || Object.keys(updateData).length === 0) {
            logger.warn("Dados de atualização são obrigatórios para atualizar usuário.", { id });
            throw new Error("Dados de atualização são obrigatórios para atualizar usuário.");
        }

        try {
            const { db } = await connectToDatabase();

            const objectId = new ObjectId(id);
            const result = await db.collection('usuarios').updateOne(
                { _id: objectId },
                { $set: updateData }
            );

            if (result.matchedCount === 0) {
                logger.warn("Usuário não encontrado para atualização.", { id, updateData });
                return false;
            }
            logger.info("Usuário atualizado com sucesso.", { id, modifiedCount: result.modifiedCount });
            return result.modifiedCount > 0;
        } catch (error) {
            logger.error(`Erro ao atualizar usuário id=${id}: ${error.message}`, { error, id, updateData });
            if (error.name === 'BSONTypeError' || error.message.includes('Argument passed in must be a string of 12 bytes or a string of 24 hex characters or an integer')) {
                throw new Error(`ID de usuário inválido para atualização: ${id}`);
            }
            throw new Error(`Falha ao atualizar usuário: ${error.message}`);
        }
    }

    static async deletar(id) {
        if (!id) {
            logger.warn("ID é obrigatório para deletar usuário.");
            throw new Error("ID é obrigatório para deletar usuário.");
        }

        try {
            const { db } = await connectToDatabase();

            const objectId = new ObjectId(id);
            const result = await db.collection('usuarios').deleteOne({ _id: objectId });

            if (result.deletedCount === 0) {
                logger.warn("Usuário não encontrado para deleção.", { id });
                return false;
            }
            logger.info("Usuário deletado com sucesso.", { id, deletedCount: result.deletedCount });
            return true;
        } catch (error) {
            logger.error(`Erro ao deletar usuário id=${id}: ${error.message}`, { error, id });
            if (error.name === 'BSONTypeError' || error.message.includes('Argument passed in must be a string of 12 bytes or a string of 24 hex characters or an integer')) {
                throw new Error(`ID de usuário inválido para deleção: ${id}`);
            }
            throw new Error(`Falha ao deletar usuário: ${error.message}`);
        }
    }
}

module.exports = Usuario;
