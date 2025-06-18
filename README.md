# Trabalho-E-commerce

Projeto de E-commerce Gamer utilizando Node.js e MongoDB.

## Pré-requisitos

- Node.js (v16+)
- MongoDB rodando localmente (padrão: `mongodb://localhost:27017`)
- Variáveis de ambiente configuradas no arquivo `.env`:
  ```
  MONGODB_URI=mongodb://localhost:27017
  MONGO_DB_NAME=ecommerce_gamer
  ```

## Instalação

1. Clone o repositório:
   ```sh
   git clone https://github.com/seu-usuario/Trabalho-E-commerce.git
   cd Trabalho-E-commerce
   ```

2. Instale as dependências:
   ```sh
   npm install
   ```

## Como rodar

1. Certifique-se que o MongoDB está em execução.
2. Execute o script de teste/população do banco:
   ```sh
   node teste.js
   ```
   Isso irá criar e popular as coleções de usuários, produtos, categorias, carrinhos, pedidos e pagamentos.

## Estrutura do Projeto

- `models/` — Modelos das entidades do sistema (Usuário, Produto, Categoria, Carrinho, Pedido, Pagamento)
- `utils/` — Utilitários de conexão com o banco e logger
- `teste.js` — Script de teste/população do banco
- `app.js` — Arquivo principal para futura implementação do backend
- `*.html` — Páginas estáticas do frontend
- `css/` — Estilos do frontend

## Observações

- O projeto atualmente não possui backend HTTP implementado em [`app.js`](app.js).
- Para testar as operações de CRUD, utilize o script [`teste.js`](teste.js).
- Os logs das operações ficam em [`logs/app.log`](logs/app.log).


## Intalaçoes comandos 
-- npm init -y
-- npm install mongo
-- npm install dotenv
-- npm install mustache
-- npm install express