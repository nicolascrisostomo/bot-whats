
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 🔹 servidor fake só pra manter vivo
app.get('/', (req, res) => {
  res.send('Bot WhatsApp rodando 🚀');
});

app.listen(PORT, () => {
  console.log('Servidor ativo na porta', PORT);
});

// 🔹 WhatsApp
const client = new Client({
  authStrategy: new LocalAuth()
});

const ARQUIVO = './lista.json';
const LIMITE = 15;
const INTERVALO_DIAS = 14;

function carregar() {
  return JSON.parse(fs.readFileSync(ARQUIVO));
}

function salvar(dados) {
  fs.writeFileSync(ARQUIVO, JSON.stringify(dados, null, 2));
}

client.on('qr', qr => {
  console.log('ESCANEIE O QR CODE');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('🤖 Bot conectado!');
});

client.on('message', msg => {
  if (!msg.body) return;

  const texto = msg.body.trim();
  const dados = carregar();

  // !entrar Nome
  if (texto.toLowerCase().startsWith('!entrar ')) {
    const nome = texto.slice(8).trim();

    if (dados.nomes.includes(nome))
      return msg.reply('❌ Nome já está na lista.');

    if (dados.nomes.length >= LIMITE)
      return msg.reply('❌ Lista cheia.');

    dados.nomes.push(nome);
    salvar(dados);
    msg.reply(`✅ ${nome} entrou na lista.`);
  }

  // !lista
  if (texto === '!lista') {
    let resposta = `📋 *${dados.titulo}*\n\n`;
    dados.nomes.forEach((n, i) => {
      resposta += `${i + 1}. ${n}\n`;
    });
    msg.reply(resposta || 'Lista vazia.');
  }

  // !encerrar
  if (texto === '!encerrar') {
    const hoje = new Date();
    const proxima = new Date(hoje);
    proxima.setDate(proxima.getDate() + INTERVALO_DIAS);

    dados.nomes = [];
    dados.titulo = `Boss final ${proxima.toLocaleDateString('pt-BR')}`;
    salvar(dados);

    msg.reply(`🔄 Lista encerrada.\nPróximo: *${dados.titulo}*`);
  }
});

client.initialize();
