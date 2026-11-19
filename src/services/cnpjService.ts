export interface CnpjResult {
  cnpj: string
  companyName: string
  tradeName?: string
  representativeName?: string
  phone?: string
  email?: string
  cep?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  error?: string
}

export async function lookupCnpj(rawCnpj: string): Promise<CnpjResult> {
  const clean = rawCnpj.replace(/\D/g, '')
  if (clean.length !== 14) {
    return {
      cnpj: clean,
      companyName: '',
      error: 'CNPJ deve conter 14 dígitos.',
    }
  }

  // 1. Tentar BrasilAPI
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`, {
      headers: { Accept: 'application/json' },
    })

    if (res.ok) {
      const data = await res.json()
      const representative =
        Array.isArray(data.qsa) && data.qsa.length > 0
          ? data.qsa[0]?.nome_socio || data.qsa[0]?.nome_representante_legal || ''
          : ''

      const phone = data.ddd_telefone_1 ? `(${data.ddd_telefone_1.slice(0, 2)}) ${data.ddd_telefone_1.slice(2)}` : ''

      return {
        cnpj: clean,
        companyName: data.razao_social || '',
        tradeName: data.nome_fantasia || '',
        representativeName: representative,
        phone,
        email: data.email || '',
        cep: data.cep || '',
        street: data.logradouro || '',
        number: data.numero || '',
        complement: data.complemento || '',
        neighborhood: data.bairro || '',
        city: data.municipio || '',
        state: data.uf || '',
      }
    }
  } catch {
    // Tentar fallback
  }

  // 2. Fallback: MinhaReceita
  try {
    const res = await fetch(`https://minhareceita.org/${clean}`)
    if (res.ok) {
      const data = await res.json()
      const representative =
        Array.isArray(data.qsa) && data.qsa.length > 0
          ? data.qsa[0]?.nome_socio || ''
          : ''

      return {
        cnpj: clean,
        companyName: data.razao_social || '',
        tradeName: data.nome_fantasia || '',
        representativeName: representative,
        phone: data.ddd_telefone_1 || '',
        email: data.email || '',
        cep: data.cep || '',
        street: data.logradouro || '',
        number: data.numero || '',
        complement: data.complemento || '',
        neighborhood: data.bairro || '',
        city: data.municipio || '',
        state: data.uf || '',
      }
    }
  } catch {
    // Falha de rede ou timeout
  }

  return {
    cnpj: clean,
    companyName: '',
    error: 'CNPJ não encontrado ou serviço de consulta indisponível.',
  }
}
