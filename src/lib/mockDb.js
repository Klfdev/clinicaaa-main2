export const mockDb = {
    clientes: [
        { id: '1', nome: 'João Silva', telefone: '11999887766', whatsapp: '11999887766', email: 'joao@email.com', observacoes: 'Gosta de corte baixo', created_at: '2025-01-10T10:00:00Z' },
        { id: '2', nome: 'Maria Souza', telefone: '11988776655', whatsapp: '11988776655', email: 'maria@email.com', observacoes: '', created_at: '2025-01-12T14:30:00Z' },
        { id: '3', nome: 'Pedro Santos', telefone: '11977665544', whatsapp: '11977665544', email: 'pedro@email.com', observacoes: 'Cliente fiel', created_at: '2025-01-15T09:00:00Z' },
        { id: '4', nome: 'Lucas Oliveira', telefone: '11966554433', whatsapp: '11966554433', email: 'lucas@email.com', observacoes: '', created_at: '2025-02-01T11:00:00Z' },
        { id: '5', nome: 'Ana Costa', telefone: '11955443322', whatsapp: '11955443322', email: 'ana@email.com', observacoes: '', created_at: '2025-02-05T16:00:00Z' },
        { id: '6', nome: 'Carlos Pereira', telefone: '11944332211', whatsapp: '11944332211', email: 'carlos@email.com', observacoes: 'Barba desenhada', created_at: '2025-02-10T10:00:00Z' },
        { id: '7', nome: 'Fernanda Lima', telefone: '11933221100', whatsapp: '11933221100', email: 'fernanda@email.com', observacoes: '', created_at: '2025-02-12T13:00:00Z' },
        { id: '8', nome: 'Rafael Almeida', telefone: '11922110099', whatsapp: '11922110099', email: 'rafael@email.com', observacoes: '', created_at: '2025-02-14T09:30:00Z' },
        { id: '9', nome: 'Bruno Rocha', telefone: '11911009988', whatsapp: '11911009988', email: 'bruno@email.com', observacoes: '', created_at: '2025-02-15T15:00:00Z' },
        { id: '10', nome: 'Gabriel Martins', telefone: '11900998877', whatsapp: '11900998877', email: 'gabriel@email.com', observacoes: '', created_at: '2025-02-18T11:00:00Z' }
    ],
    agendamentos: [
        // Hoje
        { id: '101', data: new Date().toISOString().split('T')[0], horario: '09:00', nomeCliente: 'João Silva', servico: 'Corte de Cabelo', telefone: '11999887766', clientes: { nome: 'João Silva', whatsapp: '11999887766' } },
        { id: '102', data: new Date().toISOString().split('T')[0], horario: '10:00', nomeCliente: 'Pedro Santos', servico: 'Barba', telefone: '11977665544', clientes: { nome: 'Pedro Santos', whatsapp: '11977665544' } },
        { id: '103', data: new Date().toISOString().split('T')[0], horario: '14:00', nomeCliente: 'Carlos Pereira', servico: 'Corte + Barba', telefone: '11944332211', clientes: { nome: 'Carlos Pereira', whatsapp: '11944332211' } },
        // Amanhã
        { id: '104', data: new Date(Date.now() + 86400000).toISOString().split('T')[0], horario: '11:00', nomeCliente: 'Lucas Oliveira', servico: 'Corte de Cabelo', telefone: '11966554433', clientes: { nome: 'Lucas Oliveira', whatsapp: '11966554433' } },
        { id: '105', data: new Date(Date.now() + 86400000).toISOString().split('T')[0], horario: '15:00', nomeCliente: 'Rafael Almeida', servico: 'Barba', telefone: '11922110099', clientes: { nome: 'Rafael Almeida', whatsapp: '11922110099' } },
        // Passado recente
        { id: '106', data: new Date(Date.now() - 86400000).toISOString().split('T')[0], horario: '09:00', nomeCliente: 'Ana Costa', servico: 'Corte', telefone: '11955443322', clientes: { nome: 'Ana Costa', whatsapp: '11955443322' } },
        { id: '107', data: new Date(Date.now() - 172800000).toISOString().split('T')[0], horario: '10:00', nomeCliente: 'Fernanda Lima', servico: 'Pezinho', telefone: '11933221100', clientes: { nome: 'Fernanda Lima', whatsapp: '11933221100' } }
    ],
    vendas: [
        { id: '201', data_venda: new Date().toISOString(), itens: [{ nome: 'Pomada Modeladora', quantidade: 2, preco: 25.00 }, { nome: 'Corte', quantidade: 1, preco: 30.00 }], total: 80.00, cliente_nome: 'João Silva', forma_pagamento: 'dinheiro', profiles: { full_name: 'Barbeiro Admin' } },
        { id: '202', data_venda: new Date().toISOString(), itens: [{ nome: 'Corte + Barba', quantidade: 1, preco: 50.00 }], total: 50.00, cliente_nome: 'Pedro Santos', forma_pagamento: 'cartao_credito', profiles: { full_name: 'Barbeiro Admin' } },
        { id: '203', data_venda: new Date(Date.now() - 86400000).toISOString(), itens: [{ nome: 'Shampoo', quantidade: 1, preco: 25.00 }], total: 25.00, cliente_nome: 'Carlos Pereira', forma_pagamento: 'pix', profiles: { full_name: 'Barbeiro Admin' } },
        { id: '204', data_venda: new Date(Date.now() - 172800000).toISOString(), itens: [{ nome: 'Corte', quantidade: 1, preco: 35.00 }], total: 35.00, cliente_nome: 'Ana Costa', forma_pagamento: 'dinheiro', profiles: { full_name: 'Barbeiro Admin' } }
    ],
    financeiro: [
        { id: '301', tipo: 'entrada', valor: 80.00, descricao: 'Venda #201', data: new Date().toISOString() },
        { id: '302', tipo: 'entrada', valor: 50.00, descricao: 'Venda #202', data: new Date().toISOString() },
        { id: '303', tipo: 'entrada', valor: 25.00, descricao: 'Venda #203', data: new Date(Date.now() - 86400000).toISOString() },
        { id: '304', tipo: 'saida', valor: 150.00, descricao: 'Compra de Produtos', data: new Date(Date.now() - 86400000).toISOString() },
        { id: '305', tipo: 'saida', valor: 100.00, descricao: 'Conta de Luz', data: new Date(Date.now() - 432000000).toISOString() }
    ],
    estoque: [
        { id: '401', nome: 'Pomada Modeladora', quantidade: 5, precoVenda: 25.00, descricao: 'Fixação forte' },
        { id: '402', nome: 'Shampoo Anti-Caspa', quantidade: 8, precoVenda: 30.00, descricao: 'Limpeza profunda' },
        { id: '403', nome: 'Balm para Barba', quantidade: 3, precoVenda: 20.00, descricao: 'Hidratação' },
        { id: '404', nome: 'Navalhas Descartáveis', quantidade: 50, precoVenda: 0.50, descricao: 'Caixa com 100' },
        { id: '405', nome: 'Gel Fixador', quantidade: 12, precoVenda: 15.00, descricao: 'Efeito molhado' }
    ],
    servicos: [
        { id: '501', nome: 'Corte de Cabelo', precoVenda: 35.00, descricao: 'Corte moderno ou clássico' },
        { id: '502', nome: 'Barba', precoVenda: 25.00, descricao: 'Barba com toalha quente' },
        { id: '503', nome: 'Corte + Barba', precoVenda: 50.00, descricao: 'Combo promocional' },
        { id: '504', nome: 'Pezinho/Acabamento', precoVenda: 10.00, descricao: 'Apenas os contornos' },
        { id: '505', nome: 'Sobrancelha', precoVenda: 10.00, descricao: 'Na navalha ou pinça' }
    ],
    profiles: [
        { id: 'mock-user-id', full_name: 'Barbeiro Admin', email: 'admin@barberpro.com', role: 'admin' },
        { id: 'mock-barber-2', full_name: 'Carlos Navalha', email: 'carlos@barberpro.com', role: 'barbeiro' }
    ],
    movimentacoes_estoque: [
        { id: '601', item_id: '401', tipo: 'entrada', quantidade: 10, motivo: 'Compra Inicial', data: new Date(Date.now() - 864000000).toISOString() },
        { id: '602', item_id: '401', tipo: 'saida', quantidade: 2, motivo: 'Venda', data: new Date(Date.now() - 86400000).toISOString() },
        { id: '603', item_id: '403', tipo: 'entrada', quantidade: 5, motivo: 'Reposição', data: new Date(Date.now() - 432000000).toISOString() }
    ],
    configuracoes: [
        { id: 'config-1', cor_primaria: '#D4AF37', nome_barbearia: 'BarberPro Vintage' }
    ]
};
