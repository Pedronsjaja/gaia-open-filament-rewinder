// Original SVG concept illustrations. No reference CAD or electrical artwork copied.
import fs from 'node:fs/promises';
import path from 'node:path';
const dir=path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;');
const text=(x,y,s,size=19,color='#20334b')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}">${esc(s)}</text>`;
const box=(x,y,w,h,title,subtitle='',fill='#e8f0f5')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${fill}" stroke="#42627e" stroke-width="2"/>${text(x+15,y+31,title,20)}${subtitle?text(x+15,y+60,subtitle,16):''}`;
const line=(x,y,x2,y2,label='')=>`<path d="M${x},${y} L${x2},${y2}" fill="none" stroke="#d27925" stroke-width="4" marker-end="url(#arrow)"/>${label?text((x+x2)/2-40,(y+y2)/2-12,label,16):''}`;
const circle=(x,y,r,fill='#bdd5df')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="#42627e" stroke-width="3"/>`;
function sheet(title,body,note){return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720" role="img"><title>${esc(title)}</title><desc>${esc(note)}</desc><defs><marker id="arrow" markerWidth="9" markerHeight="9" refX="8" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="none" stroke="#d27925" stroke-width="2"/></marker></defs><rect width="1200" height="720" fill="#f8fafb"/><g font-family="Arial,sans-serif">${text(40,50,title,30)}${text(40,85,'PROPOSTA CONCEITUAL / NOT FABRICATION READY',16,'#a24b13')}<path d="M40,105 H1160" stroke="#b8c9d4"/>${body}${text(40,652,note,17)}${text(40,688,'ASSUMED geometry. Physical fit, electrical integration and safety: NOT_VERIFIED.',16,'#596878')}</g></svg>`;}
const views=[];
views.push(['01-isometric.svg','01 · Visão isométrica conceitual',
 `<path d="M160,450 L870,450 L1080,570 L370,570 Z" fill="#d6b98f" stroke="#80694c" stroke-width="3"/>`+
 `<path d="M310,260 L310,460 M790,260 L790,460" stroke="#42627e" stroke-width="24"/>`+
 `<ellipse cx="310" cy="300" rx="82" ry="112" fill="#b8cbd7" stroke="#42627e" stroke-width="4"/><ellipse cx="350" cy="325" rx="82" ry="112" fill="#cbd9e1" stroke="#42627e" stroke-width="4"/><ellipse cx="790" cy="300" rx="82" ry="112" fill="#b8cbd7" stroke="#42627e" stroke-width="4"/><ellipse cx="830" cy="325" rx="82" ry="112" fill="#cbd9e1" stroke="#42627e" stroke-width="4"/>`+
 line(390,355,565,420)+line(565,420,775,355)+box(500,430,160,75,'Tensor / roda','Roda só Smart')+box(890,385,180,85,'Motorredutor','Acoplamento protegido')+text(220,160,'Origem livre',20)+text(730,160,'Destino acionado',20),
 'Spools, support towers and drive are envelopes; guards omitted here for visual explanation.']);
views.push(['02-top.svg','02 · Implantação superior',
 `<rect x="140" y="155" width="920" height="400" fill="#f0dfc5" stroke="#80694c" stroke-width="3"/>`+
 box(210,220,160,170,'ORIGEM','Dois mancais')+box(800,220,160,170,'DESTINO','Dois mancais')+line(375,305,500,440)+line(590,440,770,400)+box(470,420,160,70,'Tensor passivo')+box(740,415,260,70,'Guia manual / linear')+text(150,590,'Envelope base 620 × 300 mm ASSUMED · sem escala',20),
 'The footprint and filament route require review against the actual spool and guard geometry.']);
views.push(['03-exploded.svg','03 · Explodida funcional de um eixo',
 line(130,330,1080,330)+box(70,235,140,75,'Colar','Retenção axial')+box(235,235,145,75,'Mancal','Rolamento')+box(410,235,140,75,'Cone','Centragem')+box(580,200,170,140,'Carretel','Núcleo / flange')+box(785,235,140,75,'Cone','Centragem')+box(955,235,170,75,'Mancal + colar','Retenção axial')+text(95,430,'Eixo Ø8 mm e cones 36–60 mm: hipóteses ajustáveis no OpenSCAD',22)+text(95,480,'Torque precisa de cubo anti-rotação; atrito dos cones ainda não validado.',20)+text(95,525,'Acoplamento não deve impor esforço radial ao motor.',20),
 'Exploded sequence explains function only; tolerances, fasteners and retention details are unresolved.']);
views.push(['04-filament-path.svg','04 · Caminho do filamento',
 box(50,250,180,100,'Origem','Giro livre')+box(285,250,180,100,'Tensor passivo','Força não medida')+box(520,250,180,100,'Roda linear','Somente Smart')+box(755,250,180,100,'Guia lateral','Manual / proposta')+box(990,250,165,100,'Destino','Acionado')+line(230,300,285,300)+line(465,300,520,300)+line(700,300,755,300)+line(935,300,990,300)+text(85,435,'Lite: tensor → guia manual → destino. Comprimento não é medido por firmware.',22)+text(85,485,'Smart: roda mede deslocamento independente do raio crescente do carretel.',22)+text(85,535,'Escorregamento e deformação da roda são erros de medição a ensaiar.',22),
 'No extrusion, heater or molten polymer. Transfer existing filament only.']);
views.push(['05-encoder-wheel.svg','05 · Roda medidora e encoder independente',
 circle(430,353,105)+circle(430,353,24,'#f8fafb')+circle(430,213,35,'#f0c779')+`<path d="M90,248 H790" stroke="#cf7a2b" stroke-width="6"/>`+box(650,330,350,110,'Encoder no eixo da roda','SKU / CPR / tensão UNKNOWN')+line(540,353,650,353)+text(105,145,'Contrapressor ajustável · carga NOT_MEASURED',23)+text(105,530,'L = contagens × π × diâmetro efetivo / contagens por volta',24)+text(105,575,'Calibrar com comprimento de referência; definir a convenção x1/x2/x4.',20),
 'Motor shaft counts and spool turns do not replace the independent linear measuring wheel.']);
views.push(['06-motor-drive.svg','06 · Motorredutor e transmissão proposta',
 box(65,250,240,120,'Motor DC 12 V','100 rpm SEM CARGA')+box(400,250,250,120,'Acoplamento flexível','Motor Ø6 / eixo Ø8 mm')+box(750,250,330,120,'Eixo com dois mancais','Cubo anti-rotação a detalhar')+line(305,310,400,310)+line(650,310,750,310)+text(80,445,'Candidato Pololu 4755: stall extrapolado 5,5 A; carga real NOT_MEASURED.',22)+text(80,495,'Dimensionar corrente, limite de torque e proteções antes de energizar.',22)+text(80,545,'Alternativa: correia + polias dimensionadas; razão não selecionada.',22),
 'This is an integration proposal. No loaded speed, torque margin or thermal performance has been measured.']);
views.push(['07-lateral-guide.svg','07 · Guia lateral Smart proposto',
 `<path d="M200,290 H990 M200,390 H990" stroke="#7994a5" stroke-width="12"/>`+box(485,255,180,170,'Carro / olhal','Curso útil ≥80 mm')+box(60,440,250,90,'Passo + transmissão','Fuso ou correia UNKNOWN')+line(310,480,570,430)+box(160,150,250,75,'Fim esquerdo NC')+box(780,150,260,75,'Fim direito NC')+text(150,580,'Batentes mecânicos além dos limites; homing e falhas precisam de ensaio.',22),
 'Layer pitch, reversal and travel depend on measured spool width and actual drive geometry.']);
views.push(['08-lite-electrical.svg','08 · Lite elétrico funcional sem MCU',
 box(45,180,215,90,'Fonte DC externa','12 V nominal; rating TBD')+box(340,180,230,90,'Fusível + isolamento','Coordenação a projetar')+box(665,180,220,90,'Driver DC','G2 18v17 candidato')+box(965,180,190,90,'Motor DC','12 V candidato')+line(260,225,340,225)+line(570,225,665,225)+line(885,225,965,225)+box(60,400,260,105,'Start / Stop + rearme','Circuito físico independente')+box(415,400,280,105,'PWM + potenciômetro','Oscilador sem microcontrolador')+line(320,450,415,450)+line(695,450,775,285)+text(735,475,'E-stop físico corta',20)+text(735,510,'energia dos atuadores.',20)+text(70,570,'0 V comum e desacoplamento não desenhados. Não usar como diagrama de ligação.',21),
 'Functional blocks only. No KiCad netlist, PCB, safety-rated schematic or verified connector pinout.']);
views.push(['09-smart-electrical.svg','09 · Smart elétrico funcional',
 box(55,155,250,90,'Fonte / fusível','Isolamento dos atuadores')+box(455,155,260,90,'Driver DC limitado','Motor do carretel')+box(865,155,260,90,'Driver STEP/DIR','Motor do guia')+line(305,200,455,200)+`<path d="M360,200 V130 H990 V155" fill="none" stroke="#d27925" stroke-width="4" marker-end="url(#arrow)"/>`+text(560,125,'Barramento DC comum',16)+box(430,340,290,125,'ESP32 proposto','Boot inibido; rearme local')+line(510,340,510,255,'PWM / DIR')+line(660,340,950,255,'STEP / DIR')+box(50,360,285,105,'Encoder + condicionamento','Somente sinais 3,3 V')+line(335,410,420,410,'A / B')+box(840,370,300,105,'Limites NC / falhas','Dois extremos; stop local')+line(840,425,730,425)+text(75,550,'DC-DC para lógica, retorno comum, pulls e proteção de transientes a detalhar.',22)+text(75,595,'Parada física independente do ESP32, Wi-Fi e navegador.',23),
 'Proposal only: final board, pins, currents, logic levels, wiring and fault diagnostics need verification.']);
views.push(['10-esp32-browser.svg','10 · ESP32 e navegador',
 box(70,230,285,140,'Navegador','Comandos / visualização')+box(455,230,285,140,'ESP32','Máquina de estados local')+box(840,230,285,140,'Atuadores','Permissivo físico separado')+line(355,265,455,265,'Pedido')+line(455,340,355,340,'Telemetria')+line(740,300,840,300,'Requisição')+text(90,460,'Demonstrador offline: SIMULATED. Não envia PWM real nem comprova conexão.',22)+text(90,510,'Integração real exige protocolo, watchdog e validação documentados.',22)+text(90,560,'O navegador não é uma parada de emergência.',24),
 'Control authority remains local; physical energy isolation must remain effective if browser or ESP32 fails.']);
views.push(['11-lite-smart-comparison.svg','11 · Comparação de arquitetura',
 box(60,155,500,415,'LITE','Transferência econômica, operação manual')+box(635,155,500,415,'SMART','Medição e guia automatizado propostos')+
 ['Motorredutor DC + PWM independente','Start / Stop e parada física','Tensor passivo + guia manual','Balança externa opcional','Sem MCU e sem medição linear digital'].map((s,i)=>text(85,285+i*48,s,21)).join('')+
 ['Motorredutor + ESP32 proposto','Roda e encoder lineares independentes','Guia de passo + dois limites NC','Falhas, watchdog e rearme local','Mesmo dever de proteção física'].map((s,i)=>text(660,285+i*48,s,21)).join(''),
 'Both versions transfer existing filament. Costs UNKNOWN until all included materials have valid quotations.']);
for(const [file,title,body,note]of views)await fs.writeFile(path.join(dir,file),sheet(title,body,note));
console.log(`Generated ${views.length} original concept SVGs.`);
