// Endpoint dinâmico. Se local, aponta pro local. Se público (GH Pages), fica vazio para acionar fallback amigável.
const BACKEND_ENDPOINT = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") 
    ? "http://localhost:8000/api/leads" 
    : "";

let atasData = [];

// DOM Elements
const grid = document.getElementById('atasGrid');
const template = document.getElementById('ataCardTemplate');
const filterCategoria = document.getElementById('filterCategoria');
const filterEstado = document.getElementById('filterEstado');
const searchInput = document.getElementById('searchInput');

// Load Data
async function loadAtas() {
    try {
        const response = await fetch('./data/atas_set_public.json');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        atasData = data.filter(ata => ata.publicavel);
        populateFilters(atasData);
        renderAtas(atasData);
        setupDirectContact(atasData[0]); 
    } catch (error) {
        grid.innerHTML = '<div style="color: #991b1b; padding:2rem;">Não foi possível carregar o catálogo de atas. Verifique a conexão.</div>';
        console.error('Erro ao carregar dados:', error);
    }
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function populateFilters(data) {
    const categorias = [...new Set(data.map(a => a.categoria_produto))].filter(Boolean);
    const estados = [...new Set(data.map(a => a.estado))].filter(Boolean);

    categorias.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat; opt.textContent = cat;
        filterCategoria.appendChild(opt);
    });

    estados.forEach(est => {
        const opt = document.createElement('option');
        opt.value = est; opt.textContent = est;
        filterEstado.appendChild(opt);
    });
}

function renderAtas(data) {
    grid.innerHTML = '';
    if (data.length === 0) {
        grid.innerHTML = '<div style="color: #526173; padding:2rem;">Nenhuma ata encontrada para os filtros selecionados.</div>';
        return;
    }

    data.forEach(ata => {
        const clone = template.content.cloneNode(true);
        
        clone.querySelector('.ata-status').textContent = ata.status_publico;
        clone.querySelector('.ata-id').textContent = `ATA ${ata.ata_numero}`;
        
        const imgContainer = clone.querySelector('.ata-product-image');
        const img = imgContainer.querySelector('img');
        if (ata.slug.includes('hq-290fv') || ata.slug.includes('hq290fv')) {
            img.src = 'assets/products/hq-290fv/hq-290fv-card.webp';
            img.onerror = function() {
                this.onerror = null;
                this.src = 'assets/product-freezer-hq-290fv.svg';
            };
        } else {
            img.src = `assets/products/${ata.slug}/${ata.slug}-card.webp`;
            img.onerror = function() {
                this.onerror = null;
                imgContainer.style.display = 'none';
            };
        }

        clone.querySelector('.ata-title').textContent = `${ata.produto}`;
        clone.querySelector('.ata-desc').textContent = ata.objeto_geral;
        
        clone.querySelector('.val-orgao').textContent = ata.sigla_orgao;
        clone.querySelector('.val-uasg').textContent = ata.uasg;
        clone.querySelector('.val-pregao').textContent = ata.pregao;
        clone.querySelector('.val-item').textContent = ata.item;
        clone.querySelector('.val-qtd').textContent = `${ata.quantidade_registrada} un`;
        clone.querySelector('.val-unit').textContent = formatCurrency(ata.valor_unitario);
        clone.querySelector('.val-total').textContent = formatCurrency(ata.valor_total);

        // Events
        const btnLead = clone.querySelector('.action-btn');
        btnLead.textContent = ata.cta_label || 'Solicitar informações';
        btnLead.addEventListener('click', () => openLeadModal(ata));

        const openProd = () => openProductModal(ata);
        imgContainer.addEventListener('click', openProd);
        imgContainer.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') openProd();
        });
        clone.querySelector('.btn-ver-produto').addEventListener('click', openProd);

        grid.appendChild(clone);
    });
}

function filterData() {
    const text = searchInput.value.toLowerCase();
    const cat = filterCategoria.value;
    const est = filterEstado.value;

    const filtered = atasData.filter(ata => {
        const matchText = !text || 
            ata.produto.toLowerCase().includes(text) || 
            ata.orgao.toLowerCase().includes(text) || 
            ata.uasg.includes(text) || 
            ata.pregao.toLowerCase().includes(text);
        
        const matchCat = !cat || ata.categoria_produto === cat;
        const matchEst = !est || ata.estado === est;

        return matchText && matchCat && matchEst;
    });

    renderAtas(filtered);
}

searchInput.addEventListener('input', filterData);
filterCategoria.addEventListener('change', filterData);
filterEstado.addEventListener('change', filterData);

// Contato Direto Principal
function setupDirectContact(ataBase) {
    if(!ataBase) return;
    const btnWpp = document.getElementById('btnWhatsappDirect');
    const btnEmail = document.getElementById('btnEmailDirect');
    
    const text = `Olá ${ataBase.contato_nome}, tenho interesse em informações sobre as Atas de Registro de Preços da SET Computadores.`;
    btnWpp.href = `${ataBase.contato_whatsapp_url}?text=${encodeURIComponent(text)}`;
    
    const mailToUrl = `mailto:${ataBase.contato_emails_publicos[0]}?cc=${ataBase.contato_emails_publicos[1] || ''}&subject=Contato - Atas de Registro de Preços SET`;
    btnEmail.href = mailToUrl;
}

// =======================
// MODAL DE PRODUTO
// =======================
const pModal = document.getElementById('productModal');

function openProductModal(ata) {
    const img = document.getElementById('pmImage');
    if (ata.slug.includes('hq-290fv') || ata.slug.includes('hq290fv')) {
        img.style.display = 'block';
        img.src = 'assets/products/hq-290fv/hq-290fv-modal.webp';
        img.onerror = function() {
            this.onerror = null;
            this.src = 'assets/product-freezer-hq-290fv.svg';
        };
    } else {
        img.style.display = 'block';
        img.src = `assets/products/${ata.slug}/${ata.slug}-modal.webp`;
        img.onerror = function() {
            this.onerror = null;
            this.style.display = 'none';
        };
    }

    document.getElementById('pmTitle').textContent = ata.produto;
    document.getElementById('pmDesc').textContent = ata.objeto_geral;

    const specsTable = document.getElementById('pmSpecsTable');
    specsTable.innerHTML = '';
    const addRow = (table, k, v) => {
        if(!v) return;
        const tr = document.createElement('tr');
        tr.innerHTML = `<th>${k}</th><td>${v}</td>`;
        table.appendChild(tr);
    };

    addRow(specsTable, 'Marca', ata.marca);
    addRow(specsTable, 'Fabricante', ata.fabricante);
    addRow(specsTable, 'Modelo', ata.modelo);
    addRow(specsTable, 'Garantia', ata.garantia);
    
    if(ata.especificacoes_publicas) {
        ata.especificacoes_publicas.forEach(spec => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="2" style="font-weight:400; color:#526173;">• ${spec}</td>`;
            specsTable.appendChild(tr);
        });
    }

    const ataTable = document.getElementById('pmAtaTable');
    ataTable.innerHTML = '';
    addRow(ataTable, 'Órgão Gerenciador', ata.orgao);
    addRow(ataTable, 'UASG', ata.uasg);
    addRow(ataTable, 'Ata Nº', ata.ata_numero);
    addRow(ataTable, 'Pregão', ata.pregao);
    addRow(ataTable, 'Processo Adm', ata.processo_administrativo);
    addRow(ataTable, 'Item', ata.item);
    addRow(ataTable, 'Qtd Registrada', `${ata.quantidade_registrada} unidades`);
    addRow(ataTable, 'Valor Unitário', formatCurrency(ata.valor_unitario));
    addRow(ataTable, 'Valor Total', formatCurrency(ata.valor_total));
    addRow(ataTable, 'Vigência', ata.vigencia_texto);

    // Botões
    const btnZap = document.getElementById('pmBtnZap');
    const btnEmail = document.getElementById('pmBtnEmail');
    const btnLead = document.getElementById('pmBtnLead');

    const wppMsg = `Olá ${ata.contato_nome}, tenho interesse na Ata nº ${ata.ata_numero} da ${ata.sigla_orgao}, referente ao ${ata.produto}.`;
    btnZap.onclick = () => window.open(`${ata.contato_whatsapp_url}?text=${encodeURIComponent(wppMsg)}`, '_blank');
    
    const mailTo = `mailto:${ata.contato_emails_publicos[0]}?cc=${ata.contato_emails_publicos[1] || ''}&subject=Ata ${ata.sigla_orgao} nº ${ata.ata_numero} - ${ata.produto}`;
    btnEmail.onclick = () => window.location.href = mailTo;

    btnLead.onclick = () => {
        closeProductModal();
        openLeadModal(ata);
    };

    pModal.classList.add('active');
}

function closeProductModal() {
    pModal.classList.remove('active');
}


// =======================
// MODAL DE LEAD
// =======================
const lModal = document.getElementById('leadModal');
const form = document.getElementById('leadForm');
const feedback = document.getElementById('formFeedback');
const btnSubmit = document.getElementById('btnSubmit');

let currentAta = null;

function openLeadModal(ata) {
    currentAta = ata;
    document.getElementById('modalAtaName').textContent = `${ata.produto} - Ata nº ${ata.ata_numero} / ${ata.sigla_orgao}`;
    document.getElementById('ataId').value = ata.ata_id;
    
    lModal.classList.add('active');
    feedback.className = 'feedback-msg';
    feedback.style.display = 'none';
    form.reset();
    btnSubmit.disabled = false;
}

function closeLeadModal() {
    lModal.classList.remove('active');
    currentAta = null;
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeProductModal();
        closeLeadModal();
    }
});

window.addEventListener('click', (e) => { 
    if (e.target == lModal) closeLeadModal(); 
    if (e.target == pModal) closeProductModal();
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const tWpp = document.getElementById('telefone_whatsapp').value;
    const tEmail = document.getElementById('email').value;
    if (!tWpp && !tEmail) {
        feedback.textContent = 'Forneça pelo menos um Telefone/WhatsApp ou E-mail para contato.';
        feedback.className = 'feedback-msg error';
        return;
    }

    const formData = {
        ata_id: document.getElementById('ataId').value,
        nome: document.getElementById('nome').value,
        orgao_entidade: document.getElementById('orgao_entidade').value,
        cargo_setor: document.getElementById('cargo_setor').value,
        telefone_whatsapp: tWpp,
        email: tEmail,
        cidade_estado: document.getElementById('cidade_estado').value,
        interesse: document.getElementById('interesse').value,
        mensagem: document.getElementById('mensagem').value,
        origem: document.getElementById('origem').value
    };

    btnSubmit.disabled = true;
    feedback.style.display = 'block';
    feedback.className = 'feedback-msg';
    feedback.textContent = 'Processando...';

    // Se não houver endpoint configurado (site público sem backend) aciona fallback.
    if (!BACKEND_ENDPOINT) {
        triggerFallback();
        return;
    }

    try {
        const response = await fetch(BACKEND_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            feedback.textContent = 'Solicitação enviada com sucesso! Entraremos em contato.';
            feedback.className = 'feedback-msg success';
            setTimeout(closeLeadModal, 3000);
        } else {
            throw new Error('Backend response not OK');
        }
    } catch (error) {
        console.warn('Backend indisponível:', error);
        triggerFallback();
    }
});

function triggerFallback() {
    if (currentAta) {
        const wppBase = currentAta.contato_whatsapp_url;
        const wppMsg = `Olá ${currentAta.contato_nome}, tenho interesse em informações sobre a Ata nº ${currentAta.ata_numero} da ${currentAta.sigla_orgao}, referente ao ${currentAta.produto}.`;
        const wppLink = `${wppBase}?text=${encodeURIComponent(wppMsg)}`;
        
        const emailTo = currentAta.contato_emails_publicos[0];
        const emailCc = currentAta.contato_emails_publicos[1] || '';
        const emailSub = `Solicitação de informações — Ata ${currentAta.sigla_orgao} nº ${currentAta.ata_numero} — ${currentAta.produto}`;
        
        feedback.innerHTML = `
            <strong>Atendimento Direto:</strong><br><br>
            Para maior agilidade, envie uma mensagem para ${currentAta.contato_nome} pelo <a href="${wppLink}" target="_blank" style="color:#0d4d9c; font-weight:700; text-decoration:underline;">WhatsApp</a> 
            ou via e-mail para <a href="mailto:${emailTo}?cc=${emailCc}&subject=${encodeURIComponent(emailSub)}" style="color:#0d4d9c; font-weight:700; text-decoration:underline;">${emailTo}</a>.
        `;
    } else {
        feedback.textContent = 'Por favor, use os botões de contato na página inicial.';
    }
    feedback.className = 'feedback-msg warning';
    btnSubmit.disabled = false;
}

// Boot
loadAtas();
