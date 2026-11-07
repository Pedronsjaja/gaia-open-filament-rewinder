# Lista de materiais e orçamento

Arquivos: [BOM editável Excel](gaia-rewinder-bom.xlsx) e [CSV UTF-8](bom.csv). A BOM é uma proposta conceitual, sem comprovação de montagem física. Quantidades são hipóteses iniciais; itens em `kit` precisam de composição e cotação integral antes da compra.

O Excel tem duas abas: `Resumo` compara Lite/Smart; `Itens` mantém quantidades, especificações, alternativas, montagem, evidência e cotações. Colunas amarelas são entradas. `Incluir 0/1` permite incluir a balança compartilhada e outros opcionais. A necessidade original continua explícita. Campos de preço em BRL permanecem **em branco**; não há cotações, preços locais ou disponibilidade inventados. Documentos de fabricante abertos em 07/11/2026 não são cotações de compra.

Cada linha tem uma busca do Mercado Livre, identificada como **busca, não anúncio verificado**. O link serve para iniciar pesquisa. Confirme SKU, vendedor, ficha técnica, quantidade, impostos e frete na oferta real. Registre preços unitários mínimo e máximo, data, URL da cotação e estado `COTADO`. O estado deve ser atualizado para `VENCIDO` quando deixar de ser aplicável. A data de abertura dos documentos não deve ser copiada como data de uma cotação inexistente.

Uma cotação é calculada como válida apenas se ambos os preços forem numéricos, mínimo ≥ 0, máximo ≥ mínimo, data e URL estiverem preenchidos e estado for `COTADO`. Zero explícito pode representar doação ou estoque próprio documentado; ausência de preço nunca se converte em zero. Preço mínimo/máximo é por unidade da linha, portanto um `kit` deve ter preço do kit inteiro.

Subtotais multiplicam quantidade por preço de cada versão. O resumo só apresenta mínimo/máximo e máximo com reserva quando **todas** as linhas incluídas daquela versão estiverem cotadas. Enquanto houver lacunas, retorna `UNKNOWN`. A cobertura é fração de linhas incluídas com cotação válida, não fração do valor final. Inicialmente Lite possui 21 linhas incluídas e Smart 31, ambas com cobertura 0%. Reserva inicial de 20% é **ASSUMED**, editável, e não substitui frete, tributos, mão de obra ou serviços: acrescente linhas específicas quando conhecidos. Ao acrescentar linhas, estenda as fórmulas e intervalos do resumo; a tabela não promete extensão automática de fórmulas.

O CSV preserva dados e lacunas sem cache de fórmulas, para ferramentas que não usam Excel. O Excel é a versão com subtotais e resumo dinâmicos. Não preencher ambos separadamente e presumir sincronização automática.

Validação: [validation.json](validation.json) registra testes do motor de fórmulas da biblioteca fornecida, incluindo ausência de preços, preço zero explícito, alteração de preço e faixa invertida, com restauração dos campos. O workbook foi renderizado para inspeção visual das duas abas e exportado. Excel desktop nativo não foi executado para esta verificação. Limites elétricos e físicos continuam em [hardware/README.md](../hardware/README.md).
