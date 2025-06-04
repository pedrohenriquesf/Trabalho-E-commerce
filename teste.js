const { closeDatabaseConnection } = require('./utils/connection'); 
const logger = require('./utils/Logger');

const Usuario = require('./models/Usuario');
const Categoria = require('./models/Categoria');
const Produto = require('./models/Produto');
const Carrinho = require('./models/Carrinho');
const Pedido = require('./models/Pedido');
const Pagamento = require('./models/Pagamento');

async function runSeed() {
    logger.info("Iniciando script de teste do banco de dados...");

    let categoriaId1, usuarioId1, usuarioId2, produtoId1, produtoId2, carrinhoId1, pedidoId1;

    try {
        // --- 1. Testar Categoria ---
        logger.info("--- Testando Categoria ---");
        const categoria1 = new Categoria("Console", "Consoles de videogame e acessórios relacionados.");
        categoriaId1 = await categoria1.inserir();
        logger.info(`Categoria inserida: ${categoriaId1}`);

        const categoria2 = new Categoria("Jogo Digital", "Jogos para download em plataformas digitais.");
        await categoria2.inserir();

        const categorias = await Categoria.buscarTodos();
        console.table(categorias);

        // --- 2. Testar Usuario ---
        logger.info("--- Testando Usuario ---");
        const usuario1 = new Usuario(
            "Alice",
            "alice@example.com",
            "password123",
            "cliente",
            [{ rua: "Rua Goias", numero: "42", cidade: "Londrina", estado: "PR", cep: "12345-001" }]
        );
        usuarioId1 = await usuario1.inserir();
        logger.info(`Usuário inserido: ${usuarioId1}`);

        const usuario2 = new Usuario(
            "Luccas",
            "luccas@example.com",
            "hash456",
            "cliente",
            [{ rua: "Rua das Americas", numero: "110", cidade: "São Paulo", estado: "SP", cep: "98765-432" }]
        );
        usuarioId2 = await usuario2.inserir();
        logger.info(`Usuário inserido: ${usuarioId2}`);

        const usuarios = await Usuario.buscarTodos();
        console.table(usuarios);

        const usuarioAlice = await Usuario.buscarPorId(usuarioId1.toHexString());
        logger.info("Usuário Alice buscado por ID:");
        console.log(usuarioAlice);

        await Usuario.atualizar(usuarioId1.toHexString(), { telefone: "11999998888", endereco: [{ rua: "Rua Nova", numero: "10" }] });
        const usuarioAliceAtualizado = await Usuario.buscarPorId(usuarioId1.toHexString());
        logger.info("Usuário Alice atualizado:");
        console.log(usuarioAliceAtualizado);

        // --- 3. Testar Produto ---
        logger.info("--- Testando Produto ---");
        const produto1 = new Produto(
            "PlayStation 5",
            4299.99,
            categoriaId1.toHexString(),
            "Sony",
            "Console de nova geração com SSD ultrarrápido."
        );
        produtoId1 = await produto1.inserir();
        logger.info(`Produto inserido: ${produtoId1}`);

        const produto2 = new Produto(
            "Xbox Series X",
            4000.00,
            categoriaId1.toHexString(),
            "Microsoft",
            "Console mais poderoso da Microsoft."
        );
        produtoId2 = await produto2.inserir();
        logger.info(`Produto inserido: ${produtoId2}`);

        const produtos = await Produto.buscarTodos();
        console.table(produtos);

        const produtoOriginalPs5 = await Produto.buscarPorId(produtoId1.toHexString());

        if (produtoOriginalPs5) {
          await Produto.atualizar(
              produtoId1.toHexString(),
              {
                nome: produtoOriginalPs5.nome,
                preco: parseFloat(produtoOriginalPs5.preco.toString()), 
                categoria_id: produtoOriginalPs5.categoria_id.toHexString(),
                marca: produtoOriginalPs5.marca,
                descricao: "Console com drive de disco e nova descrição."
              }
          );
          const ps5Atualizado = await Produto.buscarPorId(produtoId1.toHexString());
          logger.info("PS5 atualizado:");
          console.log(ps5Atualizado);
        } else {
          logger.warn("Não foi possível atualizar o PS5, produto original não encontrado.");
        }

        // --- 4. Testando Carrinho ---
        logger.info("--- Testando Carrinho ---");
        const itensCarrinho1 = [
            { produto_id: produtoId1.toHexString(), preco: 4299.99, quantidade: 1 },
            { produto_id: produtoId2.toHexString(), preco: 4000.00, quantidade: 1 }
        ];
        const carrinho1 = new Carrinho(usuarioId1.toHexString(), itensCarrinho1);
        carrinhoId1 = await carrinho1.inserir();
        logger.info(`Carrinho inserido para Alice: ${carrinhoId1}`);

        const carrinhos = await Carrinho.buscarTodos();
        console.table(carrinhos);

        const carrinhoAlice = await Carrinho.buscarPorId(carrinhoId1.toHexString());
        logger.info("Carrinho de Alice buscado por ID:");
        console.log(carrinhoAlice);

        // --- 5. Testar Pedido ---
        logger.info("--- Testando Pedido ---");

        const itensPedido1 = carrinhoAlice.itens.map(item => ({
            produto_id: item.produto_id.toHexString(),
            nome_produto: "Nome do Produto " + item.produto_id.toHexString().substring(0, 5),
            preco_unitario: parseFloat(item.preco.toString()),
            quantidade: item.quantidade
        }));

        const pedido1 = new Pedido(
            usuarioId1.toHexString(),
            itensPedido1,
            "pendente",
            "pix",
            { rua: "Rua Goias", numero: "42", cidade: "Londrina", estado: "PR", cep: "12345-001" }
        );
        pedidoId1 = await pedido1.inserir();
        logger.info(`Pedido inserido para Alice: ${pedidoId1}`);

        const pedidos = await Pedido.buscarTodos();
        console.table(pedidos);

        await Pedido.atualizarStatus(pedidoId1.toHexString(), "processando");
        const pedidoAliceAtualizado = await Pedido.buscarPorId(pedidoId1.toHexString());
        logger.info("Status do pedido de Alice atualizado:");
        console.log(pedidoAliceAtualizado);

        // --- 6. Testar Pagamento ---
        logger.info("--- Testando Pagamento ---");
        const pagamento1 = new Pagamento(
            pedidoId1.toHexString(),
            parseFloat(pedidoAliceAtualizado.total_pedido.toString()),
            "aprovado",
            "pix",
            "TRANSID_12345ABC"
        );
        await pagamento1.inserir();
        logger.info(`Pagamento inserido para Pedido: ${pedidoId1}`);

        const pagamentos = await Pagamento.buscarTodos();
        console.table(pagamentos);

        logger.info("Script de população e teste finalizado com sucesso!");

    } catch (error) {
        logger.error("Erro fatal no script de seed/teste:", error);
    } finally {
        await closeDatabaseConnection();
        logger.info("Conexão com MongoDB fechada após script.");
    }
}

runSeed();
