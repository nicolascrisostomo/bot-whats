const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

const LIMITE = 15;
const SENHA_ADMIN = '1234';
const FILE = './lista.json';

function load() {
  return JSON.parse(fs.readFileSync(FILE));
}
function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function formatarData(d) {
  return String(d.getDate()).padStart(2, '0') + '/' +
         String(d.getMonth() + 1).padStart(2, '0');
}

function calcularProximoBoss() {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString();
}

function tituloBoss(iso) {
  const d = new Date(iso);
  return `👑 *Boss final ${formatarData(d)} 20h*`;
}

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('🤖 Bot conectado!');
});

client.on('message', msg => {
  if (!msg.body.startsWith('!')) return;

  let data = load();
  const textoLista = data.pessoas.map((n, i) => `${i+1}. ${n}`).join('\n') || '—';

  // LISTA
  if (msg.body === '!lista') {
    return msg.reply(
      `${data.dataBoss ? tituloBoss(data.dataBoss) : '👑 Boss final'}\n\n` +
      `📋 (${data.pessoas.length}/${LIMITE})\n\n${textoLista}\n\n` +
      `Status: ${data.aberta ? '🟢 Aberta' : '🔴 Fechada'}`
    );
  }

  // ENTRAR
  if (msg.body.startsWith('!entrar ')) {
    if (!data.aberta) return msg.reply('🔴 Lista fechada.');
    if (data.pessoas.length >= LIMITE) return msg.reply('❌ Lista cheia.');

    const nome = msg.body.replace('!entrar ', '').trim();
    if (data.pessoas.includes(nome)) return msg.reply('⚠️ Nome já está na lista.');

    data.pessoas.push(nome);
    save(data);
    return msg.reply(`✅ ${nome} entrou na lista!`);
  }

  // SAIR
  if (msg.body.startsWith('!sair ')) {
    const nome = msg.body.replace('!sair ', '').trim();
    data.pessoas = data.pessoas.filter(n => n !== nome);
    save(data);
    return msg.reply(`❌ ${nome} saiu da lista.`);
  }

  // ADMIN
  if (msg.body === `!abrir ${SENHA_ADMIN}`) {
    if (!data.dataBoss) data.dataBoss = calcularProximoBoss();
    data.aberta = true;
    save(data);
    return msg.reply(`🟢 Lista aberta!\n${tituloBoss(data.dataBoss)}`);
  }

  if (msg.body === `!fechar ${SENHA_ADMIN}`) {
    data.aberta = false;
    save(data);
    return msg.reply('🔴 Lista fechada.');
  }

  if (msg.body === `!limpar ${SENHA_ADMIN}`) {
    data.pessoas = [];
    save(data);
    return msg.reply('🧹 Lista limpa.');
  }

  if (msg.body === `!encerrar ${SENHA_ADMIN}`) {
    data.dataBoss = calcularProximoBoss();
    data.pessoas = [];
    data.aberta = false;
    save(data);
    return msg.reply(`🏁 Boss encerrado!\n\n📅 Próximo:\n${tituloBoss(data.dataBoss)}`);
  }
});

client.initialize();
