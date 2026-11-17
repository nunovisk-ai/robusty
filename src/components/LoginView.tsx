import React, { useState } from 'react'
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  LogIn, 
  ShieldCheck, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import type { UserRole } from '../types'
import { supabase } from '../lib/supabase'

export interface CurrentUser {
  id: string
  email: string
  name: string
  role: UserRole
  roleLabel: string
  avatarLetter: string
}

// Senha padrão oficial compartilhada entre os usuários autorizados
export const DEFAULT_APP_PASSWORD = 'Robusty@2026'

// 3 Usuários autorizados cadastrados oficialmente para a operação
export const AUTHORIZED_USERS: CurrentUser[] = [
  {
    id: 'user-joao-ricardo',
    email: 'joaoricardo@grupomixfer.com.br',
    name: 'João Ricardo',
    role: 'admin',
    roleLabel: 'Diretoria & Administração',
    avatarLetter: 'J',
  },
  {
    id: 'user-norlando',
    email: 'norlando@ironparts.com.br',
    name: 'Norlando',
    role: 'comercial_norlando',
    roleLabel: 'Comercial & Vendas WhatsApp',
    avatarLetter: 'N',
  },
  {
    id: 'user-igor',
    email: 'igor@grupomixfer.com.br',
    name: 'Igor',
    role: 'gestao_igor',
    roleLabel: 'Logística, Fretes & Fiscal',
    avatarLetter: 'I',
  },
]

interface LoginViewProps {
  onLoginSuccess: (user: CurrentUser) => void
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail) {
      setErrorMessage('Por favor, informe seu e-mail corporativo.')
      return
    }

    if (!password) {
      setErrorMessage('Por favor, digite sua senha de acesso.')
      return
    }

    setIsLoading(true)

    try {
      // 1. Procurar nos usuários autorizados
      const matchedUser = AUTHORIZED_USERS.find(
        (u) => u.email.toLowerCase() === normalizedEmail
      )

      if (!matchedUser) {
        setErrorMessage('E-mail não autorizado ou não cadastrado no sistema.')
        setIsLoading(false)
        return
      }

      // 2. Verificar senha padrão oficial
      if (password === DEFAULT_APP_PASSWORD) {
        setSuccessMessage(`Bem-vindo(a), ${matchedUser.name}! Carregando painel...`)
        setTimeout(() => {
          onLoginSuccess(matchedUser)
        }, 500)
        return
      }

      // 3. Tentar também autenticação via Supabase Auth
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: password,
        })

        if (!error && data.user) {
          setSuccessMessage(`Bem-vindo(a), ${matchedUser.name}! Carregando painel...`)
          setTimeout(() => {
            onLoginSuccess(matchedUser)
          }, 500)
          return
        }
      } catch {
        // Fallback
      }

      setErrorMessage('Senha incorreta. Verifique suas credenciais.')
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao autenticar. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background Decor Ambient Gradients matching Robusty Orange */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-[#EA580C]/10 via-[#FF5C00]/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-[#EA580C]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-orange-100/40 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Logo (Clean & Transparent) */}
        <div className="flex justify-center pb-1">
          <img
            src={`${import.meta.env.BASE_URL}robusty-logo.png`}
            alt="Robusty"
            className="h-16 w-auto object-contain"
          />
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-nexo border border-slate-100 space-y-6">
          {/* Alerts */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>E-mail</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@empresa.com.br"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/20 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => alert('Para redefinir sua senha, solicite ao administrador do sistema.')}
                  className="text-[11px] text-[#EA580C] hover:text-[#FF5C00] font-semibold cursor-pointer"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/20 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-[#EA580C] border-slate-300 rounded focus:ring-[#EA580C] cursor-pointer accent-[#EA580C]"
                />
                <span className="text-xs text-slate-600 select-none">
                  Lembrar minhas credenciais
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-5 bg-[#EA580C] hover:bg-[#FF5C00] active:bg-orange-700 text-white rounded-full text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Entrar no Sistema</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security & System Info Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 px-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[11px] text-slate-500">Conexão Segura & Autenticada</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            CRM Robusty © 2026
          </span>
        </div>
      </div>
    </div>
  )
}
