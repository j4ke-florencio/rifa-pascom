import { set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { dbRef } from "./firebase-config.js";

let totalNumeros = 540;
let precoNumero = 10;
let vendas = {}; 
let numeroSelecionado = null;
let roletaRodando = false;
let numeroParaDeletar = null;

const params = new URLSearchParams(window.location.search);
const vendedoraUrl = params.get('v'); 

onValue(dbRef, (snapshot) => {
    const dados = snapshot.val();
    if (dados) {
        totalNumeros = dados.totalNumeros || 540;
        precoNumero = dados.precoNumero || 10;
        vendas = dados.vendas || {};
        
        document.getElementById('input-qtd').value = totalNumeros;
        document.getElementById('input-preco').value = precoNumero;
        
        if (!roletaRodando) {
            renderizarGrid();
        }
        atualizarStats();
        renderizarLista();
        atualizarDatalistNomes();
    }
});

function sincronizarComNuvem() {
    set(dbRef, { totalNumeros, precoNumero, vendas });
}

function atualizarDatalistNomes() {
    const datalist = document.getElementById('lista-sugestoes-nomes');
    if (!datalist) return;
    datalist.innerHTML = '';
    const nomesUnicos = new Set();
    Object.values(vendas).forEach(v => { if (v && v.nome) nomesUnicos.add(v.nome); });
    nomesUnicos.forEach(nome => {
        const option = document.createElement('option');
        option.value = nome;
        datalist.appendChild(option);
    });
}

window.renderizarGrid = function() {
    const grid = document.getElementById('grid-rifa');
    const busca = document.getElementById('input-busca').value.toLowerCase().trim();
    const filtroVendedora = document.getElementById('filtro-vendedora').value;
    const filtroStatus = document.getElementById('filtro-status').value; 
    grid.innerHTML = '';
    let celulasGeradas = [];

    for (let i = 1; i <= totalNumeros; i++) {
        const cell = document.createElement('div');
        cell.className = 'numero-cell';
        cell.id = `cell-${i}`;
        cell.textContent = i;
        
        const venda = vendas[i];
        const estaEfetivado = venda ? (!venda.status || venda.status === 'pago' || venda.pago === true) : false;

        if (venda) {
            if (estaEfetivado) {
                if (venda.vendedora === 'Jakeline') cell.classList.add('vendido-jakeline');
                else if (venda.vendedora === 'Singridy') cell.classList.add('vendido-singridy');
                else if (venda.vendedora === 'Rayssa') cell.classList.add('vendido-rayssa');
                else if (venda.vendedora === 'Ana') cell.classList.add('vendido-ana');
            } else {
                cell.classList.add('status-var-pendente'); 
                cell.style.background = "radial-gradient(circle at 35% 35%, #f1c40f, #b78a06)";
                cell.style.color = "#000";
            }

            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            const textoStatus = estaEfetivado ? '' : ' [VAR]';
            tooltip.textContent = `${venda.nome} (${venda.vendedora})${textoStatus}`;
            cell.appendChild(tooltip);
        }

        let mostrar = true;

        if (busca) {
            const nomeMatch = venda && venda.nome.toLowerCase().includes(busca);
            const numMatch = String(i).includes(busca);
            if (!nomeMatch && !numMatch) mostrar = false;
        }
        
        if (filtroVendedora && (!venda || venda.vendedora !== filtroVendedora)) mostrar = false;

        if (filtroStatus) {
            if (filtroStatus === 'disponivel' && venda) mostrar = false;
            if (filtroStatus === 'var' && (!venda || estaEfetivado)) mostrar = false;
            if (filtroStatus === 'pago' && (!venda || !estaEfetivado)) mostrar = false;
        }

        if (mostrar) {
            cell.style.display = 'flex';
            cell.onclick = () => abrirModal(i);
            grid.appendChild(cell);
            celulasGeradas.push({ numero: i, elemento: cell });
        }
     }
}

window.abrirModal = function(numero) {
    numeroSelecionado = numero;
    const venda = vendas[numero];
    
    const estaEfetivado = venda ? (!venda.status || venda.status === 'pago' || venda.pago === true) : true;
    const statusTxt = venda ? (estaEfetivado ? ' (PAGO)' : ' (REVISANDO VAR 🟡)') : '';
    document.getElementById('modal-numero').textContent = `Número: ${numero}${statusTxt}`;
    
    const inputNome = document.getElementById('modal-nome');
    const selectVendedora = document.getElementById('modal-vendedora');
    const inputLote = document.getElementById('modal-lote');
    const btnRemoverWrapper = document.getElementById('btn-remover-wrapper');

    let labelFone = document.getElementById('modal-info-fone');
    if (!labelFone) {
        labelFone = document.createElement('p');
        labelFone.id = 'modal-info-fone';
        labelFone.style.fontSize = '13px';
        labelFone.style.margin = '5px 0 10px';
        labelFone.style.fontWeight = 'bold';
        inputNome.parentNode.insertBefore(labelFone, inputNome.nextSibling);
    }

    inputLote.value = '';
    atualizarDatalistNomes();

    if (venda) {
        inputNome.value = venda.nome;
        selectVendedora.value = venda.vendedora;
        selectVendedora.disabled = false;
        btnRemoverWrapper.style.display = 'block';
        inputLote.disabled = true;

        if (venda.fone && venda.fone !== "Não informado" && venda.fone !== "Lote Manual" && venda.fone !== "Confirmado no Painel") {
            const foneLimpo = venda.fone.replace(/\D/g, "");
            labelFone.innerHTML = `📞 Contato: <a href="https://wa.me/${foneLimpo.startsWith('55') ? foneLimpo : '55' + foneLimpo}" target="_blank" style="color:#2ecc71; text-decoration:underline;">${venda.fone} (Chamar no Whats)</a>`;
        } else {
            labelFone.textContent = '📞 Contato: Não informado (Venda Manual)';
        }
    } else {
        inputNome.value = '';
        labelFone.textContent = '';
        if (vendedoraUrl) {
            selectVendedora.value = vendedoraUrl;
            selectVendedora.disabled = true;
        } else {
            selectVendedora.value = 'Jakeline';
            selectVendedora.disabled = false;
        }
        btnRemoverWrapper.style.display = 'none';
        inputLote.disabled = false;
    }

    document.getElementById('modal').classList.add('ativo');
    setTimeout(() => inputNome.focus(), 150);
}

window.fecharModal = function() {
    document.getElementById('modal').classList.remove('ativo');
    numeroSelecionado = null;
}

window.confirmarVenda = function() {
    const nome = document.getElementById('modal-nome').value.trim();
    const selectVendedora = document.getElementById('modal-vendedora');
    const vendedora = selectVendedora.value;
    const loteTexto = document.getElementById('modal-lote').value.trim();
    
    if (!nome) { alert('Por favor, digite o nome do comprador!'); return; }
    if (numeroSelecionado === null) return;

    const agora = new Date();
    const data = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});

    let salvosLote = [numeroSelecionado];
    const foneExistente = vendas[numeroSelecionado] ? (vendas[numeroSelecionado].fone || "") : "";

    // Ajustado para remover a variável inexistente da roleta antiga
    vendas[numeroSelecionado] = { 
        nome, 
        vendedora, 
        data, 
        fone: foneExistente || "Confirmado no Painel",
        status: "pago" 
    };
    
    if (loteTexto) {
        const numerosExtras = loteTexto.split(',').map(num => parseInt(num.trim())).filter(num => !isNaN(num) && num > 0 && num <= totalNumeros);
        let numerosDuplicados = [];
        numerosExtras.forEach(num => {
            if (vendas[num] && num !== numeroSelecionado) {
                numerosDuplicados.push(num);
            } else {
                vendas[num] = { nome, vendedora, data, fone: "Lote Manual", status: "pago" };
                salvosLote.push(num);
            }
        });
        if (numerosDuplicados.length > 0) alert(`Aviso: Os números [${numerosDuplicados.join(', ')}] já estão reservados.`);
    }
    
    sincronizarComNuvem();
    fecharModal();
    const numerosUnicosSemDuplicados = [...new Set(salvosLote)];
    gerarComprovanteTexto(nome, numerosUnicosSemDuplicados, vendedora);
}

function gerarComprovanteTexto(nome, numeros, vendedora) {
    const totalPago = numeros.length * precoNumero;
    const texto = `🎟️ COMPROVANTE DE RIFA\n-------------------------\nComprador(a): ${nome}\nNúmero(s): ${numeros.sort((a,b)=>a-b).join(', ')}\nValor Total: R$ ${totalPago.toFixed(2).replace('.', ',')}\nVendedora: ${vendedora}\n\n⛪ Rifa Solidária PASCOM\nObrigado! Paz e bem! ❤️`;
    document.getElementById('texto-comprovante').value = texto;
    document.getElementById('modal-comprovante').classList.add('ativo');
}

window.copiarComprovanteText = function() {
    const campo = document.getElementById('texto-comprovante');
    campo.select();
    navigator.clipboard.writeText(campo.value);
    alert('Comprovante copiado!');
    document.getElementById('modal-comprovante').classList.remove('ativo');
}

window.compartilharStatus = function(tipo) {
    let lista = [];
    if (tipo === 'disponiveis') {
        for (let i = 1; i <= totalNumeros; i++) { if (!vendas[i]) lista.push(i); }
        const msg = `⛪ *NÚMEROS DISPONÍVEIS*\n\nGaranta sua chance por R$ 10!\n👉 ${lista.join(', ')}`;
        navigator.clipboard.writeText(msg);
        alert('Copiado disponíveis!');
    } else {
        Object.keys(vendas).sort((a,b)=>a-b).forEach(num => lista.push(num));
        const msg = `✅ *NÚMEROS VENDIDOS*\n\nVeja as reservas:\n👉 ${lista.join(', ')}`;
        navigator.clipboard.writeText(msg);
        alert('Copiado vendidos!');
    }
}

window.removerVenda = function() {
    if (numeroSelecionado !== null && vendas[numeroSelecionado]) {
        delete vendas[numeroSelecionado];
        sincronizarComNuvem();
        fecharModal();
    }
}

window.removerDaLista = function(numero) {
    numeroParaDeletar = numero;
    if (document.getElementById('confirm-numero-texto')) {
        document.getElementById('confirm-numero-texto').textContent = `Remover a venda do número ${numero}?`;
    }
    document.getElementById('modal-confirmacao-custom').classList.add('ativo');
}

document.getElementById('btn-cancelar-remocao').onclick = () => {
    document.getElementById('modal-confirmacao-custom').classList.remove('ativo');
    numeroParaDeletar = null;
};

document.getElementById('btn-confirmar-remocao-item').onclick = () => {
    if (numeroParaDeletar !== null) {
        delete vendas[numeroParaDeletar];
        sincronizarComNuvem();
        document.getElementById('modal-confirmacao-custom').classList.remove('ativo');
        numeroParaDeletar = null;
    }
};

window.gerarNumeros = function() {
    totalNumeros = parseInt(document.getElementById('input-qtd').value) || 540;
    precoNumero = parseFloat(document.getElementById('input-preco').value) || 10;
    sincronizarComNuvem();
}

window.limparTudo = function() {
    if (confirm('⚠️ Apagar tudo da nuvem?')) { vendas = {}; sincronizarComNuvem(); }
}

window.atualizarStats = function() {
    const vendidos = Object.keys(vendas).length;
    let countJakeline = 0, countSingridy = 0, countRayssa = 0, countAna = 0;
    Object.values(vendas).forEach(v => {
        if (v.vendedora === 'Jakeline') countJakeline++;
        else if (v.vendedora === 'Singridy') countSingridy++;
        else if (v.vendedora === 'Rayssa') countRayssa++;
        else if (v.vendedora === 'Ana') countAna++;
    });
    document.getElementById('stat-total').textContent = totalNumeros;
    document.getElementById('stat-vendidos').textContent = vendidos;
    document.getElementById('stat-disponiveis').textContent = totalNumeros - vendidos;
    document.getElementById('stat-arrecadado').textContent = 'R$ ' + (vendidos * precoNumero).toFixed(2).replace('.', ',');
    document.getElementById('stat-jakeline').textContent = countJakeline;
    document.getElementById('stat-singridy').textContent = countSingridy;
    document.getElementById('stat-rayssa').textContent = countRayssa;
    document.getElementById('stat-ana').textContent = countAna;
}

// 🔄 RENDERIZAR LISTA TOTALMENTE INTERLIGADA COM OS FILTROS DE SETINHA DO CABEÇALHO AZUL
window.renderizarLista = function() {
    const tbody = document.getElementById('lista-compradores');
    const busca = document.getElementById('input-busca').value.toLowerCase().trim();
    const filtroVendedoraTopo = document.getElementById('filtro-vendedora').value;
    const filtroStatusTopo = document.getElementById('filtro-status').value;
    
    // Captura os seletores embutidos na própria tabela
    const filtroTabelaOrdem = document.getElementById('filtro-tabela-ordem') ? document.getElementById('filtro-tabela-ordem').value : "crescente";
    const filtroTabelaTipoStatus = document.getElementById('filtro-tabela-tipo-status') ? document.getElementById('filtro-tabela-tipo-status').value : "todos";
    const filtroTabelaVendedora = document.getElementById('filtro-tabela-vendedora') ? document.getElementById('filtro-tabela-vendedora').value : "";

    if (!tbody) return;
    tbody.innerHTML = '';
    
    let entradas = Object.entries(vendas);

    // 1. Lógica de Ordenação (Crescente / Decrescente)
    if (filtroTabelaOrdem === "crescente") {
        entradas.sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
    } else {
        entradas.sort((a, b) => parseInt(b[0]) - parseInt(a[0]));
    }

    // 2. Filtros Globais do Topo
    if (busca) entradas = entradas.filter(([num, v]) => v.nome.toLowerCase().includes(busca) || String(num).includes(busca));
    if (filtroVendedoraTopo) entradas = entradas.filter(([num, v]) => v.vendedora === filtroVendedoraTopo);
    if (filtroStatusTopo) {
        if (filtroStatusTopo === 'disponivel') entradas = []; 
        if (filtroStatusTopo === 'var') entradas = entradas.filter(([num, v]) => !(!v.status || v.status === 'pago' || v.pago === true));
        if (filtroStatusTopo === 'pago') entradas = entradas.filter(([num, v]) => (!v.status || v.status === 'pago' || v.pago === true));
    }
    
    // 3. Filtros Específicos das Setinhas do Cabeçalho
    if (filtroTabelaTipoStatus !== "todos") {
        entradas = entradas.filter(([num, v]) => {
            const aprovado = !v.status || v.status === 'pago' || v.pago === true;
            return filtroTabelaTipoStatus === 'pago' ? aprovado : !aprovado;
        });
    }
    if (filtroTabelaVendedora) {
        entradas = entradas.filter(([num, v]) => v.vendedora === filtroTabelaVendedora);
    }
    
    if (entradas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="sem-registros">Nenhum comprador registrado correspondente aos filtros.</td></tr>';
        return;
    }

    entradas.forEach(([num, v]) => {
        let classeBadge = 'badge-jakeline';
        if (v.vendedora === 'Singridy') classeBadge = 'badge-singridy';
        else if (v.vendedora === 'Rayssa') classeBadge = 'badge-rayssa';
        else if (v.vendedora === 'Ana') classeBadge = 'badge-ana';

        const tr = document.createElement('tr');
        const estaEfetivado = !v.status || v.status === 'pago' || v.pago === true;
        const indicacaoVar = estaEfetivado ? '' : ' 🟡 (VAR)';
        
        tr.innerHTML = `
            <td style="padding:12px;"><strong>${num}</strong></td>
            <td style="padding:12px;">${v.nome}${indicacaoVar}</td>
            <td style="padding:12px;"><span class="badge-vendedora ${classeBadge}">${v.vendedora}</span></td>
            <td style="padding:12px;">${v.data}</td>
            <td class="acao-remover" style="padding:12px; color:#e74c3c; cursor:pointer; font-weight:bold;" onclick="window.removerDaLista('${num}')">
                🗑️ Remover
            </td>
        `;
        tbody.appendChild(tr);
    }); 
}


// Ouvintes de Eventos Atualizados e Vinculados
document.getElementById('input-busca').oninput = () => { renderizarGrid(); renderizarLista(); };
document.getElementById('filtro-vendedora').onchange = () => { renderizarGrid(); renderizarLista(); };
document.getElementById('btn-atualizar-config').onclick = () => window.gerarNumeros();
document.getElementById('btn-fechar-modal').onclick = () => window.fecharModal();
document.getElementById('btn-confirmar-venda').onclick = () => window.confirmarVenda();
document.getElementById('btn-remover-venda').onclick = () => window.removerVenda();
document.getElementById('filtro-status').onchange = () => { renderizarGrid(); renderizarLista(); };

// Ativadores das setinhas internas da tabela
if (document.getElementById('filtro-tabela-ordem')) {
    document.getElementById('filtro-tabela-ordem').onchange = () => window.renderizarLista();
}
if (document.getElementById('filtro-tabela-tipo-status')) {
    document.getElementById('filtro-tabela-tipo-status').onchange = () => window.renderizarLista();
}
if (document.getElementById('filtro-tabela-vendedora')) {
    document.getElementById('filtro-tabela-vendedora').onchange = () => window.renderizarLista();
}