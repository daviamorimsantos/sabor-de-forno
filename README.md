# Forno & Sabor 🍕

Site de pizzaria em React + Vite, com catálogo conectado ao Supabase, painel administrativo em `/admin`, gestão de produtos com upload de fotos, registro de pedidos pelo checkout e painel de métricas.

## 1. Antes de publicar

Este projeto inclui dados demonstrativos. Edite `src/data/store.js` para colocar o WhatsApp, endereço, horário, taxa de entrega e links reais da loja. Revise também os textos e imagens do catálogo.

## 2. Configurar o banco Supabase

1. Abra o projeto no [Supabase](https://supabase.com/dashboard).
2. Entre em **SQL Editor → New query**.
3. Abra o arquivo `supabase_setup.sql`, copie todo o conteúdo e execute no SQL Editor.
4. No Supabase, abra **Authentication → Users → Add user** e crie a conta do proprietário com e-mail e uma senha forte. Confirme/verifique o usuário se o painel oferecer essa opção.
5. Copie o **UUID** dessa conta na lista de usuários.
6. No SQL Editor, execute este comando substituindo o texto pelo UUID real:

   ```sql
   INSERT INTO public.admin_users (user_id)
   VALUES ('COLE-AQUI-O-UUID-DA-CONTA');
   ```

   Essa etapa autoriza a conta a administrar produtos e ver pedidos. Só quem está nesta tabela terá permissão administrativa.

O script SQL preserva produtos já cadastrados e inclui o catálogo demonstrativo se os nomes ainda não existirem. Ele cria também as tabelas de pedidos, itens do pedido, regras RLS e o armazenamento público de fotos com upload reservado ao administrador.

## 3. Configurar as chaves públicas do Supabase

No Supabase, abra **Project Settings → API** (ou a seção equivalente de API Keys) e copie:

- Project URL
- Publishable key (a chave pública; projetos antigos podem chamar de `anon` key)

Crie `.env.local` na raiz do projeto durante o desenvolvimento:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=COLE_A_CHAVE_PUBLICA
```

Nunca coloque `service_role`, `secret key`, senha do banco ou credenciais privadas em variáveis `VITE_`, no GitHub ou no código do navegador. O frontend usa somente a chave pública e as políticas RLS limitam as ações.

## 4. Executar no computador

Instale Node.js LTS, abra o terminal nesta pasta e execute:

```bash
npm install
npm run dev
```

Abra o endereço que o Vite mostrar. A loja pública ficará na raiz e o painel em `/admin`.

## 5. Publicar no GitHub e na Vercel

1. Envie os arquivos deste projeto para o repositório GitHub (não envie `.env.local`).
2. Importe o repositório na Vercel.
3. Em **Project Settings → Environment Variables**, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` com os valores do seu projeto Supabase.
4. Faça um novo deploy após adicionar as variáveis.
5. Abra `https://SEU-SITE.vercel.app/admin` e entre com o e-mail e a senha da conta criada no Supabase.

As variáveis Vite são embutidas durante o build; por isso, sempre faça um novo deploy depois de alterá-las.

## Funcionalidades incluídas

- Catálogo público lido do Supabase (com fallback demonstrativo antes de conectar).
- Login administrativo com Supabase Auth; sem senha padrão embutida no código.
- Adicionar, editar, ocultar e excluir produtos.
- Upload de fotos para o bucket `product-images`.
- Pedidos enviados pelo WhatsApp e registrados no Supabase via função SQL que recalcula os preços no banco.
- Painel com faturamento estimado, quantidade de pedidos, ticket médio, pendentes, faturamento por dia da semana, pedidos por hora, produtos mais vendidos e pedidos recentes.
- Atualização do status dos pedidos e exportação CSV.

## Observações importantes

- O painel analítico só terá dados reais depois que os clientes registrarem pedidos pelo checkout conectado.
- O faturamento é uma estimativa baseada em pedidos não cancelados; não substitui contabilidade nem conciliação de pagamentos.
- O pedido é enviado ao WhatsApp; o site não processa pagamentos.
- Revise dados de negócio, preços, políticas de entrega, privacidade e termos antes de usar em produção.
- Para proteger dados dos clientes, mantenha as políticas RLS ativadas e não exponha chaves secretas.
