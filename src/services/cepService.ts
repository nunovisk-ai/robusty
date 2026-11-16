export interface CepResult {
  cep: string
  street: string
  neighborhood: string
  city: string
  state: string
  error?: string
}

export async function lookupCep(rawCep: string): Promise<CepResult> {
  const clean = rawCep.replace(/\D/g, '')
  if (clean.length !== 8) {
    return { cep: clean, street: '', neighborhood: '', city: '', state: '', error: 'CEP deve conter 8 dígitos' }
  }

  // 1. Try BrasilAPI
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${clean}`, {
      headers: { Accept: 'application/json' },
    })
    if (res.ok) {
      const data = await res.json()
      return {
        cep: clean,
        street: data.street || '',
        neighborhood: data.neighborhood || '',
        city: data.city || '',
        state: data.state || '',
      }
    }
  } catch {
    // fallback to ViaCEP
  }

  // 2. Fallback to ViaCEP
  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
    if (res.ok) {
      const data = await res.json()
      if (!data.erro) {
        return {
          cep: clean,
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || '',
        }
      }
    }
  } catch {
    // network error
  }

  return {
    cep: clean,
    street: '',
    neighborhood: '',
    city: '',
    state: '',
    error: 'CEP não encontrado ou serviço indisponível',
  }
}
