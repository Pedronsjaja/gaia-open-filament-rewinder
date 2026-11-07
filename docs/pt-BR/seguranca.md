# Segurança e validação antes de energizar

**Estado atual: projeto virtual/conceitual e software inicial. Sem máquina construída, ensaios físicos ou liberação para fabricação.** A lista abaixo identifica trabalho de engenharia pendente; não certifica segurança.

| Risco | Controle proposto | Evidência necessária ainda ausente |
|---|---|---|
| Aprisionamento em carretéis, transmissão, encoder e guia | Guardas, acesso impedido durante movimento, manípulos fora das zonas perigosas | Revisão dimensional, retenção, resistência, ensaio de acesso/funcionamento |
| Carretel/eixo soltar ou máquina tombar | Retenção positiva, fixação da base, balanceamento e limites de rotação | Medições com carretéis reais, massa máxima, flecha/runout e estabilidade |
| Choque/incêndio/aquecimento | Fonte CC isolada, proteção coordenada, limite de corrente, cabos/conectores apropriados | Fonte/driver/motor exatos, inrush/stall, temperaturas e revisão elétrica |
| Rompimento/estiramento do filamento | Tensão passiva limitada e futura monitoração independente | Limite de força por material/lote, mecanismo e comportamento em travamento |
| Jam no receptor com filamento ainda se movendo | Monitoração independente de receptor/tensão e limites de energia | Arquitetura sensorial e testes; encoder linear sozinho não cobre o caso |
| Guia além do curso | Sensores adequados, batentes, homing e controle de distribuição | Guia/fuso/motor/controlador ainda não implementados/validados |
| Reinício inesperado | Comando local deliberado, falha travada, retorno sem movimento após energia/reset | Bancada/power-loss, sensor desconectado, falha de driver e circuito de rearme |
| Parada insuficiente ou comunicação perdida | Parada física independente que interrompa potência; watchdog local | Circuito e categoria de função apropriados, tempo/distância reais e revisão por responsável |

Não usar pausa/parada do navegador como parada de emergência. Desligar PWM não comprova remoção de torque ou frenagem. O software não detecta toda falha; pinos podem flutuar no boot, driver pode falhar e motores podem continuar por inércia. Sensor desconectado deve impedir operação, o que exige circuito definido e ensaiado.

Antes de construir: registrar dimensões e cargas; definir requisitos de força/velocidade/parada por análise de risco; escolher componentes por datasheet; revisar esquemas, guardas, tolerâncias e interfaces; manter todas as medições pendentes como NOT_MEASURED. Sem critérios numéricos justificados, não marcar ensaio como aprovado.

Uma futura sequência de bancada começa sem potência nos atuadores, verifica sinais/intertravamentos, depois usa alimentação limitada e baixa velocidade sob supervisão, isolamento acessível e proteções. Ensaiar interrupção de movimento, corte de filamento, limites, perda de comunicação, falha de energia, aquecimento e retorno sem reinício. Registrar instrumentos, ambiente, dados brutos, incertezas, revisão e resultado. Isso ainda não ocorreu.

Não trabalhar com ligações de rede elétrica, nem remover proteções do sistema para executar o demonstrador. Para estudar software, use apenas o modo offline e os testes host. Flags `*_VALIDATED` não são substitutos de evidência.
