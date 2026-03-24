# Worqera (Multi-tenant Skeleton)

Base Next.js app preparada para operar como SaaS multi-tenant (ex.: Worqera) com clientes como “A Casa do Tênis”.

## O que mudou
- Middleware agora resolve o tenant pelo host/subdomínio e injeta `x-tenant` para toda requisição.
- Layout expõe `data-tenant` e variáveis CSS de tema para white-label.
- Registro de tenants em [lib/tenants.ts](lib/tenants.ts) com hostnames, nome, tema e logos.

## Fluxo multi-tenant (subdomínio)
1) Aponte o DNS para seu deploy (ex.: `acasadotenis.worqera.com`).
2) O `middleware` lê o host, resolve o tenant e passa `x-tenant` adiante.
3) `app/layout.tsx` lê `x-tenant`, carrega o tema do tenant e define atributos/variáveis para a UI.
4) Components/páginas podem ler `data-tenant` ou CSS vars para ajustar branding.

## Adicionando um novo tenant
1) Edite [lib/tenants.ts](lib/tenants.ts):
	- Inclua um objeto com `slug`, `displayName`, `hostnames`, `theme` e logos.
2) Configure o DNS/CNAME do subdomínio para seu deploy.
3) (Opcional) Adapte emails e PDFs usando o `slug`/`displayName` para assinatura e cabeçalho.

## Como usar os temas na UI
- CSS vars disponíveis no `body`: `--brand-primary`, `--brand-accent`, `--brand-bg`, `--brand-text`, `--brand-muted`.
- Exemplo (Tailwind custom): adicione ao `globals.css` um utilitário ou use `style` inline.
- Em componentes React (client/server), você pode ler `document.body.dataset.tenant` ou usar `headers().get("x-tenant")` em server components para decisões de layout/feature flag.

## Segurança e dados
- Garanta que chamadas à API incluam `tenantId` (implemente no backend). Este projeto apenas resolve o tenant no edge e repassa para o app.
- Namespace de cache por tenant se necessário (ex.: prefixar chaves com o `slug`).

## Próximos passos sugeridos
- Aplicar temas nos componentes principais (header, botões, cards) usando as CSS vars.
- Ajustar templates de email/PDF para exibir `displayName` e logo do tenant.
- Adicionar tabela `tenants` no backend e fazer o mapping host -> tenant persistente.

## Desenvolvimento
- Rodar em dev: `npm install` e `npm run dev`.
- Subdomínios em dev: use `127.0.0.1.nip.io:3000` ou edite `/etc/hosts` para testar `acasadotenis.local`.

## Checklist de validação (frontend Worqera multi-tenant)
- Cabeçalho X-Tenant obrigatório em todas as chamadas; valor = tenant logado/selecionado.
- Erros de tenant: mensagens amigáveis para 400/401/403 quando X-Tenant faltar ou tenant estiver inativo.
- Base URLs: usar WorqeraApiUrl; nada apontando para ShoeRepair.
- Uploads/fotos: bucket/fotos via env apontando para Worqera; presigned URLs funcionam.
- Endpoints/tabelas: pedidos/clientes/funcionários/users usam nomes Worqera via env.
- Cache/localStorage: nenhuma chave antiga “ShoeRepair” guardando tokens/tenant; limpar se existir.
- CORS/headers: OPTIONS ok; headers expostos incluem X-Tenant e X-Tenant-Resolved.
- Scripts/mocks: qualquer fetch de dev/test envia X-Tenant e usa o novo endpoint.
- Branding: textos/labels mostram “Worqera”; nada com “ShoeRepair”.