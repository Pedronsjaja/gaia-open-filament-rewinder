# Guia de estudo e uso

Esta é uma primeira versão virtual. Instruções de montagem/elétrica são um roteiro de revisão para uma futura bancada, não autorização de fabricação ou energização. Comece pela [segurança](seguranca.md).

## 1. Entenda as duas versões

Lite: dois suportes, carretel receptor acionado por motorredutor, controlador PWM independente, partida/parada locais, tensão passiva, distribuição lateral manual e balança externa. Funciona conceitualmente sem microcontrolador, ESP32, aplicativo ou conexão. Ainda faltam validação mecânica e circuito definitivo de parada/rearme.

Smart: mantém o caminho mecânico e acrescenta ESP32, encoder em roda de medição independente, proposta de guia motorizado e sensores. Já existem simulador e firmware inicial, mas o guia motorizado e a comunicação web com a máquina **não estão implementados**. O firmware entregue bloqueia atuação por padrão. Não mudar flags para contornar essa pendência.

## 2. Conceitos essenciais

| Conceito | Como pensar no projeto |
|---|---|
| Motorredutor | Motor com redução mecânica: troca rotação por torque, com perdas. A rotação sem carga do catálogo não garante a rotação sob tensão do filamento |
| Torque | Tendência de girar. Para 1 N de tração hipotética num raio de 0,06 m, só a parcela de tração exige 0,06 N m |
| PWM | Pulsos que variam a demanda elétrica média. 50% de duty não comprova 50% da velocidade nem controle de tensão |
| Driver | Etapa de potência entre lógica e motor. Deve suportar níveis lógicos, corrente limitada, transientes e aquecimento reais |
| Encoder | Sensor que gera sinais associados ao deslocamento. Aqui a roda mede filamento; o encoder interno de um motor não é medição linear independente |
| Densidade | Massa por volume. Densidade, diâmetro e comprimento calculam uma estimativa de massa; pigmentos/cargas podem alterar a densidade |
| Calibração | Comparar com referência independente e ajustar um fator, registrando incertezas e condições. Mais casas decimais não provam precisão |

## 3. Use o demonstrador web

1. Instale Node.js 24+ por fonte oficial, abra terminal na raiz e execute `npm start`.
2. Acesse `http://127.0.0.1:4173/software/web/`; o badge SIMULATED identifica dados virtuais.
3. Em Configuração, escolha PLA/PETG/ABS ou Personalizado. Densidades padrão são hipóteses; ajuste usando dados do seu produto.
4. Digite diâmetro em mm, meta por metros ou gramas **estimados**, e velocidade desejada em mm/s. Clique Aplicar configuração.
5. Inicie, pause, retome ou pare. Configuração/calibração ficam bloqueadas durante operação/pausa/falha. Parar encerra a sessão; iniciar novamente zera a contagem da nova sessão.
6. Em Diagnóstico, injete uma falha virtual. A falha fica travada, com velocidade zero e reset manual. Reset não inicia uma nova operação.
7. Consulte Histórico ou exporte JSON. Até100 resultados, configuração e calibração ficam no armazenamento local desse navegador. Nenhum dado é enviado para equipamento ou nuvem. Recarregar nunca retoma movimento; uma sessão ainda em andamento não é restaurada.

O tempo mostrado é tempo ativo da simulação, sem pausa. O encerramento ideal usa a primeira contagem que alcança a meta. Inércia, frenagem, elasticidade e deslizamento não são simulados. A interface não valida precisão de parada real. A seção Conexão informa LIVE DISABLED; não há botão que finja conectar ao ESP32.

## 4. Faça um exercício de calibração

Com roda nominal de30 mm e600 **contagens efetivas por volta**, 10000 contagens representam aproximadamente1,570796 m antes da correção. Se uma referência independente indicar1,575 m, o fator calculado será1,002676. Digite esses valores na tela e compare com `npm run examples`. Estes números são um exercício CALCULATED/ASSUMED, não uma medição realizada.

Na máquina futura: use trecho conhecido medido com instrumento adequado, baixa velocidade, condições registradas e percurso protegido. Repita diferentes comprimentos, materiais e tensões. Não introduza as mãos entre filamento/roda/carretel. Registre referência, contagens brutas, fator anterior/novo, diâmetro efetivo, instrumentos e incerteza. Fator não corrige escorregamento variável. Para pesagem real, use balança externa com tara e registre sua resolução/calibração.

## 5. Impressão 3D e CAD

Abra `hardware/cad/rewinder.scad` no OpenSCAD. Selecione Lite/Smart e a peça desejada; os parâmetros são hipóteses em mm. O STL entregue é **somente a base conceitual**, de620 ×300 ×12 mm, maior que a mesa de muitas impressoras de bancada. Prefira estudar a geometria e planejar uma base adequada; não dividir ou imprimir automaticamente supondo resistência comprovada.

Antes de fabricar suportes, meça carretéis, eixos, rolamentos, envelope do motor e alinhamentos. Gere corpos de prova para folgas/encaixes. Camadas, orientação, material, fixação e temperatura alteram resistência. Não há prescrição de infill/material que transforme o modelo em peça estrutural certificada. Faltam retenções, furos definitivos, guardas e tolerâncias; STL fechado não prova ajuste ou rigidez. Arquivos CSG são estudos de montagem, não STEP nem desenhos executivos. Veja [limites do CAD](../../hardware/README.md).

## 6. Planeje a montagem mecânica

Com alimentação ausente e energias isoladas: verificar base estável/fixada; suportes alinhados; folga entre flanges e estrutura; retenção positiva dos eixos/carretéis; transmissão protegida; limites de curso mecânicos; rodas livres de arestas; percurso sem raio de curvatura prejudicial. O guia manual Lite deve usar manípulo acessível fora de toda zona de esmagamento. Não orientar filamento com a mão junto ao carretel em rotação.

Smart exige definir passo/fuso, largura útil, inversão e homing, sensores independentes e política para limites. Isso continua pendente. Não se pode declarar o guia validado só porque um bloco aparece no CAD. Confira tamanho e furação reais do motor; o exemplo de encoder do motor não substitui o sensor linear.

## 7. Planeje a elétrica Lite e Smart

Os [diagramas](../../diagrams/README.md) são funcionais, não netlist/PCB ou esquema revisado. Use fonte CC isolada apropriada; não trabalhar com rede elétrica neste projeto. Seleção de fusível, seção de cabos, contatos para CC, conectores, limites de corrente e desacoplamento depende da integração final e de revisão competente.

Lite: fonte → proteção e isolamento de potência → controlador PWM independente/driver compatível → motor. Partida/parada com rearme deliberado devem funcionar sem software. Um módulo PWM genérico pode voltar ligado após energia retornar; isso é uma falha de projeto a resolver, não um comportamento permitido.

Smart: alimentação de potência protegida para motor/driver e ramal regulado apropriado para lógica; GPIO ESP32 de3,3 V não recebe5 V diretamente. Condicione sinais do encoder e mantenha retornos de motor afastados dos sensores. A placa de desenvolvimento e o encoder comercial exatos são TO_VERIFY; pinos documentados no firmware são proposta. Uma corrente nominal de placa não comprova desempenho térmico no gabinete. A parada de emergência física remove energia dos atuadores independentemente de Wi-Fi, navegador ou ESP32.

## 8. Compile o firmware sem máquina

Siga [firmware/README.md](../../firmware/README.md). Com Python/PlatformIO instalados de fontes oficiais:

```sh
python -m pip install platformio==6.1.18
pio run -d firmware -e esp32dev
python firmware/test/run_host_tests.py --compiler /caminho/para/g++
```

O ambiente usa Espressif32 6.9.0 e Arduino-ESP32 2.0.17 fixados para a API LEDC implementada, sem alegar que sejam os mais recentes. Testes host não precisam de placa. Compilar não é fazer upload. Não execute `pio run -t upload` antes de escolher placa, revisar pinagem/níveis/intertravamentos e preparar bancada segura. A imagem padrão não habilita potência; HTTP/WebSocket e Wi-Fi não estão implementados. Para estudar o protocolo serial, consulte os comandos de status/configuração e os gates, sem fingir uma conexão web pronta.

## 9. Diagnóstico

| Sintoma | Verificação apropriada |
|---|---|
| HTML não carrega módulos | Use o servidor local, não `file://`; confira a porta e o terminal |
| Configuração rejeitada | Cheque unidades, limites, campos finitos e se operação/pausa/falha precisam ser encerradas |
| Massa não coincide com balança | É estimativa; conferir tara, densidade do lote, diâmetro/ovalização e comprimento/slip |
| Contagem diverge | Confirmar multiplicador quadratura, roda efetiva, contato, referência e inversão; repetir em condições controladas |
| Firmware não inicia | O padrão bloqueia atuação. Não remover gates; analisar intertravamentos, pendências de validação e estado local |
| NO_MOTION / limite / intertravamento | Desligar e investigar causa; não apagar falha e reiniciar automaticamente; o código não comprova a causa física |
| Dificuldade de exportação local | Verificar permissões do navegador; sem histórico, exportar não cria medições reais |
| Planilha mostra UNKNOWN | Faltam cotações válidas em alguma linha incluída; seguir [BOM](../../bom/README.md) |

## 10. Perguntas frequentes

**Preciso construir para contribuir?** Não. Interface, testes, cálculos e estudos CAD têm valor integralmente virtual.

**A Smart está pronta para enrolar automaticamente?** Não. Firmware inicial e simulação existem; guia, elétrica, limites, velocidade real, resposta a falhas e bancada não estão validados.

**O comprimento vem do número de voltas da bobina?** Não. O raio varia durante o enchimento. A proposta mede o filamento com roda independente.

**O projeto pesa o filamento?** Não. Calcula massa pela geometria/densidade. Balança externa é necessária para medir massa real.

**Qual é o preço final?** UNKNOWN. Há itens e quantidades propostos, mas nenhuma cotação individual foi validada. Links de busca não são ofertas nem estoque confirmado.

**É a primeira rebobinadora?** Não há essa alegação; [referências](../en/research.md) documentam projetos anteriores.

**Posso usar comercialmente?** Leia as licenças e resolva projeto, riscos, validação e responsabilidades aplicáveis; o repositório não comprova aptidão comercial ou conformidade.

Para aprofundar: [engenharia SI](../en/engineering.md), máquina de estados, documentação do driver/encoder e propagação de incertezas. Exercício: mantendo0,1 m/s, dobre o raio de enrolamento e explique por que torque e RPM mudam, enquanto a conversão comprimento↔massa não muda se diâmetro/densidade do filamento forem constantes.
