# Forno & Sabor — painel administrativo

O visual da loja e do painel foi mantido. O painel usa uma senha única definida nas variáveis privadas da Vercel e uma API de servidor, para que a chave privilegiada do Supabase nunca seja enviada ao navegador.

## Configuração na Vercel

Em **Project → Settings → Environment Variables**, mantenha as duas variáveis públicas que a loja já usa:

- `VITE_SUPABASE_URL` = URL do projeto Supabase
- `VITE_SUPABASE_PUBLISHABLE_KEY` = chave `sb_publishable_...`

Adicione também estas variáveis privadas, sem prefixo `VITE_`:

- `ADMIN_PASSWORD` = a senha escolhida para o painel
- `SUPABASE_SERVER_KEY` = chave secreta do servidor do Supabase (`sb_secret_...`) ou a chave legada `service_role`, encontrada nas configurações de API do projeto. **Nunca** coloque essa chave em variável `VITE_`, no código do navegador ou no GitHub.

Selecione Production (e Preview/Development se necessário), salve e faça **Redeploy**. A função `/api/admin` usa `VITE_SUPABASE_URL` como URL se `SUPABASE_URL` não estiver definida.

> Use uma senha longa e exclusiva em um site real. PINs curtos, como códigos de quatro dígitos, são fáceis de adivinhar. Se decidir usar um PIN curto para demonstração, limite o acesso ao projeto e troque-o antes de usar com clientes reais. A API aplica uma limitação básica de tentativas; em infraestrutura serverless essa limitação por memória não substitui um serviço de rate limiting dedicado.

## Banco de dados

1. Execute `supabase_setup.sql` no SQL Editor do projeto Supabase se ainda não tiver feito isso.
2. Confira se o bucket `product-images` foi criado pelo script.
3. Não é necessário criar usuário em Authentication para entrar no painel por senha; o acesso administrativo passa pela API de servidor. A tabela `admin_users` continua no banco para compatibilidade com as políticas SQL já existentes.

## Usar o painel

1. Abra `https://SEU-SITE.vercel.app/admin`.
2. Digite a senha definida na variável privada `ADMIN_PASSWORD`.
3. Em **Produtos**, você pode adicionar produtos, alterar nome, descrição, preço, foto e disponibilidade, ou excluir produtos.
4. Em **Pedidos**, você pode consultar pedidos, mudar o status e exportar CSV. A **Visão geral** mostra faturamento estimado, pedidos, ticket médio, movimento por dia/hora e produtos mais vendidos.

As imagens enviadas pelo painel devem ser PNG, JPG ou WebP de até 2,5 MB.

## Segurança

- `SUPABASE_SERVER_KEY` é uma chave privilegiada. Mantenha-a exclusivamente como variável privada da Vercel; nunca a compartilhe no chat, publique no GitHub ou use no código do navegador.
- A senha é validada no servidor. A API cria uma sessão assinada com validade de 12 horas.
- Se a senha for alterada, salve a nova em `ADMIN_PASSWORD` e faça Redeploy.
