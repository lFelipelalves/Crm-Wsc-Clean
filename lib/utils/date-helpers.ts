// Date utility functions

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatMonth(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function formatMonthShort(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function getCurrentCompetencia(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

export function shouldResetCobranca(dataInicio: Date | undefined, diaReset: number = 10): boolean {
  if (!dataInicio) return true
  const today = new Date()
  const currentDay = today.getDate()
  const initDay = dataInicio.getDate()
  const initMonth = dataInicio.getMonth()
  const currentMonth = today.getMonth()
  
  // If we're in a new month compared to dataInicio, reset is needed
  if (currentMonth !== initMonth) return true
  
  // If we're past the reset day and dataInicio is before it, reset is needed
  if (currentDay >= diaReset && initDay < diaReset) return true
  
  return false
}

export function getNextCobrancaDate(diaCobranca: number, currentDate: Date = new Date()): Date {
  const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), diaCobranca)
  if (nextDate < currentDate) {
    nextDate.setMonth(nextDate.getMonth() + 1)
  }
  return nextDate
}

export function formatDiaCobranca(dia: number): string {
  return `dia ${dia}`
}

export function getDaysAgo(date: Date): number {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}
