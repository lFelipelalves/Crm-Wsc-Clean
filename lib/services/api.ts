import {
  mockEmpresas,
  mockContatos,
  mockAtividades,
  mockOnboardings,
  mockTarefasOnboarding,
  mockFechamentos,
} from '../mock-data'
import type {
  Empresa,
  ContatoEmpresa,
  Atividade,
  TipoAtividade,
  StatusAtividade,
  OnboardingCliente,
  OnboardingTarefa,
  FechamentoMensal,
} from '../types'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Empresas API
export async function getEmpresas(): Promise<Empresa[]> {
  await delay(300)
  return mockEmpresas
}

export async function getEmpresaById(id: string): Promise<Empresa | null> {
  await delay(200)
  return mockEmpresas.find((e) => e.id === id) || null
}

export async function createEmpresa(empresa: Omit<Empresa, 'id'>): Promise<Empresa> {
  await delay(400)
  const newEmpresa = { ...empresa, id: `${Date.now()}` }
  mockEmpresas.push(newEmpresa)
  return newEmpresa
}

export async function updateEmpresa(id: string, empresa: Partial<Empresa>): Promise<Empresa | null> {
  await delay(400)
  const index = mockEmpresas.findIndex((e) => e.id === id)
  if (index === -1) return null
  mockEmpresas[index] = { ...mockEmpresas[index], ...empresa }
  return mockEmpresas[index]
}

// Contatos API
export async function getContatosByEmpresa(empresaId: string): Promise<ContatoEmpresa[]> {
  await delay(200)
  return mockContatos.filter((c) => c.empresaId === empresaId)
}

export async function createContato(contato: Omit<ContatoEmpresa, 'id'>): Promise<ContatoEmpresa> {
  await delay(300)
  const newContato = { ...contato, id: `${Date.now()}` }
  mockContatos.push(newContato)
  return newContato
}

export async function deleteContato(id: string): Promise<boolean> {
  await delay(300)
  const index = mockContatos.findIndex((c) => c.id === id)
  if (index === -1) return false
  mockContatos.splice(index, 1)
  return true
}

export async function updateContato(
  id: string,
  updates: Partial<ContatoEmpresa>
): Promise<ContatoEmpresa | null> {
  await delay(300)
  const index = mockContatos.findIndex((c) => c.id === id)
  if (index === -1) return null
  mockContatos[index] = { ...mockContatos[index], ...updates }
  return mockContatos[index]
}

// Atividades API
export async function getAtividades(tipoAtividade?: TipoAtividade): Promise<Atividade[]> {
  await delay(300)
  if (!tipoAtividade) return mockAtividades
  return mockAtividades.filter((a) => a.tipoAtividade === tipoAtividade)
}

export async function getAtividadesByTipo(tipo: TipoAtividade): Promise<Atividade[]> {
  await delay(300)
  return mockAtividades.filter((a) => a.tipoAtividade === tipo)
}

export async function getAtividadesByEmpresa(empresaId: string): Promise<Atividade[]> {
  await delay(300)
  return mockAtividades.filter((a) => a.empresaId === empresaId)
}

export async function getAtividadeById(id: string): Promise<Atividade | null> {
  await delay(200)
  return mockAtividades.find((a) => a.id === id) || null
}

export async function createAtividade(atividade: Omit<Atividade, 'id'>): Promise<Atividade> {
  await delay(400)
  const newAtividade = { ...atividade, id: `${Date.now()}` }
  mockAtividades.push(newAtividade)
  return newAtividade
}

export async function updateAtividade(
  id: string,
  updates: Partial<Atividade>
): Promise<Atividade | null> {
  await delay(300)
  const index = mockAtividades.findIndex((a) => a.id === id)
  if (index === -1) return null
  
  mockAtividades[index] = {
    ...mockAtividades[index],
    ...updates,
  }
  return mockAtividades[index]
}

// Onboarding API
export async function getOnboardings(): Promise<OnboardingCliente[]> {
  await delay(300)
  return mockOnboardings
}

export async function getOnboardingById(id: string): Promise<OnboardingCliente | null> {
  await delay(200)
  return mockOnboardings.find((o) => o.id === id) || null
}

export async function getTarefasByOnboarding(onboardingId: string): Promise<OnboardingTarefa[]> {
  await delay(200)
  return mockTarefasOnboarding.filter((t) => t.onboardingId === onboardingId)
}

export async function updateOnboarding(
  id: string,
  updates: Partial<OnboardingCliente>
): Promise<OnboardingCliente | null> {
  await delay(300)
  const index = mockOnboardings.findIndex((o) => o.id === id)
  if (index === -1) return null
  
  mockOnboardings[index] = {
    ...mockOnboardings[index],
    ...updates,
  }
  return mockOnboardings[index]
}

// Fechamentos API
export async function getFechamentos(): Promise<FechamentoMensal[]> {
  await delay(300)
  return mockFechamentos
}

export async function updateFechamento(
  id: string,
  updates: Partial<FechamentoMensal>
): Promise<FechamentoMensal | null> {
  await delay(300)
  const index = mockFechamentos.findIndex((f) => f.id === id)
  if (index === -1) return null
  
  mockFechamentos[index] = {
    ...mockFechamentos[index],
    ...updates,
  }
  return mockFechamentos[index]
}
